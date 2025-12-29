require('dotenv').config();

module.exports = {
    port: process.env.PORT || 8888,
    apiKey: process.env.GLM_API_KEY,
    model: process.env.MODEL || "DeepSeek-V3.2",
    apiURL: "https://api.edgefn.net/v1/chat/completions"
};
