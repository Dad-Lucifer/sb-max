import axios from 'axios';
import { auth } from '../config/firebase';

export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://lavenderblush-chicken-803718.hostingersite.com';

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
    try {
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (e) {
        console.error('Error attaching auth token to request:', e);
    }
    return config;
});

export default api;
