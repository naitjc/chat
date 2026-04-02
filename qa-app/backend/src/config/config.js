require('dotenv').config();

const config = {
    port: process.env.PORT || 8888,
    apiKey: process.env.API_KEY,
    model: process.env.MODEL || "DeepSeek-R1-0528",
    apiURL: process.env.API_BASE_URL || "https://api.edgefn.net/v1",

    setModel(newModel) {
        if (newModel && typeof newModel === 'string') {
            this.model = newModel;
        }
    },

    validate() {
        if (!this.apiKey) throw new Error('API_KEY 未配置，请在 .env 文件中设置。');
        if (!this.apiURL.startsWith('http')) throw new Error('API_BASE_URL 格式错误，应以 http:// 或 https:// 开头。');
    }
};

module.exports = config;
