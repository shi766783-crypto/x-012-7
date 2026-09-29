<script setup>
import { formatDate } from '../utils/date'

defineProps({
  plants: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <section class="panel">
    <div class="panel-heading">
      <h2>今日待浇水</h2>
      <span>{{ plants.length }} 株</span>
    </div>
    <div v-if="!plants.length" class="empty-state">今天没有待浇水植物，节奏不错。</div>
    <div v-else class="reminder-list">
      <article v-for="plant in plants" :key="plant.id" class="reminder-item">
        <div>
          <strong>{{ plant.name }}</strong>
          <p>{{ plant.location }} · 每 {{ plant.wateringFrequency }} 天浇水 · 上次 {{ formatDate(plant.lastWateredDate) }}</p>
        </div>
        <span :class="['status-pill', plant.wateringStatus === '已过期' ? 'danger' : 'warning']">
          {{ plant.wateringStatus }}
        </span>
      </article>
    </div>
  </section>
</template>
