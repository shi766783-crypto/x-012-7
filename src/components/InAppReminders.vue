<script setup>
defineProps({
  alerts: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['dismiss', 'dismiss-all'])
</script>

<template>
  <div v-if="alerts.length" class="inapp-toast-stack" role="status" aria-live="polite">
    <section class="inapp-toast">
      <header class="inapp-toast-head">
        <strong>今日浇水提醒</strong>
        <button type="button" class="toast-close" aria-label="全部关闭" @click="emit('dismiss-all')">
          ×
        </button>
      </header>
      <ul class="inapp-toast-list">
        <li v-for="plant in alerts" :key="plant.id">
          <span :class="['status-pill', plant.wateringStatus === '已过期' ? 'danger' : 'warning']">
            {{ plant.wateringStatus }}
          </span>
          <div>
            <strong>{{ plant.name }}</strong>
            <p>{{ plant.location }} · 每 {{ plant.wateringFrequency }} 天一次</p>
          </div>
          <button type="button" class="toast-close" aria-label="忽略该提醒" @click="emit('dismiss', plant.id)">
            知道了
          </button>
        </li>
      </ul>
      <p class="inapp-toast-foot">浏览器通知未开启，已在页面内提示；开启后到点会主动弹出系统通知。</p>
    </section>
  </div>
</template>

<style scoped>
.inapp-toast-stack {
  position: sticky;
  top: 12px;
  z-index: 20;
  margin-bottom: 18px;
}

.inapp-toast {
  padding: 14px 16px;
  border: 1px solid #e7c98d;
  border-radius: 10px;
  background: #fff8e8;
  box-shadow: 0 14px 32px rgba(95, 72, 28, 0.16);
}

.inapp-toast-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.inapp-toast-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.inapp-toast-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
}

.inapp-toast-list p {
  margin: 2px 0 0;
  color: #657266;
  font-size: 0.86rem;
}

.toast-close {
  min-height: auto;
  padding: 4px 10px;
  color: #7a5a22;
  border: 1px solid #e2c88f;
  border-radius: 999px;
  background: transparent;
  font-size: 0.82rem;
}

.inapp-toast-head .toast-close {
  font-size: 1.1rem;
  line-height: 1;
}

.inapp-toast-foot {
  margin: 10px 0 0;
  color: #8a6c33;
  font-size: 0.82rem;
}
</style>
