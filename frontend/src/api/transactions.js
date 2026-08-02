import client from './client';

export const transactionsApi = {
  async list(params = {}) {
    // Strip empty values so we don't send blank query params.
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    );
    const { data } = await client.get('/transactions', { params: clean });
    return { rows: data.data, meta: data.meta };
  },
  async get(id) {
    const { data } = await client.get(`/transactions/${id}`);
    return data.data;
  },
  async create(payload) {
    const { data } = await client.post('/transactions', payload);
    return data.data;
  },
  async update(id, payload) {
    const { data } = await client.put(`/transactions/${id}`, payload);
    return data.data;
  },
  async remove(id) {
    await client.delete(`/transactions/${id}`);
  },
};
