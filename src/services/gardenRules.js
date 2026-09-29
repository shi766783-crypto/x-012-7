import { ACHIEVEMENTS } from '../constants/garden'
import { daysBetween, monthOf, todayISO } from '../utils/date'

export function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function getWateringStatus(plant, today = todayISO()) {
  const lastWatered = plant.lastWateredDate || plant.purchaseDate || today
  const elapsed = daysBetween(lastWatered, today)
  const frequency = Number(plant.wateringFrequency) || 1

  if (elapsed === 0) return '已浇水'
  if (elapsed < frequency) return '已浇水'
  if (elapsed === frequency) return '待浇水'
  return '已过期'
}

export function getDueWateringPlants(plants, today = todayISO()) {
  return plants
    .map((plant) => ({ ...plant, wateringStatus: getWateringStatus(plant, today) }))
    .filter((plant) => plant.wateringStatus === '待浇水' || plant.wateringStatus === '已过期')
    .sort((a, b) => statusWeight(b.wateringStatus) - statusWeight(a.wateringStatus))
}

export function getDashboard(plants, careRecords, growthRecords) {
  const currentMonth = monthOf(todayISO())
  const alivePlants = plants.filter((plant) => plant.alive !== false)
  const duePlants = getDueWateringPlants(plants)
  const monthlyFertilizing = careRecords.filter(
    (record) => record.type === '施肥' && monthOf(record.date) === currentMonth,
  ).length
  const survivalRate = plants.length ? Math.round((alivePlants.length / plants.length) * 100) : 100
  const averageScore = calculateAverageCareScore(plants, careRecords, growthRecords)

  return {
    totalPlants: plants.length,
    dueWatering: duePlants.length,
    monthlyFertilizing,
    survivalRate,
    averageScore,
  }
}

export function buildTimeline(plantId, careRecords, growthRecords, pestRecords) {
  const careItems = careRecords
    .filter((record) => record.plantId === plantId)
    .map((record) => ({
      id: record.id,
      date: record.date,
      title: record.type,
      detail: record.note || record.amount || '已记录养护操作',
      photo: record.photo,
    }))
  const growthItems = growthRecords
    .filter((record) => record.plantId === plantId)
    .map((record) => ({
      id: record.id,
      date: record.date,
      title: '生长指标',
      detail: `高度 ${record.height || 0} cm，叶片 ${record.leafCount || 0} 片，${record.bloomState}`,
    }))
  const pestItems = pestRecords
    .filter((record) => record.plantId === plantId)
    .map((record) => ({
      id: record.id,
      date: record.date,
      title: '病虫害记录',
      detail: `${record.symptom}；${record.recovery || '恢复情况待观察'}`,
    }))

  return [...careItems, ...growthItems, ...pestItems].sort((a, b) => b.date.localeCompare(a.date))
}

export function calculateAchievements(plants, careRecords, growthRecords, pestRecords, goals) {
  const wateringCount = careRecords.filter((record) => record.type === '浇水').length
  const fertilizingCount = careRecords.filter((record) => record.type === '施肥').length
  const bloomingPlants = new Set(
    growthRecords.filter((record) => record.bloomState === '盛开').map((record) => record.plantId),
  ).size
  const dashboard = getDashboard(plants, careRecords, growthRecords)
  const earnedIds = new Set()

  if (plants.length >= 1) earnedIds.add('first-plant')
  if (plants.length >= 5) earnedIds.add('plant-five')
  if (plants.length >= 10) earnedIds.add('plant-ten')
  if (dashboard.averageScore >= 80) earnedIds.add('green-thumb')
  if (wateringCount >= 5) earnedIds.add('watering-rookie')
  if (wateringCount >= 20) earnedIds.add('watering-master')
  if (fertilizingCount >= 5) earnedIds.add('fertilizer-care')
  if (bloomingPlants >= 3) earnedIds.add('bloom-garden')
  if (growthRecords.length >= 10) earnedIds.add('growth-watcher')
  if (pestRecords.length >= 3) earnedIds.add('plant-doctor')
  if (goals.some((goal) => goal.completed || goal.progressDays >= goal.targetDays)) earnedIds.add('thirty-day-goal')

  const provisionalPoints = ACHIEVEMENTS.filter((item) => earnedIds.has(item.id)).reduce(
    (sum, item) => sum + item.points,
    0,
  )
  if (provisionalPoints >= 180) earnedIds.add('garden-master')

  const earned = ACHIEVEMENTS.filter((item) => earnedIds.has(item.id))
  const points = earned.reduce((sum, item) => sum + item.points, 0)

  return { earned, points }
}

export function updateWateringGoal(goals, careRecords) {
  const wateringDates = [...new Set(careRecords.filter((record) => record.type === '浇水').map((record) => record.date))]
    .sort()
    .reverse()
  const streak = countCurrentStreak(wateringDates)

  return goals.map((goal) => {
    if (goal.id !== 'goal-30-watering') return goal
    return {
      ...goal,
      progressDays: Math.min(streak, goal.targetDays),
      completed: streak >= goal.targetDays,
    }
  })
}

export function buildLeaderboards(plants, careRecords, growthRecords) {
  const groups = plants.map((plant) => {
    const plantCare = careRecords.filter((record) => record.plantId === plant.id)
    const plantGrowth = growthRecords.filter((record) => record.plantId === plant.id)
    const completeness = Math.min(100, plantCare.length * 8 + plantGrowth.length * 10)
    const survival = plant.alive === false ? 0 : 100
    return {
      id: plant.id,
      name: plant.name,
      score: Math.round(survival * 0.6 + completeness * 0.4),
      blooms: plantGrowth.filter((record) => record.bloomState === '盛开').length,
    }
  })

  return {
    gardenExperts: [...groups].sort((a, b) => b.score - a.score).slice(0, 5),
    bloomLeaders: [...groups].sort((a, b) => b.blooms - a.blooms).slice(0, 5),
  }
}

function calculateAverageCareScore(plants, careRecords, growthRecords) {
  if (!plants.length) return 100
  const scores = plants.map((plant) => {
    const status = getWateringStatus(plant)
    const statusScore = status === '已过期' ? 45 : status === '待浇水' ? 75 : 95
    const recordScore = Math.min(100, careRecords.filter((record) => record.plantId === plant.id).length * 12)
    const growthScore = Math.min(100, growthRecords.filter((record) => record.plantId === plant.id).length * 18)
    return Math.round(statusScore * 0.55 + recordScore * 0.3 + growthScore * 0.15)
  })
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
}

function countCurrentStreak(descDates) {
  let cursor = todayISO()
  let streak = 0
  const dates = new Set(descDates)

  while (dates.has(cursor)) {
    streak += 1
    const date = new Date(`${cursor}T00:00:00`)
    date.setDate(date.getDate() - 1)
    cursor = date.toISOString().slice(0, 10)
  }

  return streak
}

function statusWeight(status) {
  return status === '已过期' ? 2 : status === '待浇水' ? 1 : 0
}
