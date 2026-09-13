import { createApp } from 'vue';
import { createPinia } from 'pinia';
import axios from 'axios';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './store/auth';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// localStorage에 남아있는 토큰을 axios 기본 헤더에 복원.
// 이게 없으면 새로고침/새 탭 진입 시 로그인 상태는 유지되는 것처럼 보여도
// 실제 API 요청엔 Authorization 헤더가 안 실려서 401이 난다.
const authStore = useAuthStore();
if (authStore.token) {
  axios.defaults.headers.common.Authorization = `Bearer ${authStore.token}`;
}

app.mount('#app');
