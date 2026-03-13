require('dotenv').config();

const config = {
    port: process.env.PORT || 8888,
    apiKey: process.env.API_KEY,
    model: process.env.MODEL || "DeepSeek-R1-0528",
    apiURL: "https://api.edgefn.net/v1",

    setModel(newModel) {
        if (newModel && typeof newModel === 'string') {
            this.model = newModel;
        }
    }
};

module.exports = config;
