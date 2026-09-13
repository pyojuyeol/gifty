import { defineStore } from 'pinia';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('gifty_token') || null,
    user: JSON.parse(localStorage.getItem('gifty_user') || 'null'),
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
  },

  actions: {
    async login(email, password) {
      const { data } = await axios.post('/api/auth/login', { email, password });
      this.setSession(data.token, data.user);
    },

    async register(payload) {
      const { data } = await axios.post('/api/auth/register', payload);
      this.setSession(data.token, data.user);
    },

    setSession(token, user) {
      this.token = token;
      this.user = user;
      localStorage.setItem('gifty_token', token);
      localStorage.setItem('gifty_user', JSON.stringify(user));
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('gifty_token');
      localStorage.removeItem('gifty_user');
      delete axios.defaults.headers.common.Authorization;
    },
  },
});
