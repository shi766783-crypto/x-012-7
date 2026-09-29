<script setup>
import { reactive } from 'vue'
import { LIGHT_NEEDS, LOCATIONS, PLANT_CATEGORIES } from '../constants/garden'
import { todayISO } from '../utils/date'

const emit = defineEmits(['submit'])

const form = reactive({
  name: '',
  variety: '',
  category: '观叶',
  location: '阳台',
  lightNeed: '半阴',
  wateringFrequency: 3,
  fertilizerFrequency: 30,
  purchaseDate: todayISO(),
  lastWateredDate: todayISO(),
  potSize: '',
  soilType: '',
  photo: '',
})

function submit() {
  if (!form.name.trim()) return
  emit('submit', { ...form, name: form.name.trim() })
  form.name = ''
  form.variety = ''
  form.potSize = ''
  form.soilType = ''
  form.photo = ''
}

function handlePhoto(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    form.photo = reader.result
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <form class="panel form-grid" @submit.prevent="submit">
    <div class="panel-heading">
      <h2>添加植物档案</h2>
      <span>localStorage 保存</span>
    </div>

    <label>
      植物名称
      <input v-model="form.name" required placeholder="如：薄荷、月季、琴叶榕" />
    </label>
    <label>
      品种
      <input v-model="form.variety" placeholder="可选" />
    </label>
    <label>
      类别
      <select v-model="form.category">
        <option v-for="item in PLANT_CATEGORIES" :key="item">{{ item }}</option>
      </select>
    </label>
    <label>
      摆放位置
      <select v-model="form.location">
        <option v-for="item in LOCATIONS" :key="item">{{ item }}</option>
      </select>
    </label>
    <label>
      光照需求
      <select v-model="form.lightNeed">
        <option v-for="item in LIGHT_NEEDS" :key="item">{{ item }}</option>
      </select>
    </label>
    <label>
      浇水频率（天）
      <input v-model.number="form.wateringFrequency" min="1" type="number" />
    </label>
    <label>
      施肥频率（天）
      <input v-model.number="form.fertilizerFrequency" min="1" type="number" />
    </label>
    <label>
      购买日期
      <input v-model="form.purchaseDate" type="date" />
    </label>
    <label>
      上次浇水
      <input v-model="form.lastWateredDate" type="date" />
    </label>
    <label>
      花盆尺寸
      <input v-model="form.potSize" placeholder="如：20cm 陶盆" />
    </label>
    <label>
      土壤类型
      <input v-model="form.soilType" placeholder="如：泥炭土、颗粒土" />
    </label>
    <label>
      植物照片
      <input accept="image/*" type="file" @change="handlePhoto" />
    </label>
    <button class="primary-action" type="submit">添加植物</button>
  </form>
</template>
