<template>
  <section>
    <div v-for="item in giftCardStore.myGiftCards" :key="item.id" class="item">
      <p class="product">{{ item.GiftCard?.merchantName }} - {{ item.GiftCard?.productName }}</p>
      <p class="code">{{ item.code }}</p>
      <p class="status">{{ statusLabel(item.status) }}</p>
      <p class="expires">유효기간: {{ new Date(item.expiresAt).toLocaleDateString() }}</p>

      <div v-if="item.status === 'SOLD'" class="actions">
        <button @click="openGiftForm(item)">선물하기</button>
        <button class="use" @click="handleUse(item)">사용하기</button>
      </div>

      <!-- 인라인 선물하기 폼 -->
      <form v-if="giftingId === item.id" class="gift-form" @submit.prevent="handleSendGift(item)">
        <input v-model="giftForm.receiverPhone" type="tel" placeholder="받는 사람 휴대폰 번호" required />
        <input v-model="giftForm.message" type="text" placeholder="선물 메시지 (선택)" />
        <div class="form-actions">
          <button type="submit" :disabled="sending">{{ sending ? '전송 중...' : '보내기' }}</button>
          <button type="button" class="cancel" @click="giftingId = null">취소</button>
        </div>
      </form>
    </div>
    <p v-if="giftCardStore.myGiftCards.length === 0">보유한 상품권이 없습니다.</p>

    <p v-if="feedback" class="feedback">{{ feedback }}</p>
  </section>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useGiftCardStore } from '../store/giftcard';
import { useGiftStore } from '../store/gift';

const giftCardStore = useGiftCardStore();
const giftStore = useGiftStore();

const giftingId = ref(null);
const giftForm = reactive({ receiverPhone: '', message: '' });
const sending = ref(false);
const feedback = ref('');

onMounted(() => giftCardStore.fetchMyGiftCards());

function statusLabel(status) {
  const map = {
    SOLD: '사용 가능',
    GIFTED: '선물 완료',
    USED: '사용 완료',
    EXPIRED: '기간 만료',
  };
  return map[status] || status;
}

function openGiftForm(item) {
  giftingId.value = item.id;
  giftForm.receiverPhone = '';
  giftForm.message = '';
  feedback.value = '';
}

async function handleSendGift(item) {
  sending.value = true;
  feedback.value = '';
  try {
    await giftStore.send({
      giftCardInstanceId: item.id,
      receiverPhone: giftForm.receiverPhone,
      message: giftForm.message,
    });
    feedback.value = '선물을 보냈습니다.';
    giftingId.value = null;
    await giftCardStore.fetchMyGiftCards();
  } catch (err) {
    feedback.value = err.response?.data?.message || '선물 전송에 실패했습니다.';
  } finally {
    sending.value = false;
  }
}

async function handleUse(item) {
  if (!confirm(`이 상품권(${item.code})을 지금 사용 처리하시겠습니까? 되돌릴 수 없습니다.`)) return;

  feedback.value = '';
  try {
    await giftCardStore.useGiftCard(item.code);
    feedback.value = '상품권이 사용 처리되었습니다.';
    await giftCardStore.fetchMyGiftCards();
  } catch (err) {
    feedback.value = err.response?.data?.message || '사용 처리에 실패했습니다.';
  }
}
</script>

<style scoped>
.item {
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
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
.status {
  color: #10b981;
  font-size: 13px;
}
.expires {
  font-size: 12px;
  color: #888;
}
.actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.actions button {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 6px;
  background: #10b981;
  color: white;
  cursor: pointer;
  font-size: 13px;
}
.actions .use {
  background: #374151;
}
.gift-form {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.gift-form input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
}
.form-actions {
  display: flex;
  gap: 8px;
}
.form-actions button {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.form-actions button[type='submit'] {
  background: #10b981;
  color: white;
}
.form-actions .cancel {
  background: #eee;
}
.feedback {
  margin-top: 12px;
  font-size: 14px;
  color: #10b981;
}
</style>
