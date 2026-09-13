import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';

const routes = [
  { path: '/', name: 'home', component: () => import('../views/Home.vue') },
  { path: '/login', name: 'login', component: () => import('../views/Login.vue') },
  { path: '/register', name: 'register', component: () => import('../views/Register.vue') },
  { path: '/gift-cards', name: 'gift-cards', component: () => import('../views/GiftCardList.vue') },
  { path: '/gift-cards/:id', name: 'gift-card-detail', component: () => import('../views/GiftCardDetail.vue'), props: true },
  {
    path: '/my-gifts',
    component: () => import('../views/MyGiftsLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'my-gifts-holdings', component: () => import('../views/MyHoldings.vue') },
      { path: 'transactions', name: 'my-gifts-transactions', component: () => import('../views/MyTransactions.vue') },
      { path: 'received', name: 'my-gifts-received', component: () => import('../views/ReceivedGifts.vue') },
      { path: 'sent', name: 'my-gifts-sent', component: () => import('../views/SentGifts.vue') },
    ],
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/Admin.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/gift-cards',
    name: 'admin-gift-cards',
    component: () => import('../views/AdminGiftCards.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 인증/권한 가드: 로그인 필요 페이지와 관리자 전용 페이지를 보호
// to.matched를 순회해서 부모 라우트(/my-gifts)의 meta도 함께 검사한다.
router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.matched.some((record) => record.meta.requiresAuth) && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.matched.some((record) => record.meta.requiresAdmin) && auth.user?.role !== 'ADMIN') {
    return { name: 'home' };
  }
});

export default router;
