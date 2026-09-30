// 核心通知逻辑的轻量验证：用最小桩模拟浏览器环境
import assert from 'node:assert'

const store = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
}

const shown = []
let currentPermission = 'granted'
class FakeNotification {
  constructor(title, options) {
    shown.push({ title, ...options })
  }
  static permission = 'granted'
  static requestPermission(cb) {
    return Promise.resolve(currentPermission)
  }
}
globalThis.Notification = FakeNotification
globalThis.window = globalThis
globalThis.navigator = {} // 无 SW → 走 new Notification 兜底路径

const {
  evaluateDueReminders,
  requestNotificationPermission,
  wasNotifiedToday,
  loadLedger,
} = await import('../src/services/notification.js')

const plant = (id, status) => ({
  id,
  name: `植物${id}`,
  location: '客厅',
  wateringFrequency: 3,
  wateringStatus: status,
  alive: true,
})

// 1. 首次评估：两株待浇水都应出通知
const due = [plant('p1', '待浇水'), plant('p2', '已过期')]
let r1 = await evaluateDueReminders(due, { day: '2026-09-20' })
assert.equal(r1.notified.length, 2, '首次应通知 2 株')
assert.equal(shown.length, 2, '应弹出 2 条系统通知')
assert.ok(shown.some((n) => n.tag === 'watering-2026-09-20-p1'))
assert.ok(shown.some((n) => n.title.includes('逾期')), '逾期通知标题应提示逾期')

// 2. 同一天再次评估（轮询/切回标签）：不重复打扰
let r2 = await evaluateDueReminders(due, { day: '2026-09-20' })
assert.equal(r2.notified.length, 0, '同一天不应重复通知')
assert.equal(shown.length, 2, '不应新增通知')
assert.ok(wasNotifiedToday('p1', '2026-09-20'))

// 3. 浇完一株后另一株仍不重复（只剩 p2 待浇水）
let r3 = await evaluateDueReminders([plant('p2', '已过期')], { day: '2026-09-20' })
assert.equal(r3.notified.length, 0, '已通知过的 p2 不重复')

// 4. 跨天：新的一天到期植物重新通知一次
let r4 = await evaluateDueReminders(due, { day: '2026-09-21' })
assert.equal(r4.notified.length, 2, '跨天后应再次通知')
assert.equal(shown.length, 4)

// 5. 权限被拒 / 不支持 → 降级为页内 inApp，且同样写账簿去重
currentPermission = 'denied'
FakeNotification.permission = 'denied'
let r5 = await evaluateDueReminders([plant('p3', '待浇水')], { mode: 'inapp', day: '2026-09-28' })
assert.equal(r5.inApp.length, 1, '降级模式应产生 1 条页内提醒')
assert.equal(r5.notified.length, 0)
let r6 = await evaluateDueReminders([plant('p3', '待浇水')], { mode: 'inapp', day: '2026-09-28' })
assert.equal(r6.inApp.length, 0, '页内提醒同一天也只出现一次')

// 6. 已死亡植物不提醒
let r7 = await evaluateDueReminders(
  [{ ...plant('p9', '待浇水'), alive: false }],
  { day: '2026-09-29' },
)
assert.equal(r7.notified.length, 0)
assert.equal(r7.inApp.length, 0)

// 7. 权限申请：denied 时如实返回
assert.equal(await requestNotificationPermission(), 'denied')

// 8. 账簿只保留近 7 天（2026-09-20 在以 2026-09-29 为基准时会被清理）
const ledger = loadLedger()
assert.ok(!('2026-09-20' in ledger), '7 天外的账簿条目应被清理')
assert.ok('2026-09-28' in ledger)

console.log('全部通知逻辑测试通过 ✓')
