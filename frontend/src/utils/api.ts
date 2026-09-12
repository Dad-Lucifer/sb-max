import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://lavenderblush-chicken-803718.hostingersite.com0';

const api = axios.create({
    baseURL: API_BASE_URL,
});

export default api;
