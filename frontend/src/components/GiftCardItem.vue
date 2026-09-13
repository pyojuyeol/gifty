<template>
  <router-link :to="`/gift-cards/${card.id}`" class="card">
    <div class="thumb" :style="{ backgroundImage: `url(${card.imageUrl || ''})` }" />
    <div class="info">
      <p class="merchant">{{ card.merchantName }}</p>
      <p class="product">{{ card.productName }}</p>
      <p class="price">{{ card.faceValue.toLocaleString() }}원</p>
    </div>
  </router-link>
</template>

<script setup>
defineProps({
  card: { type: Object, required: true },
});
</script>

<style scoped>
.card {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  margin-bottom: 8px;
  text-decoration: none;
  color: inherit;
}
.thumb {
  width: 64px;
  height: 64px;
  background-color: #eee;
  background-size: cover;
  border-radius: 6px;
  flex-shrink: 0;
}
.merchant {
  font-size: 12px;
  color: #888;
  margin: 0;
}
.product {
  font-weight: 600;
  margin: 2px 0;
}
.price {
  color: #10b981;
  font-weight: 700;
  margin: 0;
}
</style>
