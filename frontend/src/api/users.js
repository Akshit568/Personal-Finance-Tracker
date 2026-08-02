import client from './client';

export const usersApi = {
  async list(params = {}) {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    );
    const { data } = await client.get('/users', { params: clean });
    return { rows: data.data, meta: data.meta };
  },
  async changeRole(id, role) {
    const { data } = await client.patch(`/users/${id}/role`, { role });
    return data.data;
  },
  async remove(id) {
    await client.delete(`/users/${id}`);
  },
};
