<template>
  <nav class="navbar">
    <router-link to="/" class="logo">기프티</router-link>
    <div class="links">
      <router-link to="/gift-cards">상품권</router-link>
      <router-link v-if="auth.isLoggedIn" to="/my-gifts">내 선물함</router-link>
      <router-link v-if="auth.user?.role === 'ADMIN'" to="/admin">관리자</router-link>
      <router-link v-if="!auth.isLoggedIn" to="/login">로그인</router-link>
      <a v-else href="#" @click.prevent="handleLogout">로그아웃</a>
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';

const auth = useAuthStore();
const router = useRouter();

function handleLogout() {
  auth.logout();
  router.push('/login');
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #eee;
}
.logo {
  font-weight: 700;
  color: #10b981;
  text-decoration: none;
}
.links {
  display: flex;
  gap: 12px;
  font-size: 14px;
}
.links a {
  color: #333;
  text-decoration: none;
}
</style>
