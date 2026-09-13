<template>
  <section class="form-wrap">
    <h2>로그인</h2>
    <form @submit.prevent="handleSubmit">
      <input v-model="email" type="email" placeholder="이메일" required />
      <input v-model="password" type="password" placeholder="비밀번호" required />
      <button type="submit">로그인</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
    <p class="switch">
      계정이 없으신가요? <router-link to="/register">회원가입</router-link>
    </p>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../store/auth';

const email = ref('');
const password = ref('');
const error = ref('');

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

async function handleSubmit() {
  try {
    await auth.login(email.value, password.value);
    router.push(route.query.redirect || '/');
  } catch (err) {
    error.value = err.response?.data?.message || '로그인에 실패했습니다.';
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
