<template>
  <section>
    <nav class="tabs">
      <router-link to="/my-gifts" exact-active-class="active">보유 상품권</router-link>
      <router-link to="/my-gifts/transactions" active-class="active">사용 내역</router-link>
      <router-link to="/my-gifts/received" active-class="active">받은 선물</router-link>
      <router-link to="/my-gifts/sent" active-class="active">보낸 선물</router-link>
    </nav>
    <router-view />
  </section>
</template>

<script setup></script>

<style scoped>
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  background: #eee;
  border-radius: 8px;
  padding: 4px;
}
.tabs a {
  flex: 1;
  text-align: center;
  padding: 8px 4px;
  font-size: 13px;
  color: #555;
  text-decoration: none;
  border-radius: 6px;
}
.tabs a.active {
  background: white;
  color: #10b981;
  font-weight: 700;
}
</style>
