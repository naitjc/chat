# 🎭 角色扮演聊天应用 (Chat RP)

<div align="center">

![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![Element Plus](https://img.shields.io/badge/Element%20Plus-2.11-409EFF?logo=element&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

**一个基于 Vue 3 和 Node.js 的智能角色扮演聊天应用**

支持自定义角色设定、多模态对话和精美的用户界面

[功能特性](#-功能特性) · [快速开始](#-快速开始) · [项目结构](#-项目结构) · [API 文档](#-api-文档) · [贡献指南](#-贡献)

</div>

---

## ✨ 功能特性

| 功能 | 描述 |
|------|------|
| 🎭 **角色扮演** | 支持预设角色和完全自定义角色设定 |
| 💬 **智能对话** | 基于 GLM-4.5V 大模型的智能对话系统 |
| 🖼️ **多模态支持** | 支持图片上传和视觉理解 |
| 🎨 **精美界面** | 使用 Element Plus 构建的现代化响应式 UI |
| ❄️ **动态效果** | 内置雪花特效和自定义聊天背景 |
| ⚙️ **参数调节** | 支持 Temperature 和 Top-P 参数调节 |
| 📱 **响应式设计** | 完美适配多种屏幕尺寸 |

## 🛠️ 技术栈

### 前端
- **框架**: Vue 3 (Composition API)
- **状态管理**: Pinia
- **UI 库**: Element Plus
- **构建工具**: Vite 7
- **HTTP 客户端**: Axios

### 后端
- **运行时**: Node.js 20+
- **框架**: Express 4
- **AI 模型**: GLM-4.5V (智谱 AI)
- **环境变量**: dotenv

## 📦 快速开始

### 前置要求

- Node.js >= 20.12.0
- npm >= 10.5.0
- GLM API Key ([获取地址](https://open.bigmodel.cn/))

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/naitjc/chat.git
cd chat/qa-app
```

#### 2. 配置后端

```bash
cd backend
npm install
```

创建 `.env` 文件并配置：

```env
# 必填：API 密钥
API_KEY=your_api_key_here

# 可选：服务端口（默认 8888）
PORT=8888

# 可选：模型名称（默认 GLM-4.5V 或 DeepSeek-V3.2）
MODEL=GLM-4.5V
```

#### 3. 配置前端

```bash
cd ../frontend-vue
npm install
```

### 🚀 启动应用

#### 开发模式

```bash
# 终端 1：启动后端
cd backend
npm start

# 终端 2：启动前端
cd frontend-vue
npm run dev
```

访问 `http://localhost:5173` 即可使用应用。

#### 生产模式

```bash
# 构建前端
cd frontend-vue
npm run build

# 启动后端（自动服务前端静态文件）
cd ../backend
npm start
```

访问 `http://localhost:8888` 即可使用应用。

## 📁 项目结构

```
chat/
├── README.md                    # 项目文档
├── .gitignore                   # Git 忽略配置
└── qa-app/
    ├── backend/                 # 后端服务
    │   ├── server.js            # Express 服务器入口
    │   ├── .env                 # 环境变量配置（需创建）
    │   ├── package.json         # 后端依赖配置
    │   └── src/
    │       ├── config/          # 配置文件 (config.js)
    │       ├── controllers/     # 路由控制器 (chatController.js)
    │       ├── middleware/      # 中间件 (errorHandler.js 等)
    │       ├── routes/          # 路由声明 (apiRoutes.js)
    │       └── services/        # 核心业务逻辑 (aiService.js, promptBuilder.js, historyManager.js)
    │
    └── frontend-vue/            # 前端应用
        ├── index.html           # HTML 入口
        ├── vite.config.js       # Vite 配置
        ├── package.json         # 前端依赖配置
        │
        ├── public/              # 静态资源
        │   ├── characters.json  # 预设角色配置
        │   └── avatars/         # 角色头像图片
        │
        └── src/
            ├── App.vue          # 主应用组件
            ├── main.js          # 应用入口
            ├── style.css        # 全局样式
            ├── api/             # API 网络请求层 (chat.js)
            ├── store/           # Pinia 状态管理 (chatStore.js)
            │
            ├── assets/          # 资源文件
            │
            └── components/      # Vue 组件
                ├── AppHeader.vue          # 顶部导航栏
                ├── CharacterSettings.vue  # 角色设置面板
                ├── ChatArea.vue           # 聊天主容器
                ├── chat/                  # 分拆后的聊天子组件
                │   ├── MessageBubble.vue  # 对话气泡
                │   └── MessageInput.vue   # 底部输入框与模型设置
                ├── PopupModal.vue         # 弹窗组件
                └── SnowEffect.vue         # 雪花特效
```

## 📖 API 文档

### POST `/qa`

发送聊天消息并获取 AI 回复。

#### 请求体

```json
{
  "question": "你好！",
  "history": [],
  "image": "data:image/png;base64,...",
  "roleName": "小鸟游六花",
  "behavioralTraits": "右眼戴着眼罩...",
  "identityBackground": "富樫勇太的同班同学...",
  "personalityTraits": "内向怕生...",
  "languageStyle": "充满中二病的词汇...",
  "gender": "女",
  "likedItems": "自动伞；眼罩...",
  "dislikedItems": "数学题...",
  "userNickname": "勇太",
  "temperature": 0.7,
  "top_p": 0.9
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `question` | string | 二选一 | 用户问题文本 |
| `image` | string | 二选一 | Base64 编码的图片 |
| `history` | array | 否 | 对话历史记录 |
| `roleName` | string | 否 | 角色名称 |
| `behavioralTraits` | string | 否 | 行为特征 |
| `identityBackground` | string | 否 | 身份背景 |
| `personalityTraits` | string | 否 | 性格特征 |
| `languageStyle` | string | 否 | 语言风格 |
| `gender` | string | 否 | 性别 |
| `likedItems` | string | 否 | 喜欢的物品 |
| `dislikedItems` | string | 否 | 讨厌的物品 |
| `userNickname` | string | 否 | 称呼用户的昵称 |
| `temperature` | number | 否 | 温度参数 (0-2, 默认 0.7) |
| `top_p` | number | 否 | Top-P 参数 (0-1, 默认 0.9) |

#### 响应

```json
{
  "answer": "AI 的回复内容",
  "history": [/* 更新后的带有完整上下文的历史记录 */]
}
```

### PUT `/model`

动态切换后端使用的大模型。

#### 请求体

```json
{
  "model": "GLM-4.5V"
}
```

#### 响应

```json
{
  "message": "模型切换成功",
  "currentModel": "GLM-4.5V"
}
```

## 🎮 使用指南

### 1. 选择角色

从顶部下拉菜单选择预设角色，或选择「自定义」模式创建自己的角色。

### 2. 配置角色属性

| 属性 | 说明 |
|------|------|
| 角色名称 | 角色的名字 |
| 行为特征 | 角色的外在行为表现 |
| 身份背景 | 角色的背景故事 |
| 性格特征 | 角色的性格描述 |
| 语言风格 | 角色的说话方式和口癖 |
| 性别 | 角色的性别 |
| 喜欢的物品 | 角色的喜好 |
| 讨厌的物品 | 角色厌恶的事物 |
| 称呼用户的昵称 | 角色如何称呼用户 |

### 3. 开始对话

输入消息或上传图片开始与角色对话。支持：
- 纯文本对话
- 图片上传识别
- 对话历史上下文

### 4. 个性化设置

- **调节参数**: 通过 Temperature 和 Top-P 滑块调节回复风格
- **自定义背景**: 点击「设置聊天背景」上传自定义背景图

## 🔧 配置说明

### 环境变量

#### 后端 (`qa-app/backend/.env`)

| 变量名 | 必填 | 默认值 | 描述 |
|--------|------|--------|------|
| `API_KEY` | ✅ | - | 对应底层大模型的 API 密钥 (必须设置) |
| `PORT` | ❌ | `8888` | 后端服务端口 |
| `MODEL` | ❌ | `GLM-4.5V` | 默认使用的模型名称 |

#### 前端 (`qa-app/frontend-vue/.env`)

| 变量名 | 必填 | 默认值 | 描述 |
|--------|------|--------|------|
| `VITE_API_URL` | ❌ | `http://localhost:8888/qa` | 后端 API 地址 |

### 添加新角色

编辑 `frontend-vue/public/characters.json` 添加新角色：

```json
{
  "id": "unique_id",
  "roleName": "角色名称",
  "behavioralTraits": "行为特征",
  "identityBackground": "身份背景",
  "personalityTraits": "性格特征",
  "languageStyle": "语言风格",
  "gender": "性别",
  "likedItems": "喜欢的物品",
  "dislikedItems": "讨厌的物品",
  "userNickname": "称呼用户的昵称",
  "avatar": "/avatars/your_avatar.png"
}
```

> **提示**: 头像图片需放置在 `public/avatars/` 目录下

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

---

<div align="center">

**Made with ❤️ by [naitjc](https://github.com/naitjc)**

</div>
