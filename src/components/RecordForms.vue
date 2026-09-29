<script setup>
import { computed, reactive } from 'vue'
import { BLOOM_STATES, CARE_TYPES } from '../constants/garden'
import { todayISO } from '../utils/date'

const props = defineProps({
  plants: {
    type: Array,
    required: true,
  },
})
const emit = defineEmits(['care', 'growth', 'pest'])

const firstPlantId = computed(() => props.plants[0]?.id || '')
const care = reactive({ plantId: '', date: todayISO(), type: '浇水', amount: '', note: '', photo: '' })
const growth = reactive({ plantId: '', date: todayISO(), height: 0, leafCount: 0, bloomState: '未开花' })
const pest = reactive({ plantId: '', date: todayISO(), symptom: '', treatment: '', recovery: '' })

function ensurePlantId(form) {
  if (!form.plantId) form.plantId = firstPlantId.value
}

function submitCare() {
  ensurePlantId(care)
  if (!care.plantId) return
  emit('care', { ...care })
  care.amount = ''
  care.note = ''
  care.photo = ''
}

function submitGrowth() {
  ensurePlantId(growth)
  if (!growth.plantId) return
  emit('growth', { ...growth })
  growth.height = 0
  growth.leafCount = 0
}

function submitPest() {
  ensurePlantId(pest)
  if (!pest.plantId || !pest.symptom.trim()) return
  emit('pest', { ...pest, symptom: pest.symptom.trim() })
  pest.symptom = ''
  pest.treatment = ''
  pest.recovery = ''
}

function handlePhoto(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    care.photo = reader.result
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <section class="records-grid">
    <form class="panel compact-form" @submit.prevent="submitCare">
      <div class="panel-heading">
        <h2>养护操作</h2>
      </div>
      <select v-model="care.plantId">
        <option value="">选择植物</option>
        <option v-for="plant in plants" :key="plant.id" :value="plant.id">{{ plant.name }}</option>
      </select>
      <input v-model="care.date" type="date" />
      <select v-model="care.type">
        <option v-for="item in CARE_TYPES" :key="item">{{ item }}</option>
      </select>
      <input v-model="care.amount" placeholder="用量或备注" />
      <textarea v-model="care.note" rows="3" placeholder="养护细节"></textarea>
      <input accept="image/*" type="file" @change="handlePhoto" />
      <button class="secondary-action" type="submit">记录养护</button>
    </form>

    <form class="panel compact-form" @submit.prevent="submitGrowth">
      <div class="panel-heading">
        <h2>生长指标</h2>
      </div>
      <select v-model="growth.plantId">
        <option value="">选择植物</option>
        <option v-for="plant in plants" :key="plant.id" :value="plant.id">{{ plant.name }}</option>
      </select>
      <input v-model="growth.date" type="date" />
      <input v-model.number="growth.height" min="0" type="number" placeholder="高度 cm" />
      <input v-model.number="growth.leafCount" min="0" type="number" placeholder="叶片数" />
      <select v-model="growth.bloomState">
        <option v-for="item in BLOOM_STATES" :key="item">{{ item }}</option>
      </select>
      <button class="secondary-action" type="submit">记录指标</button>
    </form>

    <form class="panel compact-form" @submit.prevent="submitPest">
      <div class="panel-heading">
        <h2>病虫害记录</h2>
      </div>
      <select v-model="pest.plantId">
        <option value="">选择植物</option>
        <option v-for="plant in plants" :key="plant.id" :value="plant.id">{{ plant.name }}</option>
      </select>
      <input v-model="pest.date" type="date" />
      <textarea v-model="pest.symptom" required rows="3" placeholder="症状"></textarea>
      <textarea v-model="pest.treatment" rows="3" placeholder="处理方法"></textarea>
      <textarea v-model="pest.recovery" rows="3" placeholder="恢复情况"></textarea>
      <button class="secondary-action" type="submit">保存记录</button>
    </form>
  </section>
</template>
