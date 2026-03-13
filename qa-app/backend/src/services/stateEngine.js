const { callLLM } = require('./llmClient');

/**
 * AI 情感分析引擎 (v3.0 - 使用共用 llmClient)
 */
async function analyzeMessageImpact(message, characterName, currentState) {
    const analysisPrompt = `
你是一个情感分析专家。
当前角色：${characterName}
当前状态：${JSON.stringify(currentState)}
用户输入："${message}"

任务：分析并返回数值变化。必须考虑角色性格和背景（例如：提到竞争对手会让顾时夜醋意大增，提到讨厌食物会让小鸟游六花情绪下降）。

只返回 JSON 格式，示例：{"affection": 0, "trust": 0, "jealousy": 15, "mood": -5, "reason": "..."}
`;

    try {
        const data = await callLLM(
            [
                { role: "system", content: "你是一个精准的情感数值分析器。只输出 JSON 对象，不包含任何 Markdown 标签。" },
                { role: "user", content: analysisPrompt }
            ],
            { temperature: 0.1 }
        );

        let content = data.choices[0].message.content.trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        return { affection: 0, trust: 0, jealousy: 0, mood: 0, reason: "解析失败" };
    } catch (error) {
        console.error(`[关系引擎] API 报错 (${characterName}):`, error.message);
        return { affection: 0, trust: 0, jealousy: 0, mood: 0, reason: "API 请求失败" };
    }
}

function updateStateObject(oldState, impact) {
    const newState = { ...oldState };
    newState.affection = Math.min(100, Math.max(0, (newState.affection || 0) + (impact.affection || 0)));
    newState.trust    = Math.min(100, Math.max(0, (newState.trust    || 0) + (impact.trust    || 0)));
    newState.jealousy = Math.min(100, Math.max(0, (newState.jealousy || 0) + (impact.jealousy || 0)));
    newState.mood     = Math.min(50,  Math.max(-50, (newState.mood   || 0) + (impact.mood     || 0)));

    if      (newState.affection > 90) newState.relationshipStage = "life_partner";
    else if (newState.affection > 80) newState.relationshipStage = "intimate";
    else if (newState.affection > 60) newState.relationshipStage = "close";
    else                              newState.relationshipStage = "familiar";

    return newState;
}

module.exports = { analyzeMessageImpact, updateStateObject };
