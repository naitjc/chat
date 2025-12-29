const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./src/config/config');
const apiRoutes = require('./src/routes/apiRoutes');

if (!config.apiKey) {
  console.error("错误：GLM_API_KEY 未在 .env 文件中设置。");
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, '../frontend-vue/dist'))); // Serve static files from Vue build

// Use routes
app.use('/', apiRoutes);

const server = app.listen(config.port, () => {
  console.log(`后端服务器运行在 http://localhost:${server.address().port}`);
});