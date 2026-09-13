<template>
  <section>
    <h2>관리자 대시보드</h2>
    <div v-if="stats" class="stats">
      <div class="stat"><p class="num">{{ stats.giftCardCount }}</p><p>등록 상품권</p></div>
      <div class="stat"><p class="num">{{ stats.orderCount }}</p><p>결제 완료 주문</p></div>
      <div class="stat"><p class="num">{{ stats.transactionCount }}</p><p>사용 건수</p></div>
    </div>

    <router-link to="/admin/gift-cards" class="manage-link">상품권 관리 (등록/수정/판매중지) →</router-link>

    <h3>정산 배치 수동 실행</h3>
    <button @click="runSettlement">전일 정산 실행</button>
    <p v-if="settlementMessage">{{ settlementMessage }}</p>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const stats = ref(null);
const settlementMessage = ref('');

onMounted(async () => {
  const { data } = await axios.get('/api/admin/dashboard');
  stats.value = data;
});

async function runSettlement() {
  const periodEnd = new Date();
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 1);

  const { data } = await axios.post('/api/admin/settlements/run', {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
  });
  settlementMessage.value = data.message;
}
</script>

<style scoped>
.stats {
  display: flex;
  gap: 12px;
  margin: 16px 0;
}
.stat {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}
.num {
  font-size: 20px;
  font-weight: 700;
  color: #10b981;
  margin: 0;
}
.manage-link {
  display: block;
  padding: 12px;
  background: white;
  border-radius: 8px;
  color: #10b981;
  text-decoration: none;
  font-weight: 600;
  margin-bottom: 20px;
}
button {
  padding: 10px 16px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
</style>
