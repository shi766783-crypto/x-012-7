<script setup>
import { formatDate } from '../utils/date'
import InAppReminders from './InAppReminders.vue'

const props = defineProps({
  plants: {
    type: Array,
    required: true,
  },
  notificationSupported: {
    type: Boolean,
    default: true,
  },
  notificationPermission: {
    type: String,
    default: 'default',
  },
  inAppAlerts: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['enable-notifications', 'dismiss-alert', 'dismiss-all-alerts'])
</script>

<template>
  <InAppReminders
    :alerts="inAppAlerts"
    @dismiss="emit('dismiss-alert', $event)"
    @dismiss-all="emit('dismiss-all-alerts')"
  />

  <section class="panel">
    <div class="panel-heading">
      <h2>今日待浇水</h2>
      <span>{{ plants.length }} 株</span>
    </div>

    <!-- 通知权限状态条：默认 → 引导申请；允许 → 说明已生效；被拒 → 说明降级为页内提示 -->
    <div
      v-if="notificationSupported && notificationPermission === 'default'"
      class="notify-banner"
      data-testid="notify-prompt"
    >
      <p>开启浏览器通知后，浇水日到点会主动提醒你，即使页面在后台。</p>
      <button type="button" class="primary-action" @click="emit('enable-notifications')">
        开启到点提醒
      </button>
    </div>
    <div
      v-else-if="notificationSupported && notificationPermission === 'granted'"
      class="notify-banner granted"
      data-testid="notify-granted"
    >
      <p>✓ 浏览器通知已开启，浇水日当天只提醒一次，不会重复打扰。</p>
    </div>
    <div
      v-else
      class="notify-banner denied"
      data-testid="notify-denied"
    >
      <p>
        浏览器通知{{ notificationSupported ? '已被关闭' : '在当前环境不可用' }}，
        已降级为页内提示。{{ notificationSupported ? '可在浏览器站点设置中重新开启。' : '' }}
      </p>
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

<style scoped>
.notify-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
  padding: 12px 14px;
  border: 1px solid #cfe0c1;
  border-radius: 8px;
  background: #eef6e6;
}

.notify-banner p {
  margin: 0;
  color: #3d5237;
  font-size: 0.9rem;
}

.notify-banner .primary-action {
  min-height: 38px;
  padding: 0 18px;
  white-space: nowrap;
}

.notify-banner.granted {
  border-color: #bcd9c6;
  background: #e4f3e9;
}

.notify-banner.denied {
  border-color: #ead9b2;
  background: #fbf3df;
}

.notify-banner.denied p {
  color: #7c6327;
}
</style>
