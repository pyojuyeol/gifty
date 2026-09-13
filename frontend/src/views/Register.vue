<template>
  <section class="form-wrap">
    <h2>회원가입</h2>
    <form @submit.prevent="handleSubmit">
      <input v-model="form.name" type="text" placeholder="이름" required />
      <input v-model="form.email" type="email" placeholder="이메일" required />
      <input v-model="form.phone" type="tel" placeholder="휴대폰 번호 (01012345678)" required />
      <input v-model="form.password" type="password" placeholder="비밀번호 (8자 이상)" minlength="8" required />
      <input v-model="passwordConfirm" type="password" placeholder="비밀번호 확인" required />
      <button type="submit" :disabled="submitting">
        {{ submitting ? '가입 처리 중...' : '가입하기' }}
      </button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
    <p class="switch">
      이미 계정이 있으신가요? <router-link to="/login">로그인</router-link>
    </p>
  </section>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';

const form = reactive({ name: '', email: '', phone: '', password: '' });
const passwordConfirm = ref('');
const error = ref('');
const submitting = ref(false);

const auth = useAuthStore();
const router = useRouter();

async function handleSubmit() {
  error.value = '';

  if (form.password !== passwordConfirm.value) {
    error.value = '비밀번호가 일치하지 않습니다.';
    return;
  }

  submitting.value = true;
  try {
    await auth.register({ ...form });
    router.push('/');
  } catch (err) {
    error.value = err.response?.data?.message || '회원가입에 실패했습니다.';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.form-wrap {
  max-width: 320px;
  margin: 40px auto;
}
form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
}
button {
  padding: 10px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.error {
  color: #e11d48;
  font-size: 13px;
}
.switch {
  font-size: 13px;
  text-align: center;
  margin-top: 12px;
}
</style>
