<template>
  <section>
    <div v-for="gift in giftStore.sent" :key="gift.id" class="item">
      <p class="product">
        {{ gift.GiftCardInstance?.GiftCard?.merchantName }} - {{ gift.GiftCardInstance?.GiftCard?.productName }}
      </p>
      <p class="code">{{ gift.GiftCardInstance?.code }}</p>
      <p class="receiver">받는 사람: {{ formatPhone(gift.receiverPhone) }}</p>
      <p class="status">{{ gift.status === 'ACCEPTED' ? '수락됨' : '수락 대기중' }}</p>
      <p v-if="gift.message" class="message">"{{ gift.message }}"</p>
    </div>
    <p v-if="giftStore.sent.length === 0">보낸 선물이 없습니다.</p>
  </section>
</template>

<script setup>
import { onMounted } from 'vue';
import { useGiftStore } from '../store/gift';

const giftStore = useGiftStore();
onMounted(() => giftStore.fetchSent());

// 010XXXXXXXX -> 010-XXXX-XXXX 형태로 보기 좋게 표시
function formatPhone(phone) {
  if (!phone || phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
}
</script>

<style scoped>
.item {
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  border-left: 3px solid #6366f1;
}
.product {
  font-weight: 700;
  margin: 0 0 4px;
}
.code {
  font-family: monospace;
  font-size: 13px;
  color: #666;
}
.receiver {
  font-size: 13px;
  color: #555;
}
.status {
  color: #10b981;
  font-size: 13px;
}
.message {
  font-size: 13px;
  color: #555;
  font-style: italic;
}
</style>
