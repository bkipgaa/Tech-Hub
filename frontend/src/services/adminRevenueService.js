import adminApi from './adminApi';

export const adminRevenueService = {
  overview:     ()               => adminApi.get('/revenue/overview'),
  timeline:     ()               => adminApi.get('/revenue/timeline'),
  breakdown:    ()               => adminApi.get('/revenue/breakdown'),
  transactions: (params = {})    => adminApi.get('/revenue/transactions', { params }),
  export:       ()               => adminApi.get('/revenue/export', { responseType: 'blob' }),
};

export const adminCommissionService = {
  stats:    ()            => adminApi.get('/commissions/stats'),
  list:     (params = {}) => adminApi.get('/commissions', { params }),
  markPaid: (id, ref)     => adminApi.put(`/commissions/${id}/mark-paid`, { reference: ref }),
  waive:    (id, reason)  => adminApi.put(`/commissions/${id}/waive`, { reason }),
  export:   ()            => adminApi.get('/commissions/export', { responseType: 'blob' }),
};

export const adminPaymentService = {
  stats:  ()            => adminApi.get('/payments/stats'),
  list:   (params = {}) => adminApi.get('/payments', { params }),
  export: ()            => adminApi.get('/payments/export', { responseType: 'blob' }),
};

export const adminUserServiceFull = {
  stats:     ()            => adminApi.get('/users/stats'),
  list:      (params = {}) => adminApi.get('/users', { params }),
  get:       (id)          => adminApi.get(`/users/${id}`),
  update:    (id, payload) => adminApi.put(`/users/${id}`, payload),
  setStatus: (id, isActive)=> adminApi.put(`/users/${id}/status`, { isActive }),
  remove:    (id)          => adminApi.delete(`/users/${id}`),
};