import api from './api';

// Matches backend: POST /api/requests
export const createRequest = async (payload) => {
  const { data } = await api.post('/requests', payload);
  return data; // { success, message, request }
};

// Matches backend: GET /api/requests?mine=true|false&status=...
export const getRequests = async ({ mine, status } = {}) => {
  const params = new URLSearchParams();
  if (mine !== undefined) params.append('mine', mine);
  if (status) params.append('status', status);
  const { data } = await api.get(`/requests?${params.toString()}`);
  return data; // { success, count, total, requests }
};

// Matches backend: GET /api/requests/:id
export const getRequestById = async (id) => {
  const { data } = await api.get(`/requests/${id}`);
  return data.request;
};

// Matches backend: PATCH /api/requests/:id/status
// action: 'accept' | 'cancel' | 'reject' | 'fulfill'
export const updateRequestStatus = async (id, action) => {
  const { data } = await api.patch(`/requests/${id}/status`, { action });
  return data; // { success, message, request }
};
