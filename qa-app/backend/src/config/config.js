require("dotenv").config();
const path = require("path");

const config = {
  port: process.env.PORT || 8888,
  apiKey: process.env.API_KEY,
  model: process.env.MODEL || "GLM-5",
  apiURL: process.env.API_BASE_URL || "https://api.edgefn.net/v1",
  databasePath:
    process.env.SQLITE_PATH || path.join(__dirname, "../../data/chat.db"),

  setModel(newModel) {
    if (newModel && typeof newModel === "string") {
      this.model = newModel;
    }
  },

  validate() {
    if (!this.apiKey) throw new Error("API_KEY 未配置，请在 .env 文件中设置。");
    if (!this.apiURL.startsWith("http"))
      throw new Error("API_BASE_URL 格式错误，应以 http:// 或 https:// 开头。");
  },
};

module.exports = config;
