import client from './client';

export const authApi = {
  async login(email, password) {
    const { data } = await client.post('/auth/login', { email, password });
    return data.data; // { token, user }
  },
  async register(payload) {
    const { data } = await client.post('/auth/register', payload);
    return data.data; // { token, user }
  },
  async me() {
    const { data } = await client.get('/auth/me');
    return data.data.user;
  },
};
