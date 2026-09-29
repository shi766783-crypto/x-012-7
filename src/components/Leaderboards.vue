<script setup>
defineProps({
  leaderboards: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <section class="records-grid">
    <article class="panel">
      <div class="panel-heading">
        <h2>园艺达人榜</h2>
      </div>
      <ol class="ranking-list">
        <li v-for="item in leaderboards.gardenExperts" :key="item.id">
          <span>{{ item.name }}</span>
          <strong>{{ item.score }}</strong>
        </li>
      </ol>
    </article>
    <article class="panel">
      <div class="panel-heading">
        <h2>开花最多榜</h2>
      </div>
      <ol class="ranking-list">
        <li v-for="item in leaderboards.bloomLeaders" :key="item.id">
          <span>{{ item.name }}</span>
          <strong>{{ item.blooms }} 次</strong>
        </li>
      </ol>
    </article>
  </section>
</template>
