<template>
  <section>
    <div v-for="tx in giftCardStore.transactions" :key="tx.id" class="item">
      <p class="product">
        {{ tx.GiftCardInstance?.GiftCard?.merchantName }} - {{ tx.GiftCardInstance?.GiftCard?.productName }}
      </p>
      <p class="amount">{{ tx.amount.toLocaleString() }}원 사용</p>
      <p class="date">{{ new Date(tx.createdAt).toLocaleString() }}</p>

      <div class="badges">
        <span class="settled-badge" :class="{ settled: tx.settled }">
          {{ tx.settled ? '정산 완료' : '정산 대기' }}
        </span>
        <span v-if="giftSource(tx)" class="gift-badge">
          🎁 {{ giftSource(tx).sender?.name || '알 수 없음' }}님에게 받은 선물
        </span>
      </div>
    </div>
    <p v-if="giftCardStore.transactions.length === 0">사용한 상품권이 없습니다.</p>
  </section>
</template>

<script setup>
import { onMounted } from 'vue';
import { useGiftCardStore } from '../store/giftcard';

const giftCardStore = useGiftCardStore();
onMounted(() => giftCardStore.fetchTransactions());

// 해당 거래의 상품권이 선물로 받은 것이었다면 Gift 레코드(발신자 정보 포함)를 반환
function giftSource(tx) {
  const gifts = tx.GiftCardInstance?.Gifts;
  return gifts && gifts.length > 0 ? gifts[0] : null;
}
</script>

<style scoped>
.item {
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  border-left: 3px solid #9ca3af;
}
.product {
  font-weight: 700;
  margin: 0 0 4px;
}
.amount {
  font-weight: 700;
  color: #374151;
  margin: 2px 0;
}
.date {
  font-size: 12px;
  color: #888;
}
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.settled-badge {
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #fef3c7;
  color: #92400e;
}
.settled-badge.settled {
  background: #d1fae5;
  color: #065f46;
}
.gift-badge {
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #ede9fe;
  color: #5b21b6;
}
</style>
