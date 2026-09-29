<script setup>
defineProps({
  dashboard: {
    type: Object,
    required: true,
  },
  goals: {
    type: Array,
    required: true,
  },
  achievements: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <section class="dashboard">
    <article class="metric">
      <span>植物总数</span>
      <strong>{{ dashboard.totalPlants }}</strong>
    </article>
    <article class="metric urgent">
      <span>今日待浇水</span>
      <strong>{{ dashboard.dueWatering }}</strong>
    </article>
    <article class="metric">
      <span>本月施肥</span>
      <strong>{{ dashboard.monthlyFertilizing }}</strong>
    </article>
    <article class="metric">
      <span>存活率</span>
      <strong>{{ dashboard.survivalRate }}%</strong>
    </article>
    <article class="metric">
      <span>平均养护评分</span>
      <strong>{{ dashboard.averageScore }}</strong>
    </article>
    <article class="metric achievement-score">
      <span>成就积分</span>
      <strong>{{ achievements.points }}</strong>
    </article>
  </section>

  <section class="panel goal-panel">
    <div class="panel-heading">
      <h2>养护目标</h2>
      <span>{{ achievements.earned.length }} / 12 枚徽章</span>
    </div>
    <div v-for="goal in goals" :key="goal.id" class="goal-row">
      <div>
        <strong>{{ goal.title }}</strong>
        <p>{{ goal.progressDays }} / {{ goal.targetDays }} 天</p>
      </div>
      <progress :max="goal.targetDays" :value="goal.progressDays"></progress>
    </div>
  </section>
</template>
