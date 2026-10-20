import adminApi from './adminApi';

export const adminRevenueService = {
  overview:     (params = {}) => adminApi.get('/revenue/overview',     { params }),
  timeline:     (params = {}) => adminApi.get('/revenue/timeline',     { params }),
  breakdown:    (params = {}) => adminApi.get('/revenue/breakdown',    { params }),
  transactions: (params = {}) => adminApi.get('/revenue/transactions', { params }),
  export:       (params = {}) =>
    adminApi.get('/revenue/export', { params, responseType: 'blob' }),
};

export const adminPaymentService = {
  stats:  ()            => adminApi.get('/payments/stats'),
  list:   (params = {}) => adminApi.get('/payments', { params }),
  export: ()            => adminApi.get('/payments/export', { responseType: 'blob' }),
};

export const adminUserServiceFull = {
  stats:     ()             => adminApi.get('/users/stats'),
  list:      (params = {})  => adminApi.get('/users', { params }),
  get:       (id)           => adminApi.get(`/users/${id}`),
  update:    (id, payload)  => adminApi.put(`/users/${id}`, payload),
  setStatus: (id, isActive) => adminApi.put(`/users/${id}/status`, { isActive }),
  remove:    (id)           => adminApi.delete(`/users/${id}`),
};