import api from './api';

// Matches backend: POST /api/auth/register
// Expected payload shape (from authValidators.js):
// { name, email, password, phone, role, bloodGroup, location: { city, state } }
export const registerUser = async (formData) => {
  const { data } = await api.post('/auth/register', formData);
  return data; // { success, message, token, user }
};

// Matches backend: POST /api/auth/login
export const loginUser = async ({ email, password }) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data; // { success, message, token, user }
};

// Matches backend: GET /api/auth/me (protected)
export const getCurrentUser = async () => {
  const { data } = await api.get('/auth/me');
  return data; // { success, user }
};

// Matches backend: POST /api/auth/forgot-password
export const forgotPassword = async (email) => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data; // { success, message }
};

// Matches backend: PUT /api/auth/reset-password/:token
export const resetPassword = async (token, password) => {
  const { data } = await api.put(`/auth/reset-password/${token}`, { password });
  return data; // { success, message, token, user }
};
