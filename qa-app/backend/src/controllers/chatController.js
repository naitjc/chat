const aiService = require('../services/aiService');
const config = require('../config/config');
const { callLLMStream } = require('../services/llmClient');
const { analyzeMessageImpact, updateStateObject } = require('../services/stateEngine');
const { buildSystemPrompt } = require('../services/promptBuilder');
const { compressHistoryIfNeeded } = require('../services/historyManager');

async function handleChat(req, res, next) {
    const { question, image } = req.body;
    if (!question && !image) {
        return res.status(400).json({ error: '问题或图片不能为空' });
    }
    try {
        const result = await aiService.getChatCompletion(req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

/**
 * 流式聊天 Handler - 使用 SSE 推送
 */
async function handleChatStream(req, res, next) {
    const { question, image, characterSettings, history = [], temperature = 0.5, top_p = 0.7 } = req.body;

    if (!question && !image) {
        return res.status(400).json({ error: '问题或图片不能为空' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (event, data) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
        // 1. 关系引擎分析
        let updatedRelationshipState = characterSettings?.relationshipState || null;
        let stateChange = null;

        if (updatedRelationshipState && question) {
            try {
                const oldAffection = updatedRelationshipState.affection || 0;
                const oldMood = updatedRelationshipState.mood || 0;
                const impact = await analyzeMessageImpact(
                    question,
                    characterSettings.basicInfo?.name || '',
                    updatedRelationshipState,
                    characterSettings.preferences
                );
                updatedRelationshipState = updateStateObject(updatedRelationshipState, impact);
                const affectionDelta = updatedRelationshipState.affection - oldAffection;
                const moodDelta = updatedRelationshipState.mood - oldMood;
                if (Math.abs(affectionDelta) >= 2 || Math.abs(moodDelta) >= 3) {
                    stateChange = { affectionDelta, moodDelta, reason: impact.reason || '' };
                }
            } catch (err) {
                console.error("[流式关系引擎] 失败:", err.message);
            }
        }

        // 推送状态更新
        if (updatedRelationshipState) {
            send('state', { relationshipState: updatedRelationshipState, stateChange });
        }

        // 2. 构建 Prompt
        const finalSettings = { ...characterSettings, relationshipState: updatedRelationshipState };
        const systemPrompt = buildSystemPrompt(finalSettings);

        let userContent = [{ type: "text", text: question }];
        if (image) userContent.push({ type: "image_url", image_url: { url: image } });

        const currentHistory = await compressHistoryIfNeeded(history);
        const currentUserMessage = { role: 'user', content: userContent };
        const messages = [{ role: 'system', content: systemPrompt }, ...currentHistory, currentUserMessage];

        // 3. 流式输出
        let fullText = '';
        await callLLMStream(
            messages,
            { temperature, top_p, thinking: false, timeout: 90000 },
            (chunk) => {
                fullText += chunk;
                send('chunk', { text: chunk });
            }
        );

        const nextApiHistory = [...currentHistory, currentUserMessage, { role: 'assistant', content: fullText }];

        // 4. 完成事件
        send('done', { history: nextApiHistory, memory: characterSettings.memory });
        res.end();

    } catch (error) {
        console.error('[流式聊天] 错误:', error.message);
        send('error', { message: error.message });
        res.end();
    }
}

function updateModel(req, res) {
    const { model } = req.body;
    if (!model || typeof model !== 'string') {
        return res.status(400).json({ error: '无效的模型名称' });
    }
    config.setModel(model);
    console.log(`Model updated to: ${model}`);
    res.json({ message: '模型切换成功', currentModel: config.model });
}

module.exports = { handleChat, handleChatStream, updateModel };
