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
  <section class="panel plant-list-panel">
    <div class="panel-heading">
      <h2>我的植物</h2>
      <span>{{ plants.length }} 个档案</span>
    </div>
    <div class="plant-grid">
      <article v-for="plant in plants" :key="plant.id" class="plant-card">
        <img v-if="plant.photo" :src="plant.photo" :alt="plant.name" />
        <div v-else class="plant-placeholder">{{ plant.name.slice(0, 1) }}</div>
        <div class="plant-card-body">
          <div class="plant-title">
            <h3>{{ plant.name }}</h3>
            <span :class="['status-pill', plant.wateringStatus === '已过期' ? 'danger' : plant.wateringStatus === '待浇水' ? 'warning' : 'ok']">
              {{ plant.wateringStatus }}
            </span>
          </div>
          <p>{{ plant.variety || '未填写品种' }}</p>
          <div class="plant-tags">
            <span>{{ plant.category }}</span>
            <span>{{ plant.location }}</span>
            <span>{{ plant.lightNeed }}</span>
          </div>
          <dl>
            <div>
              <dt>购买</dt>
              <dd>{{ formatDate(plant.purchaseDate) }}</dd>
            </div>
            <div>
              <dt>花盆</dt>
              <dd>{{ plant.potSize || '未填写' }}</dd>
            </div>
            <div>
              <dt>土壤</dt>
              <dd>{{ plant.soilType || '未填写' }}</dd>
            </div>
          </dl>
        </div>
      </article>
    </div>
  </section>
</template>
