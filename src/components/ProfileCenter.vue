<script setup>
import GrowthCanvas from './GrowthCanvas.vue'
import { formatDate } from '../utils/date'

defineProps({
  plants: {
    type: Array,
    required: true,
  },
  careRecords: {
    type: Array,
    required: true,
  },
  achievements: {
    type: Object,
    required: true,
  },
  getPlantTimeline: {
    type: Function,
    required: true,
  },
  getPlantGrowth: {
    type: Function,
    required: true,
  },
})
</script>

<template>
  <section class="panel profile-panel">
    <div class="panel-heading">
      <h2>个人中心</h2>
      <span>{{ achievements.points }} 积分</span>
    </div>

    <div class="profile-layout">
      <aside>
        <h3>我的植物列表</h3>
        <ul class="simple-list">
          <li v-for="plant in plants" :key="plant.id">{{ plant.name }} · {{ plant.location }}</li>
        </ul>

        <h3>最近养护记录</h3>
        <ul class="simple-list">
          <li v-for="record in careRecords.slice(0, 6)" :key="record.id">
            {{ formatDate(record.date) }} · {{ record.type }}
          </li>
        </ul>
      </aside>

      <div class="profile-main">
        <article v-for="plant in plants" :key="plant.id" class="plant-detail">
          <div class="plant-detail-heading">
            <h3>{{ plant.name }}生长曲线</h3>
            <span>{{ getPlantGrowth(plant.id).length }} 条指标</span>
          </div>
          <GrowthCanvas :records="getPlantGrowth(plant.id)" />
          <div class="timeline">
            <div v-for="item in getPlantTimeline(plant.id).slice(0, 5)" :key="item.id" class="timeline-item">
              <time>{{ formatDate(item.date) }}</time>
              <strong>{{ item.title }}</strong>
              <p>{{ item.detail }}</p>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
