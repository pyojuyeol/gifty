<template>
  <section>
    <div v-for="gift in giftStore.received" :key="gift.id" class="item">
      <p class="product">
        {{ gift.GiftCardInstance?.GiftCard?.merchantName }} - {{ gift.GiftCardInstance?.GiftCard?.productName }}
      </p>
      <p class="code">{{ gift.GiftCardInstance?.code }}</p>
      <p class="sender">{{ gift.sender?.name || '알 수 없음' }}님에게 받음</p>
      <p v-if="gift.message" class="message">"{{ gift.message }}"</p>

      <div class="badges">
        <span class="badge" :class="gift.status === 'ACCEPTED' ? 'accepted' : 'pending'">
          {{ gift.status === 'ACCEPTED' ? '수락됨' : '수락 대기중' }}
        </span>
        <span class="badge" :class="isUsed(gift) ? 'used' : 'unused'">
          {{ isUsed(gift) ? '사용 완료' : '미사용' }}
        </span>
      </div>

      <p v-if="isUsed(gift)" class="used-at">
        {{ new Date(gift.GiftCardInstance.Transaction.createdAt).toLocaleString() }}에 사용
        ({{ gift.GiftCardInstance.Transaction.amount.toLocaleString() }}원)
      </p>
    </div>
    <p v-if="giftStore.received.length === 0">받은 선물이 없습니다.</p>
  </section>
</template>

<script setup>
import { onMounted } from 'vue';
import { useGiftStore } from '../store/gift';

const giftStore = useGiftStore();
onMounted(() => giftStore.fetchReceived());

function isUsed(gift) {
  return !!gift.GiftCardInstance?.Transaction;
}
</script>

<style scoped>
.item {
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  border-left: 3px solid #10b981;
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
.sender {
  font-size: 13px;
  color: #555;
}
.message {
  font-size: 13px;
  color: #555;
  font-style: italic;
}
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.badge {
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}
.badge.accepted {
  background: #d1fae5;
  color: #065f46;
}
.badge.pending {
  background: #fef3c7;
  color: #92400e;
}
.badge.used {
  background: #e5e7eb;
  color: #374151;
}
.badge.unused {
  background: #dbeafe;
  color: #1e40af;
}
.used-at {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}
</style>
