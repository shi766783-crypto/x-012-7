/* 园艺管家 Service Worker
 * 职责：
 * 1. 让通知在页面长时间后台时仍由系统弹出（showNotification）
 * 2. 点击通知时聚焦已打开的标签页，没有则打开首页
 * 3. 支持 periodicBackgroundSync（部分 Chromium）：浏览器择机唤醒页面复查
 */
const PERIODIC_TAG = 'watering-daily-check'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('notificationclick', (event) => {
  const { tag, data } = event.notification
  event.notification.close()
  event.waitUntil(focusOrOpenApp(tag, data && data.url))
})

async function focusOrOpenApp(tag, targetPath) {
  const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })

  for (const client of allClients) {
    if ('focus' in client) {
      client.postMessage({ type: 'NOTIFICATION_CLICKED', tag: tag || '' })
      return client.focus()
    }
  }

  const url = new URL(targetPath || '/', self.registration.scope).href
  return self.clients.openWindow(url)
}

// 页面/SW 事件要求复查时，唤醒所有受控页面执行一次去重评估
async function requestDueCheck() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true })
  clients.forEach((client) => client.postMessage({ type: 'SW_DUE_CHECK' }))
}

self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'CHECK_DUE') return
  event.waitUntil(requestDueCheck())
})

// 周期性后台同步（浏览器支持有限，仅作增强，不影响主流程）
self.addEventListener('periodicsync', (event) => {
  if (event.tag === PERIODIC_TAG) {
    event.waitUntil(requestDueCheck())
  }
})
