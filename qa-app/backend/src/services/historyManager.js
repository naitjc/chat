const { callLLM } = require('./llmClient');

/**
 * 历史记录压缩服务 (已修复 API 路径)
 */
async function summarizeHistory(messages) {
    const summaryPrompt = "请简要总结上述对话的内容，保留关键信息，字数控制在200字以内。";
    const summaryMessages = [
        ...messages,
        { role: 'user', content: summaryPrompt }
    ];

    try {
        const data = await callLLM(summaryMessages, { temperature: 0.3 });
        return data.choices[0].message.content;
    } catch (error) {
        console.error("[历史压缩] 摘要生成失败:", error.message);
        throw error;
    }
}

async function compressHistoryIfNeeded(currentHistory) {
    let history = Array.isArray(currentHistory) ? currentHistory : [];
    
    if (history.length >= 10) {
        console.log(`[历史压缩] 历史长度 ${history.length}，触发压缩...`);
        try {
            const recentMessages = history.slice(-2);
            const messagesToSummarize = history.slice(0, -2);
            const summary = await summarizeHistory(messagesToSummarize);

            history = [
                { role: 'system', content: `[前情提要] ${summary}` },
                ...recentMessages
            ];
            console.log(`[历史压缩] 完成，新长度: ${history.length}`);
        } catch (err) {
            console.error("[历史压缩] 失败，使用原始历史:", err.message);
        }
    }
    
    return history;
}

module.exports = { compressHistoryIfNeeded };
