<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  records: {
    type: Array,
    required: true,
  },
})

const canvasRef = ref(null)

onMounted(draw)
watch(() => props.records, draw, { deep: true })

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ratio = window.devicePixelRatio || 1
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  canvas.width = width * ratio
  canvas.height = height * ratio

  const ctx = canvas.getContext('2d')
  ctx.scale(ratio, ratio)
  ctx.clearRect(0, 0, width, height)

  drawGrid(ctx, width, height)

  if (!props.records.length) {
    ctx.fillStyle = '#667568'
    ctx.font = '14px system-ui'
    ctx.fillText('暂无生长指标', 24, height / 2)
    return
  }

  const values = props.records.map((record) => Number(record.height) || 0)
  const max = Math.max(...values, 10)
  const min = Math.min(...values, 0)
  const span = Math.max(max - min, 1)
  const padding = 28
  const step = props.records.length > 1 ? (width - padding * 2) / (props.records.length - 1) : 0
  const points = props.records.map((record, index) => ({
    x: padding + step * index,
    y: height - padding - (((Number(record.height) || 0) - min) / span) * (height - padding * 2),
    record,
  }))

  ctx.strokeStyle = '#2f7d4f'
  ctx.lineWidth = 3
  ctx.beginPath()
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y)
    else ctx.lineTo(point.x, point.y)
  })
  ctx.stroke()

  points.forEach((point) => {
    ctx.fillStyle = '#f5b947'
    ctx.beginPath()
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#314238'
    ctx.font = '12px system-ui'
    ctx.fillText(`${point.record.height}cm`, point.x - 14, point.y - 10)
  })
}

function drawGrid(ctx, width, height) {
  ctx.fillStyle = '#fbf8ef'
  ctx.fillRect(0, 0, width, height)
  ctx.strokeStyle = '#d9e3d1'
  ctx.lineWidth = 1
  for (let y = 24; y < height; y += 32) {
    ctx.beginPath()
    ctx.moveTo(18, y)
    ctx.lineTo(width - 18, y)
    ctx.stroke()
  }
}
</script>

<template>
  <canvas ref="canvasRef" class="growth-canvas" aria-label="植物生长曲线"></canvas>
</template>
