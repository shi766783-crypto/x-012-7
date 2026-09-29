<script setup>
import { ACHIEVEMENTS } from '../constants/garden'

const props = defineProps({
  earned: {
    type: Array,
    required: true,
  },
})

function isEarned(id) {
  return props.earned.some((item) => item.id === id)
}
</script>

<template>
  <section class="panel">
    <div class="panel-heading">
      <h2>成就徽章</h2>
      <span>{{ earned.length }} / {{ ACHIEVEMENTS.length }}</span>
    </div>
    <div class="badge-grid">
      <article v-for="achievement in ACHIEVEMENTS" :key="achievement.id" :class="['badge-card', { earned: isEarned(achievement.id) }]">
        <strong>{{ achievement.name }}</strong>
        <p>{{ achievement.description }}</p>
        <span>{{ achievement.points }} 分</span>
      </article>
    </div>
  </section>
</template>
