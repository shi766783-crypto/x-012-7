import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { todayISO } from '../utils/date'
import {
  evaluateDueReminders,
  isAfterReminderTime,
  loadNotificationSettings,
  nextCheckDelay,
  notificationSupport,
  requestNotificationPermission,
  sendTestNotification,
} from '../services/notification'
import { getDueWateringPlants } from '../services/gardenRules'

/**
 * 浇水通知调度：
 * - 启动 / 植物数据变化 / 每分钟 / 页面重新可见 / SW 唤醒 时评估
 * - 权限允许：走系统通知（SW showNotification，后台标签也能弹出）
 * - 权限被拒或浏览器不支持：降级为页内横幅
 * - 同一天同一株在通知账簿中只记录一次，轮询/跨天恢复都不会重复打扰
 */
export function useWateringNotifications(plantsRef) {
  const permission = ref(notificationSupport.permission)
  const supported = ref(notificationSupport.supported)
  const reminderTime = ref(loadNotificationSettings().reminderTime)
  const inAppAlerts = ref([])
  const lastCheckedDay = ref(todayISO())

  let minuteTimer = null
  let scheduleToken = 0

  // 被拒/不支持时，今天仍应在页内提示；系统通知成功时 inApp 为空
  const effectiveMode = computed(() =>
    permission.value === 'granted' ? 'system' : 'inapp',
  )

  async function evaluate(force = false) {
    const today = todayISO()
    lastCheckedDay.value = today

    // 未到当天提醒时刻，不主动打扰（用户打开页面仍能看到清单）
    if (!force && !isAfterReminderTime(reminderTime.value)) return

    const duePlants = getDueWateringPlants(plantsRef.value, today)
    if (!duePlants.length) {
      inAppAlerts.value = []
      return
    }

    const { inApp } = await evaluateDueReminders(duePlants, {
      mode: effectiveMode.value,
      day: today,
    })

    if (inApp.length) {
      // 去重账簿已保证同一天不会重复进入这里；直接替换为本次新提醒
      inAppAlerts.value = inApp.map((plant) => ({
        id: plant.id,
        name: plant.name,
        location: plant.location,
        wateringStatus: plant.wateringStatus,
        wateringFrequency: plant.wateringFrequency,
        day: today,
      }))
    }
  }

  // 自校准轮询：用 setTimeout 对齐整分钟，避免标签页长期运行后定时器漂移累积
  function scheduleNext() {
    clearTimeout(minuteTimer)
    const token = scheduleToken
    minuteTimer = setTimeout(() => {
      if (token !== scheduleToken) return
      rolloverIfNeeded()
      evaluate()
      scheduleNext()
    }, nextCheckDelay())
  }

  // 跨天（电脑过夜 / 后台恢复 / 修改系统时间）：
  // 账簿按日期分桶，天然只在新的一天再次提醒；清掉前一天的页内横幅
  function rolloverIfNeeded() {
    const today = todayISO()
    if (today !== lastCheckedDay.value) {
      inAppAlerts.value = []
      lastCheckedDay.value = today
    }
  }

  function handleVisibility() {
    if (document.visibilityState !== 'visible') return
    rolloverIfNeeded()
    // 从后台切回时立即复查：到期当天打开电脑就能补弹一次
    evaluate()
  }

  function onSwMessage(event) {
    if (event.data && event.data.type === 'SW_DUE_CHECK') {
      rolloverIfNeeded()
      evaluate()
    }
  }

  async function enable() {
    const result = await requestNotificationPermission()
    permission.value = result
    if (result === 'granted') {
      inAppAlerts.value = []
      await sendTestNotification()
      registerPeriodicSync()
      await evaluate(true)
    }
    return result
  }

  function dismissInApp(plantId) {
    inAppAlerts.value = inAppAlerts.value.filter((item) => item.id !== plantId)
  }

  function dismissAllInApp() {
    inAppAlerts.value = []
  }

  // 注册 Service Worker（作用域 /sw.js → 全站）
  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return
    try {
      await navigator.serviceWorker.register('/sw.js')
      navigator.serviceWorker.addEventListener('message', onSwMessage)
    } catch (error) {
      // SW 注册失败不影响页面内 new Notification 兜底
      console.warn('Service Worker 注册失败，通知仍可在页面打开时生效。', error)
    }
  }

  // 渐进增强：支持 periodicSync 的浏览器（多为已安装 PWA）可在页面未打开时唤醒复查；
  // 不支持或被拒绝时静默跳过，主流程不依赖它。
  async function registerPeriodicSync() {
    if (!('serviceWorker' in navigator) || permission.value !== 'granted') return
    try {
      const reg = await navigator.serviceWorker.ready
      if (!('periodicSync' in reg)) return
      const status = await navigator.permissions?.query({ name: 'periodic-background-sync' })
      if (status && status.state !== 'granted') return
      await reg.periodicSync.register('watering-daily-check', {
        minInterval: 12 * 60 * 60 * 1000, // 浏览器可按电量/网络情况放宽
      })
    } catch {
      // 忽略：该能力只是增强
    }
  }

  // 植物数据变化（刚浇完水会从待办中消失；新增植物可能立刻到期）时复查
  const stopWatch = watch(
    () => plantsRef.value,
    () => evaluate(),
    { deep: true },
  )

  registerServiceWorker()
  evaluate()
  scheduleNext()
  document.addEventListener('visibilitychange', handleVisibility)
  window.addEventListener('focus', handleVisibility)

  onBeforeUnmount(() => {
    scheduleToken += 1
    clearTimeout(minuteTimer)
    document.removeEventListener('visibilitychange', handleVisibility)
    window.removeEventListener('focus', handleVisibility)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', onSwMessage)
    }
    stopWatch()
  })

  return {
    supported,
    permission,
    reminderTime,
    inAppAlerts,
    enable,
    dismissInApp,
    dismissAllInApp,
    evaluateNow: () => evaluate(true),
  }
}
