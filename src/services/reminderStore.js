import { todayISO } from '../utils/date'

// 记录“今天已经提醒过哪些植株”，按本地日期分桶。
// 跨天后旧记录整体丢弃，保证同一株植物同一天最多提醒一次，且跨天能再次提醒。
const REMINDER_STORAGE_KEY = 'home-garden-care:watering-reminders:v1'

function loadRaw() {
  try {
    const raw = localStorage.getItem(REMINDER_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.plantIds)) return parsed
  } catch (error) {
    // 数据损坏时按“今天尚未提醒”处理
  }
  return null
}

function getFreshBucket() {
  const today = todayISO()
  const stored = loadRaw()
  if (stored && stored.date === today) return { date: today, plantIds: new Set(stored.plantIds) }
  return { date: today, plantIds: new Set() }
}

function persist(bucket) {
  try {
    localStorage.setItem(
      REMINDER_STORAGE_KEY,
      JSON.stringify({ date: bucket.date, plantIds: [...bucket.plantIds] }),
    )
  } catch (error) {
    // 存储不可用（隐私模式等）时退化为仅本次会话内去重
  }
}

export function hasWateringReminder(plantId) {
  const bucket = getFreshBucket()
  return bucket.plantIds.has(plantId)
}

export function markWateringReminded(plantId) {
  const bucket = getFreshBucket()
  if (bucket.plantIds.has(plantId)) return
  bucket.plantIds.add(plantId)
  persist(bucket)
}
