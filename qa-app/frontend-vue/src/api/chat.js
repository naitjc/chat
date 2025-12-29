const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8888';

export async function sendMessageToApi(payload) {
    try {
        const response = await fetch(`${API_URL}/qa`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`HTTP 错误！状态: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API请求失败:', error);
        throw error;
    }
}
