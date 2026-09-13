<template>
  <section v-if="card">
    <img v-if="card.imageUrl" :src="card.imageUrl" class="thumb" />
    <h2>{{ card.merchantName }} - {{ card.productName }}</h2>
    <p class="price">{{ card.faceValue.toLocaleString() }}원</p>
    <p v-if="card.totalStock !== null" class="stock" :class="{ low: card.remainingStock <= 5 }">
      {{ card.remainingStock > 0 ? `남은 수량 ${card.remainingStock}개` : '품절' }}
    </p>
    <p v-if="!portoneEnabled" class="mock-notice">⚠️ 결제 테스트 모드 (실제 결제창 없이 즉시 성공 처리됩니다)</p>

    <div class="qty">
      <button @click="quantity > 1 && quantity--">-</button>
      <span>{{ quantity }}</span>
      <button @click="quantity++">+</button>
    </div>

    <button class="buy" @click="handlePurchase" :disabled="purchasing || isSoldOut">
      {{ purchasing ? '결제 처리 중...' : isSoldOut ? '품절' : `${(card.faceValue * quantity).toLocaleString()}원 구매하기` }}
    </button>

    <p v-if="message" class="message">{{ message }}</p>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useGiftCardStore } from '../store/giftcard';
import { useAuthStore } from '../store/auth';

const props = defineProps({ id: String });
const store = useGiftCardStore();
const auth = useAuthStore();

const card = computed(() => store.list.find((c) => c.id === props.id));
const quantity = ref(1);
const purchasing = ref(false);
const message = ref('');

const isSoldOut = computed(() => card.value?.totalStock !== null && card.value?.remainingStock <= 0);

const STORE_ID = import.meta.env.VITE_PORTONE_STORE_ID;
const CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY;
const portoneEnabled = !!(STORE_ID && CHANNEL_KEY);

onMounted(async () => {
  if (store.list.length === 0) await store.fetchList();
});

function generateUid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 실제 포트원 V2 결제창을 띄운다.
 * V1과 달리 우리가 직접 고유한 paymentId를 만들어서 넘기고, 결제 성공 후
 * 백엔드가 이 동일한 paymentId로 포트원 서버에 재조회해서 검증한다.
 * (V1의 imp_uid는 PG가 발급했지만, V2의 paymentId는 가맹점인 우리가 발급한다.)
 */
async function requestRealPayment(amount) {
  if (!window.PortOne) {
    throw new Error('결제 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
  }

  const paymentId = generateUid('gifty_payment');

  const response = await window.PortOne.requestPayment({
    storeId: STORE_ID,
    channelKey: CHANNEL_KEY,
    paymentId,
    orderName: `${card.value.merchantName} ${card.value.productName}`,
    totalAmount: amount,
    currency: 'CURRENCY_KRW',
    payMethod: 'CARD',
    // KG이니시스는 PC 결제 시 customer 정보(이름/연락처/이메일)가 필수다.
    // 없으면 "지원하지 않는 기능입니다" 에러가 난다.
    customer: {
      fullName: auth.user?.name || '기프티 고객',
      phoneNumber: '010-0000-0000', // 실제 서비스라면 회원 전화번호를 사용
      email: auth.user?.email || 'test@gifty.com',
    },
  });

  console.log('[포트원 V2 응답]', response);

  // V2는 실패 시 response.code(문자열)가 채워지고, 성공 시 code가 없다(undefined).
  if (response.code) {
    throw new Error(response.message || '결제가 취소되었습니다.');
  }

  return { paymentId: response.paymentId };
}

// 결제창 없이 즉시 성공 처리 (개발/테스트 환경, STORE_ID/CHANNEL_KEY 미설정 시)
function requestMockPayment() {
  return Promise.resolve({ paymentId: generateUid('mock_payment') });
}

async function handlePurchase() {
  purchasing.value = true;
  message.value = '';
  try {
    const amount = card.value.faceValue * quantity.value;
    const payment = portoneEnabled ? await requestRealPayment(amount) : await requestMockPayment();

    // 백엔드 인터페이스(impUid/merchantUid)는 V1 시절 명명이 남아있지만,
    // V2에서는 우리가 발급한 동일한 paymentId를 두 필드에 그대로 전달한다.
    await store.purchase({
      giftCardId: card.value.id,
      quantity: quantity.value,
      impUid: payment.paymentId,
      merchantUid: payment.paymentId,
    });
    message.value = '구매가 완료되었습니다! 내 선물함에서 확인하세요.';
    await store.fetchList(); // 재고 반영을 위해 목록 재조회
  } catch (err) {
    message.value = err.response?.data?.message || err.message || '구매에 실패했습니다.';
  } finally {
    purchasing.value = false;
  }
}
</script>

<style scoped>
.thumb {
  width: 100%;
  border-radius: 8px;
}
.price {
  font-size: 20px;
  font-weight: 700;
  color: #10b981;
}
.stock {
  font-size: 13px;
  color: #10b981;
  margin: 4px 0 0;
}
.stock.low {
  color: #e11d48;
  font-weight: 700;
}
.mock-notice {
  font-size: 12px;
  color: #92400e;
  background: #fef3c7;
  padding: 6px 10px;
  border-radius: 6px;
  margin-top: 8px;
}
.qty {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}
.buy {
  width: 100%;
  padding: 14px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.buy:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
.message {
  margin-top: 12px;
  font-size: 14px;
}
</style>
