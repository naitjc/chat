import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8888';

const api = axios.create({
    baseURL: API_URL
});

api.interceptors.response.use(
    response => response.data,
    error => {
        // We can import ElMessage and trigger it, but for a pure API layer let's just log and throw
        console.error('API Error Response:', error);
        return Promise.reject(error);
    }
);

export async function sendMessageToApi(payload) {
    try {
        // Send a POST request to '/qa'
        const data = await api.post('/qa', payload);
        return data;
    } catch (error) {
        console.error('API 请求失败:', error);
        throw error;
    }
}
