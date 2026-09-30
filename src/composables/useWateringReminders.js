import { onBeforeUnmount, reactive, readonly } from 'vue'
import { todayISO } from '../utils/date'
import {
  getNotificationPermission,
  requestNotificationPermission,
  showWateringNotification,
} from '../services/notification'
import { hasWateringReminder, markWateringReminded } from '../services/reminderStore'

// 单例：整个应用只有一份提醒状态和一个调度器，多个组件同时调用也不会重复通知。
const CHECK_INTERVAL_MS = 60 * 1000

const reminderState = reactive({
  permission: 'default',
  today: todayISO(),
  inPageAlerts: [],
})

let getDuePlants = () => []
let timerId = null
let listenerCount = 0
let lastCheckedAt = 0

function evaluateDuePlants() {
  const plants = getDuePlants() || []
  plants.forEach((plant) => {
    if (hasWateringReminder(plant.id)) return

    if (reminderState.permission === 'granted') {
      if (showWateringNotification(plant, reminderState.today)) {
        markWateringReminded(plant.id)
        return
      }
      // 系统通知发送失败（权限被运行时撤销等）时，本次降级为页内提示
    }
    pushInPageAlert(plant)
    markWateringReminded(plant.id)
  })
}

function pushInPageAlert(plant) {
  if (reminderState.inPageAlerts.some((alert) => alert.plantId === plant.id)) return
  reminderState.inPageAlerts.unshift({
    plantId: plant.id,
    name: plant.name,
    location: plant.location,
    status: plant.wateringStatus,
  })
  // 页内提示只保留最近几条，避免长期未处理时刷屏
  if (reminderState.inPageAlerts.length > 5) reminderState.inPageAlerts.length = 5
}

function rollOverDay() {
  const current = todayISO()
  if (current === reminderState.today) return
  reminderState.today = current
  // 新的一天重新开始：清掉昨天的页内提示；已提醒记录在 reminderStore 中按日期自动重置
  reminderState.inPageAlerts = []
}

// 合并定时器与可见性回调：节流并防止短时间内重复检查
function checkReminders() {
  const now = Date.now()
  if (now - lastCheckedAt < 1000) return
  lastCheckedAt = now
  rollOverDay()
  evaluateDuePlants()
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') checkReminders()
}

async function enableReminders() {
  const permission = await requestNotificationPermission()
  reminderState.permission = permission
  checkReminders()
}

function dismissAlert(plantId) {
  const index = reminderState.inPageAlerts.findIndex((alert) => alert.plantId === plantId)
  if (index !== -1) reminderState.inPageAlerts.splice(index, 1)
}

// duePlantsGetter 返回当前待浇水植株（带 wateringStatus），由根组件注入保证数据最新
export function useWateringReminders(duePlantsGetter) {
  if (typeof duePlantsGetter === 'function') getDuePlants = duePlantsGetter
  reminderState.permission = getNotificationPermission()

  listenerCount += 1
  if (listenerCount === 1) {
    timerId = window.setInterval(checkReminders, CHECK_INTERVAL_MS)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', checkReminders)
    checkReminders()
  }

  onBeforeUnmount(() => {
    listenerCount -= 1
    if (listenerCount > 0) return
    window.clearInterval(timerId)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('focus', checkReminders)
    timerId = null
  })

  return {
    reminderState: readonly(reminderState),
    enableReminders,
    dismissAlert,
  }
}
