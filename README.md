# Chat RP

基于 Vue、Express 与 SQLite 的本地沉浸式角色聊天应用。每个角色可以拥有多个互相独立的聊天存档，并在创建时选择聊天模式。

## 核心能力

- **自由模式**：连续聊天，不设置主线、章节或预设结局。
- **故事模式**：创建时设置最终目标；用户决定行动、推进速度和何时进入下一章，模型不会擅自跳章或替用户做关键决定。
- **关系状态**：根据互动更新好感度、情绪、关系阶段和距离，并将状态反映到角色回复中。
- **持久化与分支**：SQLite 保存角色快照、聊天记录、记忆与章节检查点；故事模式可以从过去章节创建独立分支。
- **上下文压缩**：长对话自动生成前情提要，控制发送给模型的上下文长度。
- **本地图片优化**：上传头像或背景时自动校验格式、限制大小并缩放为 WebP，避免存档无限膨胀。

## 技术栈

- 前端：Vue 3.5、Pinia 3、Element Plus 2.11、Vite 7
- 后端：Node.js 22.5+、Express 4、SQLite、Axios
- 数据：本地 SQLite 数据库，默认位于 `qa-app/backend/data/chat.db`

## 快速开始

### 1. 启动后端

```bash
cd qa-app/backend
npm install
```

创建 `.env`：

```env
API_KEY=your_key_here
API_BASE_URL=https://your-provider.example/v1
MODEL=your-model
PORT=8888
```

```bash
npm start
```

### 2. 启动前端

```bash
cd qa-app/frontend-vue
npm install
npm run dev
```

默认访问地址为 `http://127.0.0.1:5173/`，前端默认连接 `http://localhost:8888`。如需修改后端地址，可设置 `VITE_API_URL`。

## 验证

```bash
# 后端测试
cd qa-app/backend && npm test

# 前端生产构建
cd qa-app/frontend-vue && npm run build
```

后端还提供 `GET /health` 健康检查接口。

## 主要目录

```text
qa-app/
├── backend/
│   ├── src/controllers/       # HTTP 与 SSE 请求处理
│   ├── src/services/          # LLM、状态、提示词、历史与存档服务
│   └── test/                  # Node 内置测试
└── frontend-vue/
    ├── src/components/        # 页面与交互组件
    ├── src/store/             # Pinia 状态和持久化协调
    ├── src/api/               # 后端请求与 SSE 解析
    └── src/utils/             # 图片等通用能力
```

## 数据与安全边界

- `.env`、SQLite 数据库、构建输出和依赖目录已被 Git 忽略。
- 聊天接口限制单条消息与历史长度，并对请求进行速率限制。
- 模型输出 Markdown 在渲染前经过 DOMPurify 清理。
- 删除存档不可恢复，界面会在执行前要求确认。
