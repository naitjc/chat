const { callLLM } = require('./llmClient');
const { analyzeMessageImpact, updateStateObject } = require('./stateEngine');
const { buildSystemPrompt } = require('./promptBuilder');
const { compressHistoryIfNeeded } = require('./historyManager');
const { extractAndSummarizeMemories } = require('./memoryManager');

/**
 * 主聊天服务 (v3.0 - 全面重构)
 */
async function getChatCompletion(payload) {
    const {
        question,
        history,
        image,
        characterSettings,
        temperature = 0.5,
        top_p = 0.7,
    } = payload;

    // --- 1. 动态关系引擎 ---
    let updatedRelationshipState = characterSettings.relationshipState;
    if (updatedRelationshipState && question) {
        console.log(`[关系引擎] 正在分析对 ${characterSettings.basicInfo.name} 的影响...`);
        try {
            const impact = await analyzeMessageImpact(question, characterSettings.basicInfo.name, updatedRelationshipState);
            console.log(`[关系引擎] 分析结果:`, impact);
            updatedRelationshipState = updateStateObject(updatedRelationshipState, impact);
        } catch (err) {
            console.error("[关系引擎] 分析失败:", err.message);
        }
    }

    // --- 2. 记忆提取（每 10 轮触发）---
    let updatedMemory = characterSettings.memory || { longTerm: [], relationshipMemory: [] };
    const historyLength = history ? history.length : 0;
    if (historyLength > 0 && historyLength % 10 === 0) {
        console.log(`[记忆系统] 触发记忆提取 (已对话 ${historyLength} 条)...`);
        try {
            const newMemory = await extractAndSummarizeMemories(history.slice(-10), updatedMemory);
            if (newMemory) {
                updatedMemory = newMemory;
                console.log(`[记忆系统] 更新完成:`, updatedMemory);
            }
        } catch (err) {
            console.error("[记忆系统] 提取失败:", err.message);
        }
    }

    // --- 3. 构建 Prompt 并发起主对话 ---
    const finalSettings = { ...characterSettings, relationshipState: updatedRelationshipState, memory: updatedMemory };
    const systemPrompt = buildSystemPrompt(finalSettings);

    let userContent = [{ type: "text", text: question }];
    if (image) userContent.push({ type: "image_url", image_url: { url: image } });

    const currentHistory = await compressHistoryIfNeeded(history);
    const currentUserMessage = { role: 'user', content: userContent };
    
    const messages = [
        { role: 'system', content: systemPrompt },
        ...currentHistory,
        currentUserMessage
    ];

    console.log(`Calling API with model: ${payload.model || 'default'}... (${messages.length} messages)`);

    const data = await callLLM(messages, {
        temperature,
        top_p,
        thinking: true,   // 主对话启用思考功能
        timeout: 90000    // 主对话适当延长超时至 90 秒
    });

    if (!data.choices || data.choices.length === 0) {
        throw new Error('API 返回了空的 choices');
    }

    const message = data.choices[0].message;
    const answer = message.content;

    if (message.reasoning_content) {
        console.log("\n[模型思考过程]:\n", message.reasoning_content, "\n---");
    }

    const nextApiHistory = [...currentHistory, currentUserMessage, { role: 'assistant', content: answer }];

    return {
        answer,
        history: nextApiHistory,
        relationshipState: updatedRelationshipState,
        memory: updatedMemory
    };
}

module.exports = { getChatCompletion };
