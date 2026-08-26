const config = require("../config/config");
const { callLLMStream, testLLMConnection } = require("../services/llmClient");
const {
  analyzeMessageImpact,
  updateStateObject,
} = require("../services/stateEngine");
const { buildSystemPrompt } = require("../services/promptBuilder");
const { compressHistoryIfNeeded } = require("../services/historyManager");

const clampNumber = (value, min, max, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};

function validateChatInput(body = {}) {
  if (body.question != null && typeof body.question !== "string") {
    const error = new Error("消息必须是文本");
    error.status = 400;
    throw error;
  }
  if (String(body.question || "").length > 12000) {
    const error = new Error("单条消息不能超过 12000 个字符");
    error.status = 413;
    throw error;
  }
  if (body.history != null && !Array.isArray(body.history)) {
    const error = new Error("历史记录格式错误");
    error.status = 400;
    throw error;
  }
  if ((body.history?.length || 0) > 120) {
    const error = new Error("历史记录过长，请开启新的聊天存档");
    error.status = 413;
    throw error;
  }
  if (body.image != null && typeof body.image !== "string") {
    const error = new Error("图片格式错误");
    error.status = 400;
    throw error;
  }
}

async function handleChatStream(req, res, next) {
  try {
    validateChatInput(req.body || {});
  } catch (error) {
    return next(error);
  }
  const {
    question,
    image,
    characterSettings,
    history = [],
    chatContext = {},
    temperature,
    top_p,
  } = req.body;
  if (!String(question || "").trim() && !image)
    return res.status(400).json({ error: "问题或图片不能为空" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const abortController = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) abortController.abort();
  });

  const send = (event, data) => {
    if (res.destroyed || res.writableEnded) return false;
    return res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    let updatedRelationshipState = characterSettings?.relationshipState || null;
    let stateChange = null;
    const currentHistoryPromise = compressHistoryIfNeeded(history);
    let impactPromise = Promise.resolve(null);

    if (updatedRelationshipState && question) {
      impactPromise = analyzeMessageImpact(
          question,
          characterSettings.basicInfo?.name || "",
          updatedRelationshipState,
          characterSettings.preferences,
        );
    }

    const [currentHistory, impact] = await Promise.all([
      currentHistoryPromise,
      impactPromise,
    ]);

    if (updatedRelationshipState && impact) {
      try {
        const oldAffection = updatedRelationshipState.affection || 0;
        const oldMood = updatedRelationshipState.mood || 0;
        updatedRelationshipState = updateStateObject(
          updatedRelationshipState,
          impact,
        );
        const affectionDelta =
          updatedRelationshipState.affection - oldAffection;
        const moodDelta = updatedRelationshipState.mood - oldMood;
        if (Math.abs(affectionDelta) >= 2 || Math.abs(moodDelta) >= 3) {
          stateChange = {
            affectionDelta,
            moodDelta,
            reason: impact.reason || "",
          };
        }
      } catch (err) {
        console.error("[流式关系引擎]", err.message);
      }
    }

    const finalSettings = {
      ...characterSettings,
      relationshipState: updatedRelationshipState,
    };
    const systemPrompt = buildSystemPrompt(finalSettings, chatContext);
    let userContent = [{ type: "text", text: question || "" }];
    if (image)
      userContent.push({ type: "image_url", image_url: { url: image } });

    const currentUserMessage = { role: "user", content: userContent };
    const messages = [
      { role: "system", content: systemPrompt },
      ...currentHistory,
      currentUserMessage,
    ];

    let fullText = "";
    await callLLMStream(
      messages,
      {
        temperature: clampNumber(temperature, 0, 1, 0.5),
        top_p: clampNumber(top_p, 0.01, 1, 0.7),
        timeout: 90000,
        signal: abortController.signal,
      },
      (chunk) => {
        fullText += chunk;
        send("chunk", { text: chunk });
      },
    );

    // 关系变化只有在角色回复完整生成后才提交给客户端。
    // 流式生成失败时，临时计算的变化会被丢弃。
    if (updatedRelationshipState) {
      send("state", {
        relationshipState: updatedRelationshipState,
        stateChange,
      });
    }

    const nextApiHistory = [
      ...currentHistory,
      currentUserMessage,
      { role: "assistant", content: fullText },
    ];

    send("done", {
      history: nextApiHistory,
      memory: finalSettings.memory,
    });
    res.end();
  } catch (error) {
    if (abortController.signal.aborted) return;
    console.error("[流式] 错误:", error.message);
    send("error", { message: error.message });
    res.end();
  }
}

function updateModel(req, res) {
  const { model } = req.body;
  if (!model || typeof model !== "string")
    return res.status(400).json({ error: "无效的模型名称" });
  config.setModel(model);
  res.json({ message: "模型切换成功", currentModel: config.model });
}

async function testModel(req, res, next) {
  try {
    await testLLMConnection();
    res.json({ message: "模型接口连接成功" });
  } catch (error) {
    next(error);
  }
}

module.exports = { handleChatStream, updateModel, testModel };
module.exports.validateChatInput = validateChatInput;
