const { callLLM } = require('./llmClient');

/**
 * AI 情感分析引擎 (v4.0 - Few-Shot 增强版)
 */
async function analyzeMessageImpact(message, characterName, currentState, characterPrefs = {}) {
    // 从角色设定中提取喜好触发词
    const likes = (characterPrefs.likes || []).join('、') || '无';
    const dislikes = (characterPrefs.dislikes || []).join('、') || '无';

    const analysisPrompt = `
你是一个专业的情感分析引擎，负责分析用户消息对角色心理状态的影响。

## 当前角色
姓名：${characterName}
喜欢：${likes}
讨厌：${dislikes}

## 当前状态
${JSON.stringify(currentState)}

## 用户输入
"${message}"

## 分析规则
- affection: 好感度变化 (-10 ~ +10)。真诚的关心、共鸣、符合角色爱好的话题 → 正向；冷漠、无礼、提及角色讨厌的事物 → 负向
- mood: 情绪变化 (-15 ~ +15)。开心的话题、幽默、被理解 → 正向；负面话题、争吵、悲伤内容 → 负向

## 示例
用户说"你今天辛苦了" → {"affection": 3, "mood": 5, "reason": "关心的话语让角色感到被珍视"}
用户说"你烦死了" → {"affection": -8, "mood": -10, "reason": "言语攻击导致情绪和好感双降"}
用户说"我爱你" → {"affection": 7, "mood": 8, "reason": "直白的表白令角色心动"}

## 输出格式
只返回 JSON，不含任何 Markdown 标签：{"affection": 0, "mood": 0, "reason": "..."}
`;

    try {
        const data = await callLLM(
            [
                { role: "system", content: "你是精准的情感数值分析器。只输出 JSON 对象，不包含任何 Markdown 标签或其他文字。" },
                { role: "user", content: analysisPrompt }
            ],
            { temperature: 0.1 }
        );

        let content = data.choices[0].message.content.trim();
        // 剔除可能的 markdown 代码块包裹
        content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        return { affection: 0, mood: 0, reason: "解析失败" };
    } catch (error) {
        console.error(`[关系引擎] API 报错 (${characterName}):`, error.message);
        return { affection: 0, mood: 0, reason: "API 请求失败" };
    }
}

function updateStateObject(oldState, impact) {
    const newState = { ...oldState };
    newState.affection = Math.min(100, Math.max(0, (newState.affection || 0) + (impact.affection || 0)));
    newState.mood      = Math.min(50,  Math.max(-50, (newState.mood    || 0) + (impact.mood      || 0)));

    if      (newState.affection > 90) newState.relationshipStage = "life_partner";
    else if (newState.affection > 80) newState.relationshipStage = "intimate";
    else if (newState.affection > 60) newState.relationshipStage = "close";
    else                              newState.relationshipStage = "familiar";

    return newState;
}

module.exports = { analyzeMessageImpact, updateStateObject };
