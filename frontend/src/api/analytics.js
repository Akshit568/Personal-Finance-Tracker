import client from './client';

export const analyticsApi = {
  async summary(year) {
    const { data } = await client.get('/analytics/summary', { params: year ? { year } : {} });
    return data.data;
  },
  async totals(params = {}) {
    const { data } = await client.get('/analytics/totals', { params });
    return data.data;
  },
  async monthlyTrend(year) {
    const { data } = await client.get('/analytics/monthly-trend', { params: year ? { year } : {} });
    return data.data;
  },
  async categoryBreakdown(params = {}) {
    const { data } = await client.get('/analytics/category-breakdown', { params });
    return data.data;
  },
};
