<script setup>
import { formatDate } from '../utils/date'

const props = defineProps({
  plants: {
    type: Array,
    required: true,
  },
  permission: {
    type: String,
    default: 'default',
  },
  alerts: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['enable', 'dismiss'])
</script>

<template>
  <section class="panel">
    <div class="panel-heading">
      <h2>今日待浇水</h2>
      <span>{{ plants.length }} 株</span>
    </div>

    <div v-if="permission === 'default'" class="notice-banner">
      <div>
        <strong>开启浏览器通知，到点主动提醒你浇水。</strong>
        <p>授权后即使页面停在后台也会弹出系统通知；拒绝则只在页面内提示。</p>
      </div>
      <button type="button" class="primary-action notice-action" @click="emit('enable')">开启提醒</button>
    </div>

    <div v-else-if="permission === 'denied'" class="notice-banner notice-banner--muted">
      <div>
        <strong>浏览器通知权限已关闭，当前使用页内提醒。</strong>
        <p>可在浏览器地址栏的站点设置中重新允许通知，恢复到点主动提醒。</p>
      </div>
      <span class="notice-fallback">页内提示</span>
    </div>

    <div v-else-if="permission === 'unsupported'" class="notice-banner notice-banner--muted">
      <div>
        <strong>当前浏览器不支持系统通知，将使用页内提醒。</strong>
      </div>
      <span class="notice-fallback">页内提示</span>
    </div>

    <div v-if="alerts.length" class="inpage-alerts">
      <article
        v-for="alert in alerts"
        :key="alert.plantId"
        class="inpage-alert"
        role="status"
      >
        <div>
          <strong>该给「{{ alert.name }}」浇水了</strong>
          <p>{{ alert.location || '未记录位置' }} · {{ alert.status === '已过期' ? '已超过浇水周期，请尽快补水' : '今天到了浇水日' }}</p>
        </div>
        <button type="button" class="alert-close" aria-label="知道了" @click="emit('dismiss', alert.plantId)">
          知道了
        </button>
      </article>
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
