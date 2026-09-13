import { defineStore } from 'pinia';
import axios from 'axios';

export const useGiftCardStore = defineStore('giftcard', {
  state: () => ({
    list: [],
    myGiftCards: [],
    transactions: [],
    adminList: [],
    loading: false,
  }),

  actions: {
    async fetchList() {
      this.loading = true;
      try {
        const { data } = await axios.get('/api/gift-cards');
        this.list = data;
      } finally {
        this.loading = false;
      }
    },

    async fetchMyGiftCards() {
      const { data } = await axios.get('/api/orders/my-gift-cards');
      this.myGiftCards = data;
    },

    async fetchTransactions() {
      const { data } = await axios.get('/api/orders/transactions');
      this.transactions = data;
    },

    async purchase({ giftCardId, quantity, impUid, merchantUid }) {
      const { data } = await axios.post('/api/gift-cards/purchase', {
        giftCardId,
        quantity,
        impUid,
        merchantUid,
      });
      return data;
    },

    async useGiftCard(code) {
      const { data } = await axios.post('/api/orders/use', { code });
      return data;
    },

    // ---- 관리자 전용 ----

    async fetchAdminList() {
      this.loading = true;
      try {
        const { data } = await axios.get('/api/admin/gift-cards');
        this.adminList = data;
      } finally {
        this.loading = false;
      }
    },

    async createGiftCard(payload) {
      const { data } = await axios.post('/api/admin/gift-cards', payload);
      this.adminList.unshift(data);
      return data;
    },

    async updateGiftCard(id, payload) {
      const { data } = await axios.put(`/api/admin/gift-cards/${id}`, payload);
      const idx = this.adminList.findIndex((c) => c.id === id);
      if (idx !== -1) this.adminList[idx] = data;
      return data;
    },

    async toggleGiftCardActive(id) {
      const { data } = await axios.patch(`/api/admin/gift-cards/${id}/toggle`);
      const idx = this.adminList.findIndex((c) => c.id === id);
      if (idx !== -1) this.adminList[idx] = data;
      return data;
    },
  },
});
