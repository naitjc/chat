const axios = require('axios');
const config = require('../config/config');

/**
 * 统一 LLM 调用客户端
 * 集中管理 API URL 拼接、鉴权 Headers、超时保护
 */
async function callLLM(messages, options = {}) {
    const {
        model = config.model,
        temperature = 0.5,
        stream = false,
        thinking = false,
        timeout = 60000  // 默认 60 秒超时保护
    } = options;

    const apiKey = config.apiKey;
    if (!apiKey) throw new Error("API_KEY 未配置");

    // 统一路径拼接：确保末尾有 /chat/completions
    let targetURL = config.apiURL;
    if (!targetURL.endsWith('/chat/completions')) {
        targetURL = targetURL.replace(/\/$/, '') + '/chat/completions';
    }

    const requestBody = {
        model,
        messages,
        stream,
        temperature
    };

    // 仅在主对话中启用思考功能
    if (thinking) {
        requestBody.thinking = { type: "enabled" };
    }

    const response = await axios.post(targetURL, requestBody, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        timeout
    });

    return response.data;
}

module.exports = { callLLM };
