const axios = require('axios');
const config = require('../config/config');

/**
 * 统一 LLM 调用客户端 (v2.0)
 * 集中管理 API URL 拼接、鉴权 Headers、超时保护
 */
async function callLLM(messages, options = {}) {
    const {
        model = config.model,
        temperature = 0.5,
        stream = false,
        thinking = false,
        timeout = 60000,
        top_p = 0.7
    } = options;

    const apiKey = config.apiKey;
    if (!apiKey) throw new Error("API_KEY 未配置");

    const targetURL = _buildURL();

    const requestBody = {
        model,
        messages,
        stream,
        temperature,
        top_p
    };

    if (thinking) {
        requestBody.thinking = { type: "enabled" };
    }

    // 带指数退避的重试逻辑（最多重试 2 次）
    const maxRetries = 2;
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await axios.post(targetURL, requestBody, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout
            });
            return response.data;
        } catch (err) {
            lastError = err;
            const status = err.response?.status;
            const isRetryable = !status || status >= 500 || err.code === 'ECONNABORTED';
            if (isRetryable && attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000; // 1s, 2s
                console.warn(`[llmClient] 请求失败 (${err.message})，${delay}ms 后重试 (${attempt + 1}/${maxRetries})...`);
                await new Promise(r => setTimeout(r, delay));
            } else {
                break;
            }
        }
    }
    throw lastError;
}

/**
 * 流式 LLM 调用 - 通过回调逐块返回内容
 * @param {Array} messages
 * @param {Object} options
 * @param {Function} onChunk - (text: string) => void
 * @param {Function} onDone - (fullText: string) => void
 */
async function callLLMStream(messages, options = {}, onChunk, onDone) {
    const {
        model = config.model,
        temperature = 0.5,
        thinking = false,
        timeout = 90000,
        top_p = 0.7
    } = options;

    const apiKey = config.apiKey;
    if (!apiKey) throw new Error("API_KEY 未配置");

    const targetURL = _buildURL();

    const requestBody = {
        model,
        messages,
        stream: true,
        temperature,
        top_p
    };

    if (thinking) {
        requestBody.thinking = { type: "enabled" };
    }

    const response = await axios.post(targetURL, requestBody, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
        },
        responseType: 'stream',
        timeout
    });

    let fullText = '';
    let buffer = '';

    return new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
            buffer += chunk.toString('utf-8');
            const lines = buffer.split('\n');
            buffer = lines.pop(); // 保留未完成的行

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;
                if (!trimmed.startsWith('data: ')) continue;

                try {
                    const json = JSON.parse(trimmed.slice(6));
                    const delta = json.choices?.[0]?.delta?.content;
                    if (delta) {
                        fullText += delta;
                        if (onChunk) onChunk(delta);
                    }
                } catch {
                    // 忽略非 JSON 行
                }
            }
        });

        response.data.on('end', () => {
            if (onDone) onDone(fullText);
            resolve(fullText);
        });

        response.data.on('error', reject);
    });
}

function _buildURL() {
    let url = config.apiURL;
    if (!url.endsWith('/chat/completions')) {
        url = url.replace(/\/$/, '') + '/chat/completions';
    }
    return url;
}

module.exports = { callLLM, callLLMStream };
