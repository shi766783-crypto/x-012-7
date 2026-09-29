export const PLANT_CATEGORIES = ['观叶', '观花', '多肉', '蔬菜', '香草', '其他']
export const LOCATIONS = ['阳台', '客厅', '卧室', '庭院', '其他']
export const LIGHT_NEEDS = ['全阳', '半阴', '耐阴']
export const CARE_TYPES = ['浇水', '施肥', '修剪', '换盆', '喷药']
export const BLOOM_STATES = ['未开花', '花苞期', '盛开', '凋谢']

export const ACHIEVEMENTS = [
  { id: 'first-plant', name: '初次种植', description: '添加第一株植物', points: 10 },
  { id: 'plant-five', name: '窗台成林', description: '管理 5 株植物', points: 20 },
  { id: 'plant-ten', name: '绿意满屋', description: '管理 10 株植物', points: 35 },
  { id: 'green-thumb', name: '绿手指', description: '平均养护评分达到 80', points: 30 },
  { id: 'watering-rookie', name: '准时浇水', description: '完成 5 次浇水记录', points: 20 },
  { id: 'watering-master', name: '浇水达人', description: '完成 20 次浇水记录', points: 45 },
  { id: 'fertilizer-care', name: '营养师', description: '完成 5 次施肥记录', points: 25 },
  { id: 'bloom-garden', name: '花开满园', description: '记录 3 株开花植物', points: 35 },
  { id: 'growth-watcher', name: '生长观察员', description: '记录 10 条生长指标', points: 25 },
  { id: 'plant-doctor', name: '植物医生', description: '记录并处理 3 条病虫害', points: 30 },
  { id: 'thirty-day-goal', name: '坚持 30 天', description: '达成连续 30 天按时浇水目标', points: 60 },
  { id: 'garden-master', name: '园艺大师', description: '总积分达到 180', points: 80 },
]

export const DEFAULT_GOALS = [
  {
    id: 'goal-30-watering',
    title: '连续30天按时浇水',
    targetDays: 30,
    progressDays: 0,
    completed: false,
  },
]
