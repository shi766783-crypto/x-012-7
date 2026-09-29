const STORAGE_KEY = 'home-garden-care-manager:v1'

export function loadGardenState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (error) {
    console.warn('读取本地园艺数据失败，已回退为空数据。', error)
    return null
  }
}

export function saveGardenState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
