// 浏览器系统通知的能力封装：调用方只关心“授权 / 拒绝 / 不支持”三种结果。

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission || 'default'
}

export function requestNotificationPermission() {
  if (!isNotificationSupported()) return Promise.resolve('unsupported')

  try {
    const result = Notification.requestPermission()
    // 旧版 Safari 使用回调形式且不返回 Promise
    if (result && typeof result.then === 'function') return result
    return new Promise((resolve) => Notification.requestPermission(resolve))
  } catch (error) {
    return Promise.resolve('denied')
  }
}

// 发送成功返回 true；构造失败（极端环境/权限被运行时撤销）返回 false，由调用方降级
export function showWateringNotification(plant, dateISO) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return false

  const locationLine = plant.location ? `位置：${plant.location}` : ''
  const bodyLine =
    plant.wateringStatus === '已过期'
      ? '已超过浇水周期，请尽快补水。'
      : `每 ${plant.wateringFrequency} 天浇一次水，今天别忘了。`

  try {
    const notification = new Notification(`该给「${plant.name}」浇水了`, {
      body: [locationLine, bodyLine].filter(Boolean).join('\n'),
      // tag 带日期与植株 id，即使检查逻辑重复触发，浏览器也会合并同一条通知
      tag: `watering-${plant.id}-${dateISO}`,
      lang: 'zh-CN',
    })
    notification.onclick = () => {
      try {
        window.focus()
      } catch (error) {
        // 部分浏览器限制脚本聚焦，忽略即可
      }
      notification.close()
    }
    return true
  } catch (error) {
    console.warn('浏览器通知发送失败，将降级为页内提示。', error)
    return false
  }
}
