require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const path = require('path');
const app = express();
const port = 8888;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, '../frontend-vue/dist'))); // Serve static files from Vue build

const apiKey = process.env.GLM_API_KEY || "sk-1KHilQYuk8RNIBsoC695170b33234435Af6bB7Cc7f46A188";
const apiURL = "https://api.edgefn.net/v1/chat/completions";

if (!apiKey) {
  console.error("错误：GLM_API_KEY 未在 .env 文件中设置。");
  process.exit(1);
}

app.post('/qa', async (req, res) => {
  const { question, history, roleName, behavioralTraits, identityBackground, personalityTraits, languageStyle, image } = req.body;

  if (!question && !image) {
    return res.status(400).json({ error: '问题或图片不能为空' });
  }

  let messages = [];

  let systemPrompt = "你是一个善于进行角色扮演的智能助手；";
  if (roleName || behavioralTraits || identityBackground || personalityTraits || languageStyle) {
    systemPrompt += `\n以下是有关于该角色的一些信息，请扮演以下角色:\n`;
    if (roleName) systemPrompt += `- 角色名称: ${roleName}\n`;
    if (identityBackground) systemPrompt += `- 身份背景: ${identityBackground}\n`;
    if (personalityTraits) systemPrompt += `- 性格特征: ${personalityTraits}\n`;
    if (languageStyle) systemPrompt += `- 语言风格: ${languageStyle}\n`;
    if (behavioralTraits) systemPrompt += `- 行为特征: ${behavioralTraits}\n`;
  }

  messages.push({ role: 'system', content: systemPrompt });

  let userContent = [];
  if (question) {
    userContent.push({ type: "text", text: question });
  }
  if (image) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: image
      }
    });
  }

  messages = messages.concat([
    ...(history || []),
    { role: 'user', content: userContent }
  ]);

  try {
    console.log("Calling API with model: GLM-4.5V");
    const response = await axios.post(
      apiURL,
      {
        model: "GLM-4.5V",
        messages: messages,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.choices && response.data.choices.length > 0) {
      res.json({ answer: response.data.choices[0].message.content });
    } else {
      res.status(500).json({ error: '从API收到的响应无效' });
    }
  } catch (error) {
    console.error('调用API时出错:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: '调用大模型API失败' });
  }
});

app.listen(port, () => {
  console.log(`后端服务器运行在 http://localhost:${port}`);
});