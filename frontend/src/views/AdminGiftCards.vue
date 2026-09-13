<template>
  <section>
    <h2>상품권 관리</h2>

    <!-- 등록/수정 폼 -->
    <form class="card-form" @submit.prevent="handleSubmit">
      <h3>{{ editingId ? '상품권 수정' : '신규 상품권 등록' }}</h3>
      <input v-model="form.merchantName" type="text" placeholder="가맹점명 (예: 스타벅스)" required />
      <input v-model="form.productName" type="text" placeholder="상품명 (예: 아메리카노 Tall)" required />
      <input v-model.number="form.faceValue" type="number" min="1" placeholder="액면가 (원)" required />
      <input v-model.number="form.validDays" type="number" min="1" placeholder="유효기간 (일)" required />
      <input v-model="form.totalStock" type="number" min="0" placeholder="재고 수량 (비워두면 무제한)" />
      <input v-model="form.imageUrl" type="text" placeholder="이미지 URL (선택)" />

      <div class="form-actions">
        <button type="submit" :disabled="submitting">
          {{ submitting ? '처리 중...' : editingId ? '수정 완료' : '등록하기' }}
        </button>
        <button v-if="editingId" type="button" class="cancel" @click="resetForm">취소</button>
      </div>
      <p v-if="formError" class="error">{{ formError }}</p>
    </form>

    <!-- 상품권 목록 -->
    <h3 class="list-title">전체 상품권 ({{ store.adminList.length }}건)</h3>
    <div v-for="card in store.adminList" :key="card.id" class="card-item" :class="{ inactive: !card.isActive }">
      <div class="info">
        <p class="product">{{ card.merchantName }} - {{ card.productName }}</p>
        <p class="detail">{{ card.faceValue.toLocaleString() }}원 · 유효기간 {{ card.validDays }}일</p>
        <p class="stock">
          {{ card.totalStock === null ? '재고 무제한' : `재고 ${card.remainingStock} / ${card.totalStock}` }}
        </p>
        <span class="status-badge" :class="{ active: card.isActive }">
          {{ card.isActive ? '판매중' : '판매중지' }}
        </span>
      </div>
      <div class="row-actions">
        <button @click="startEdit(card)">수정</button>
        <button class="toggle" @click="handleToggle(card)">
          {{ card.isActive ? '판매중지' : '판매재개' }}
        </button>
      </div>
    </div>
    <p v-if="store.adminList.length === 0 && !store.loading">등록된 상품권이 없습니다.</p>
  </section>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useGiftCardStore } from '../store/giftcard';

const store = useGiftCardStore();

const editingId = ref(null);
const submitting = ref(false);
const formError = ref('');

const form = reactive({
  merchantName: '',
  productName: '',
  faceValue: null,
  validDays: 90,
  totalStock: '', // 빈 문자열 = 무제한
  imageUrl: '',
});

onMounted(() => store.fetchAdminList());

function resetForm() {
  editingId.value = null;
  form.merchantName = '';
  form.productName = '';
  form.faceValue = null;
  form.validDays = 90;
  form.totalStock = '';
  form.imageUrl = '';
  formError.value = '';
}

function startEdit(card) {
  editingId.value = card.id;
  form.merchantName = card.merchantName;
  form.productName = card.productName;
  form.faceValue = card.faceValue;
  form.validDays = card.validDays;
  form.totalStock = card.totalStock === null ? '' : card.totalStock;
  form.imageUrl = card.imageUrl || '';
  formError.value = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleSubmit() {
  submitting.value = true;
  formError.value = '';
  try {
    if (editingId.value) {
      await store.updateGiftCard(editingId.value, { ...form });
    } else {
      await store.createGiftCard({ ...form });
    }
    resetForm();
  } catch (err) {
    formError.value = err.response?.data?.message || '처리에 실패했습니다.';
  } finally {
    submitting.value = false;
  }
}

async function handleToggle(card) {
  const action = card.isActive ? '판매중지' : '판매재개';
  if (!confirm(`"${card.productName}"을(를) ${action} 하시겠습니까?`)) return;
  await store.toggleGiftCardActive(card.id);
}
</script>

<style scoped>
.card-form {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.card-form h3 {
  margin: 0 0 4px;
  font-size: 15px;
}
.card-form input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}
.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
.form-actions button {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
.form-actions button[type='submit'] {
  background: #10b981;
  color: white;
}
.form-actions button[type='submit']:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.form-actions .cancel {
  background: #eee;
}
.error {
  color: #e11d48;
  font-size: 13px;
  margin: 0;
}
.list-title {
  margin-top: 8px;
}
.card-item {
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.card-item.inactive {
  opacity: 0.55;
}
.product {
  font-weight: 700;
  margin: 0 0 2px;
}
.detail {
  font-size: 12px;
  color: #888;
  margin: 0 0 4px;
}
.stock {
  font-size: 12px;
  color: #374151;
  margin: 0 0 4px;
  font-weight: 600;
}
.status-badge {
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #fee2e2;
  color: #991b1b;
}
.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}
.row-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.row-actions button {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}
.row-actions .toggle {
  color: #e11d48;
  border-color: #fecdd3;
}
</style>
