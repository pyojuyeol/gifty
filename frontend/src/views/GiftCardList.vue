<template>
  <section>
    <h2>상품권 목록</h2>
    <p v-if="store.loading">불러오는 중...</p>
    <GiftCardItem v-for="card in store.list" :key="card.id" :card="card" />
  </section>
</template>

<script setup>
import { onMounted } from 'vue';
import { useGiftCardStore } from '../store/giftcard';
import GiftCardItem from '../components/GiftCardItem.vue';

const store = useGiftCardStore();
onMounted(() => store.fetchList());
</script>
