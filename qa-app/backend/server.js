require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const path = require('path');
const app = express();

const MODEL = process.env.MODEL

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, '../frontend-vue/dist'))); // Serve static files from Vue build

const apiKey = process.env.GLM_API_KEY;
const apiURL = "https://api.edgefn.net/v1/chat/completions";

if (!apiKey) {
  console.error("错误：GLM_API_KEY 未在 .env 文件中设置。");
  process.exit(1);
}

app.post('/qa', async (req, res) => {
  const { question, history, image, roleName, behavioralTraits, identityBackground, personalityTraits, languageStyle, gender, likedItems, dislikedItems, userNickname, temperature, top_p } = req.body;

  // Use MODEL from env or default to GLM-4.5V if not set (though .env should ideally have it)
  const modelToUse = process.env.MODEL || "GLM-4.5V";

  console.log("Calling API with model:", modelToUse);
  console.log(`Parameters - Temperature: ${temperature ?? 0.7}, Top-P: ${top_p ?? 0.9}`);

  if (!question && !image) {
    return res.status(400).json({ error: '问题或图片不能为空' });
  }

  let messages = [];

  let systemPrompt = "你是一个善于进行角色扮演的智能助手；";
  if (roleName || behavioralTraits || identityBackground || personalityTraits || languageStyle || gender || likedItems || dislikedItems || userNickname) {
    systemPrompt += `\n以下是有关于该角色的一些信息，请扮演以下角色:\n`;
    if (roleName) systemPrompt += `- 角色名称: ${roleName}\n`;
    if (gender) systemPrompt += `- 性别: ${gender}\n`;
    if (identityBackground) systemPrompt += `- 身份背景: ${identityBackground}\n`;
    if (personalityTraits) systemPrompt += `- 性格特征: ${personalityTraits}\n`;
    if (languageStyle) systemPrompt += `- 语言风格: ${languageStyle}\n`;
    if (behavioralTraits) systemPrompt += `- 行为特征: ${behavioralTraits}\n`;
    if (likedItems) systemPrompt += `- 喜欢的物品: ${likedItems}\n`;
    if (dislikedItems) systemPrompt += `- 讨厌的物品: ${dislikedItems}\n`;
    if (userNickname) systemPrompt += `- 你应该称呼用户为: ${userNickname}\n`;
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

  // Ensure history is an array
  let currentHistory = Array.isArray(history) ? history : [];

  // Check if history needs compression (e.g., > 10 messages = 5 turns)
  if (currentHistory.length >= 10) {
    console.log("History length:", currentHistory.length, "- Triggering compression");
    try {
      // Keep the last 2 messages (1 turn) intact
      const recentMessages = currentHistory.slice(-2);
      // Summarize the rest
      const messagesToSummarize = currentHistory.slice(0, -2);

      const summary = await summarizeHistory(messagesToSummarize, apiKey, modelToUse);

      // Construct new history: Summary + Recent Messages
      currentHistory = [
        { role: 'system', content: `[前情提要] ${summary}` },
        ...recentMessages
      ];
      console.log("Compression complete. New history length:", currentHistory.length);
    } catch (err) {
      console.error("Compression failed, continuing with full history:", err.message);
    }
  }

  const currentUserMessage = { role: 'user', content: userContent };

  messages = messages.concat([
    ...currentHistory,
    currentUserMessage
  ]);

  try {
    const response = await axios.post(
      apiURL,
      {
        model: modelToUse,
        messages: messages,
        stream: false,
        temperature: temperature ?? 0.7,
        top_p: top_p ?? 0.9
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.choices && response.data.choices.length > 0) {
      const answer = response.data.choices[0].message.content;
      const currentBotMessage = { role: 'assistant', content: answer };

      // Return the fully updated history for the *next* turn:
      // Compressed Past + Current User Msg + Current Bot Msg
      const nextApiHistory = [
        ...currentHistory,
        currentUserMessage,
        currentBotMessage
      ];

      res.json({
        answer: answer,
        history: nextApiHistory
      });
    } else {
      res.status(500).json({ error: '从API收到的响应无效' });
    }
  } catch (error) {
    console.error('调用API时出错:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: '调用大模型API失败' });
  }
});

// Helper function to summarize history
async function summarizeHistory(messages, apiKey, model) {
  const summaryPrompt = "请简要总结上述对话的内容，保留关键信息，字数控制在200字以内。";
  const summaryMessages = [
    ...messages,
    { role: 'user', content: summaryPrompt }
  ];

  try {
    const response = await axios.post(
      "https://api.edgefn.net/v1/chat/completions",
      {
        model: model,
        messages: summaryMessages,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error summarizing history:", error.message);
    throw error;
  }
}

const port = process.env.PORT || 8888;

const server = app.listen(port, () => {
  console.log(`后端服务器运行在 http://localhost:${server.address().port}`);
});