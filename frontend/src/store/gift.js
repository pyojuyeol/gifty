import { defineStore } from 'pinia';
import axios from 'axios';

export const useGiftStore = defineStore('gift', {
  state: () => ({
    received: [],
    sent: [],
  }),

  actions: {
    async send({ giftCardInstanceId, receiverPhone, message }) {
      const { data } = await axios.post('/api/gifts', {
        giftCardInstanceId,
        receiverPhone,
        message,
      });
      return data;
    },

    async fetchReceived() {
      const { data } = await axios.get('/api/gifts/received');
      this.received = data;
    },

    async fetchSent() {
      const { data } = await axios.get('/api/gifts/sent');
      this.sent = data;
    },
  },
});
