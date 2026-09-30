import { todayISO, toISODate } from '../utils/date'

const SETTINGS_KEY = 'home-garden-care:notifications:v1'
const LEDGER_KEY = 'home-garden-care:notified-ledger:v1'
const DEFAULT_REMINDER_TIME = '09:00'

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export const notificationSupport = {
  // 非安全上下文（如 http 局域网 IP）或老旧浏览器中 Notification 不可用
  get supported() {
    return typeof window !== 'undefined' && 'Notification' in window
  },
  get permission() {
    return this.supported ? Notification.permission : 'unsupported'
  },
}

export function loadNotificationSettings() {
  const settings = safeParse(localStorage.getItem(SETTINGS_KEY), {})
  return {
    reminderTime: settings.reminderTime || DEFAULT_REMINDER_TIME,
  }
}

export function saveNotificationSettings(patch) {
  const next = { ...loadNotificationSettings(), ...patch }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  return next
}

/**
 * 去重账簿：{ '2026-09-30': ['plant-1', 'plant-2'] }
 * 同一天同一株只记录一次；只保留最近 7 天，避免无限增长。
 */
export function loadLedger() {
  return safeParse(localStorage.getItem(LEDGER_KEY), {})
}

function persistLedger(ledger) {
  const days = Object.keys(ledger).sort()
  const latest = days[days.length - 1]
  // 以账簿最新一天为基准裁剪 7 天前的旧条目（不依赖运行机器时钟，便于跨天场景）
  const cutoff = new Date(`${latest}T00:00:00`)
  cutoff.setDate(cutoff.getDate() - 7)
  const cutoffISO = toISODate(cutoff)

  const pruned = Object.fromEntries(
    Object.entries(ledger)
      .filter(([day]) => day >= cutoffISO)
      .map(([day, ids]) => [day, Array.from(new Set(ids))]),
  )
  localStorage.setItem(LEDGER_KEY, JSON.stringify(pruned))
  return pruned
}

export function wasNotifiedToday(plantId, day = todayISO()) {
  return Boolean(loadLedger()[day]?.includes(plantId))
}

function markNotified(plantIds, day = todayISO()) {
  if (!plantIds.length) return
  const ledger = loadLedger()
  const existing = new Set(ledger[day] || [])
  plantIds.forEach((id) => existing.add(id))
  ledger[day] = [...existing]
  persistLedger(ledger)
}

/**
 * 申请通知权限。必须由用户手势触发（按钮点击）。
 * 返回最终权限状态；不支持时返回 'unsupported'。
 */
export async function requestNotificationPermission() {
  if (!notificationSupport.supported) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'

  // 部分 Safari 仍使用回调形式
  const result = await new Promise((resolve) => {
    const promise = Notification.requestPermission(resolve)
    if (promise && typeof promise.then === 'function') {
      promise.then(resolve).catch(() => resolve('denied'))
    }
  })
  return result
}

/**
 * 判断本地时间是否已到当天的提醒时刻（HH:mm）。
 */
export function isAfterReminderTime(time = loadNotificationSettings().reminderTime, now = new Date()) {
  const [hour, minute] = time.split(':').map(Number)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  return currentMinutes >= hour * 60 + minute
}

/**
 * 计算下一次检查的延迟（毫秒）：对齐到下一个整分钟，
 * 跨天/时钟变化后自然会重新评估，无需依赖长定时器。
 */
export function nextCheckDelay(now = new Date()) {
  return (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
}

/**
 * 通过 ServiceWorker 展示通知。后台/被节流的标签页中
 * SW 展示的通知也由系统直接弹出，比页面内 new Notification 可靠。
 * 返回是否成功走系统通知。
 */
async function showSystemNotification({ title, body, tag, timestamp }) {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    if (notificationSupport.permission === 'granted') {
      const notification = new Notification(title, { body, tag, timestamp })
      return { shown: true, notification }
    }
    return { shown: false }
  }

  const reg = await navigator.serviceWorker.ready
  await reg.showNotification(title, {
    body,
    tag,
    renotify: false, // 同 tag 不重复打扰
    timestamp,
  })
  return { shown: true }
}

/**
 * 评估当前待浇水植物并发出提醒。
 *
 * @param {Array} duePlants 当天待浇水/已过期的植物（含 wateringStatus）
 * @param {object} options
 * @param {string} options.mode 'system' | 'inapp'，被拒或不支持时用 inapp
 * @param {string} options.day  评估对应的本地日期，跨天重放时可显式传入
 * @returns {Promise<{notified: Array, inApp: Array}>} 本次实际提醒的植物
 */
export async function evaluateDueReminders(duePlants, { mode = 'system', day = todayISO() } = {}) {
  const ledger = loadLedger()
  const already = new Set(ledger[day] || [])
  const pending = duePlants.filter((plant) => plant.alive !== false && !already.has(plant.id))

  if (!pending.length) return { notified: [], inApp: [] }

  const notified = []
  const inApp = []
  const timestamp = Date.now()

  if (mode === 'system' && notificationSupport.permission === 'granted') {
    for (const plant of pending) {
      const overdue = plant.wateringStatus === '已过期'
      try {
        await showSystemNotification({
          title: overdue ? `【${plant.name}】浇水已逾期` : `该给「${plant.name}」浇水了`,
          body: overdue
            ? `${plant.location || ''}已超过浇水周期，今天尽快补水。`.trim()
            : `${plant.location || ''} · 每 ${plant.wateringFrequency} 天一次，今天正好到期。`.trim(),
          tag: `watering-${day}-${plant.id}`,
          timestamp,
        })
        notified.push(plant.id)
      } catch (error) {
        // 系统通知失败（如某些移动浏览器限制）时降级为页内提示
        console.warn('系统通知发送失败，改用页内提示。', error)
        inApp.push(plant)
      }
    }
  } else {
    inApp.push(...pending)
  }

  const allNotifiedIds = [...notified, ...inApp.map((plant) => plant.id)]
  if (allNotifiedIds.length) markNotified(allNotifiedIds, day)

  return {
    notified: pending.filter((plant) => notified.includes(plant.id)),
    inApp,
  }
}

/**
 * 发送一条测试通知，用于验证权限与系统通道是否正常。
 */
export async function sendTestNotification() {
  if (notificationSupport.permission !== 'granted') return false
  await showSystemNotification({
    title: '园艺管家通知已开启',
    body: '到了浇水日，你会在这里收到一次提醒。',
    tag: 'watering-test',
    timestamp: Date.now(),
  })
  return true
}
