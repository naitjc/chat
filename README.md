# 🎭 角色扮演聊天应用 (Chat RP)

<div align="center">

![Vue](https://img.shields.io/badge/Vue-3.5.24-4FC08D?logo=vue.js&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![Element Plus](https://img.shields.io/badge/Element%20Plus-2.8.3-409EFF?logo=element&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?logo=vite&logoColor=white)

**基于 动态关系引擎 + 三层记忆系统 构建的沉浸式 AI 角色扮演平台**

</div>

---

## ✨ 核心功能

- 💖 **动态关系引擎 (Relationship State Engine)**：
    - **隐藏变量驱动**：角色拥有好感度 (Affection) 和情绪 (Mood) 两个动态属性。
    - **AI 实时分析**：后端利用 AI 自动判定用户输入对角色的心理影响，并实时更新状态数值。
    - **沉浸式语气变化**：AI 的回复语调会随状态波动（如情绪低落时话语更加简短、好感度高时更加亲昵），而非死板的固定 Prompt。
- 🧠 **三层记忆系统 (Memory System)**：
    - **短期记忆**：精准维持最近 10-15 条对话的上下文。
    - **长期记忆 (UserProfile)**：每 10 轮对话自动触发一次 AI 总结，记录用户喜好、厌恶（如“不爱吃姜”）。
    - **关系记忆**：记录双方重大的共同经历（如“某次一起赏雪”），让 AI 真正“记挂”你。
- 🎨 **视觉与交互优化**：
    - **真实打字动效**：发送消息后显示带角色头像的“对方正在输入...”气泡及跳动点动效。
    - **极简沉浸式 UI**：基于毛玻璃风格，隐藏具体数值（如好感度进度条），仅通过 AI 语气传达情感。
- 🧱 **工程化后端架构**：
    - **模块化服务**：拆分为 `PromptBuilder`、`StateEngine`、`MemoryManager` 等多个独立服务。
    - **统一 LLM 客户端**：封装 `llmClient` 统一处理 API 路径、鉴权、超时保护（60-90s）及多模态调用。
    - **自动压缩技术**：当历史记录过长时，AI 会自动生成“前情提要”摘要以节省 Token 并保持逻辑完整。

## 🛠️ 技术栈

### 前端
- **Vue 3.5.24** + **Pinia**: 状态管理中心。
- **Element Plus**: 深度定制的毛玻璃风格组件。
- **Axios**: 具备超时处理与多级错误反馈的请求层。

### 后端
- **Node.js 20.x** + **Express**: 异步非阻塞服务端。
- **llmClient (自研)**：支持模型思维链展示（Thinking Mode）及多服务共用的 AI 调用客户端。

## 📦 快速开始

### 1. 配置后端
进入 `qa-app/backend` 目录：
```bash
npm install
```
创建 `.env` 文件：
```env
API_KEY=your_key_here
MODEL=DeepSeek-R1-0528
PORT=8888
```

### 2. 配置前端
进入 `qa-app/frontend-vue` 目录并安装依赖，确保 `public/characters.json` 已配置初始记忆与状态字段。

### 3. 运行
```bash
# 后端
npm start

# 前端
npm run dev
```

## 📁 核心文件结构

- `backend/src/services/llmClient.js`: 统一 API 客户端（路径/鉴权/超时）。
- `backend/src/services/stateEngine.js`: 关系状态分析与数值更新逻辑。
- `backend/src/services/memoryManager.js`: 长期及关系记忆的提取与合并。
- `backend/src/services/promptBuilder.js`: 动态注入状态与记忆的系统提示词构建器。
- `frontend-vue/src/store/chatStore.js`: 核心前端 Store，管理全链路状态同步。

---
<div align="center">
  <b>不仅是一个聊天工具，更是一个有灵魂、有记忆的数字伴侣</b>
</div>
