import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  withCredentials: true,
});

export default apiClient;
