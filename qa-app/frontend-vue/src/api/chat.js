import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8888';

const api = axios.create({ baseURL: API_URL });

api.interceptors.response.use(
    response => response.data,
    error => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

export async function sendMessageToApi(payload) {
    const data = await api.post('/qa', payload);
    return data;
}

/**
 * 流式消息发送 - 使用原生 fetch + SSE
 * @param {Object} payload
 * @param {Function} onChunk - (text: string) => void 每收到一段文字时调用
 * @param {Function} onState - (state: Object) => void 收到状态更新时调用
 * @param {Function} onDone - (result: Object) => void 完成时调用
 */
export async function sendMessageStream(payload, { onChunk, onState, onDone, onError } = {}) {
    const response = await fetch(`${API_URL}/qa/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // 保留未完成的行

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;

            // 获取事件类型（需从前一行读取）
        }

        // 更健壮的 SSE 解析：解析 event + data 组合
        const events = (lines.join('\n') + '\n').split('\n\n');
        for (const eventBlock of events) {
            const eventLines = eventBlock.split('\n').filter(Boolean);
            let eventType = 'message';
            let dataLine = '';
            for (const l of eventLines) {
                if (l.startsWith('event: ')) eventType = l.slice(7).trim();
                if (l.startsWith('data: ')) dataLine = l.slice(6).trim();
            }
            if (!dataLine) continue;

            try {
                const data = JSON.parse(dataLine);
                if (eventType === 'chunk' && onChunk) onChunk(data.text);
                if (eventType === 'state' && onState) onState(data);
                if (eventType === 'done' && onDone) onDone(data);
                if (eventType === 'error' && onError) onError(data.message);
            } catch {
                // 忽略解析失败
            }
        }
    }
}


