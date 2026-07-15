import api from './api';

// All functions here call routes protected by protect + authorize('admin') on the backend.
// A non-admin calling these will get a 403 from the server.

export const getOverview = async () => {
  const { data } = await api.get('/admin/stats/overview');
  return data.overview;
};

export const getRequestsByStatus = async () => {
  const { data } = await api.get('/admin/stats/requests-by-status');
  return data.data;
};

export const getRequestsByBloodGroup = async () => {
  const { data } = await api.get('/admin/stats/requests-by-bloodgroup');
  return data.data;
};

export const getDonorsByBloodGroup = async () => {
  const { data } = await api.get('/admin/stats/donors-by-bloodgroup');
  return data.data;
};

export const getRequestsTrend = async (days = 30) => {
  const { data } = await api.get(`/admin/stats/requests-trend?days=${days}`);
  return data.data;
};

export const getTopLocations = async (limit = 10) => {
  const { data } = await api.get(`/admin/stats/top-locations?limit=${limit}`);
  return data.data;
};
