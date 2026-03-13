const { callLLM } = require('./llmClient');

/**
 * 记忆抽取与总结服务 (v2.0 - 使用共用 llmClient)
 */
async function extractAndSummarizeMemories(messages, currentMemory) {
    const summaryPrompt = `
你是一个记忆分析专家。请分析以下这段对话，提取并更新角色的长期记忆。

### 当前已知记忆：
- 长期特征: ${JSON.stringify(currentMemory.longTerm || [])}
- 共同经历: ${JSON.stringify(currentMemory.relationshipMemory || [])}

### 最近对话：
${messages.map(m => `${m.role === 'user' ? '用户' : '角色'}: ${Array.isArray(m.content) ? m.content.find(c => c.type === 'text')?.text || '' : m.content}`).join('\n')}

### 任务：
提取新的长期特征（喜好、厌恶等）和重大共同经历，合并新旧，去除重复。

只返回 JSON，不含 Markdown 标签：
{"longTerm": ["..."], "relationshipMemory": ["..."]}
`;

    try {
        const data = await callLLM(
            [
                { role: "system", content: "你是一个专业的记忆总结器。只输出 JSON。" },
                { role: "user", content: summaryPrompt }
            ],
            { temperature: 0.3 }
        );

        let content = data.choices[0].message.content.trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        return currentMemory;
    } catch (error) {
        console.error(`[记忆系统] 总结失败:`, error.message);
        return currentMemory;
    }
}

module.exports = { extractAndSummarizeMemories };
