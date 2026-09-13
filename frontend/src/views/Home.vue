<template>
  <section class="hero">
    <h1>모바일 상품권, 기프티</h1>
    <p>구매하고, 선물하고, 편하게 사용하세요.</p>
    <router-link to="/gift-cards" class="cta">상품권 구경하기</router-link>
  </section>
</template>

<script setup></script>

<style scoped>
.hero {
  text-align: center;
  padding: 48px 16px;
}
.cta {
  display: inline-block;
  margin-top: 16px;
  padding: 12px 24px;
  background: #10b981;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
}
</style>
