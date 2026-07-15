import api from './api';

// Matches backend: GET /api/donors/search
export const searchDonors = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  const { data } = await api.get(`/donors/search?${params.toString()}`);
  return data; // { success, count, donors, ... }
};

// Matches backend: GET /api/donors/:id
export const getDonorById = async (id) => {
  const { data } = await api.get(`/donors/${id}`);
  return data.donor;
};
