<template>
  <Navbar />
  <main class="container">
    <router-view />
  </main>
</template>

<script setup>
import Navbar from './components/Navbar.vue';
</script>

<style>
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  font-family: 'Pretendard', -apple-system, sans-serif;
  background: #f7f8fa;
}
.container {
  max-width: 480px;
  margin: 0 auto;
  padding: 16px;
  min-height: 100vh;
}
</style>
