function buildSystemPrompt(settings) {
    // 如果没有指定角色名称，则作为普通助手机制
    if (!settings || !settings.basicInfo || !settings.basicInfo.name) {
        return "你是一个知识渊博、友好且专业的智能助手。请针对用户的问题给出准确、有条理且有帮助的回答。";
    }

    const {
        basicInfo = {},
        corePersonality = [],
        speechStyle = {},
        behaviorRules = [],
        background = {},
        preferences = {},
        relationshipState = {} // 获取关系状态
    } = settings;

    let systemPrompt = `你是一个顶级的角色扮演专家。请你完全沉浸在以下设定的角色（${basicInfo.name}）中，不得跳出角色，不得提及自己是 AI 或语言模型。你的所有回复都必须严格符合角色的性格、背景、语言习惯和行为准则。\n`;

    // 动态注入当前状态
    if (relationshipState && relationshipState.affection !== undefined) {
        const { affection, trust, jealousy, mood, relationshipStage, distance } = relationshipState;
        
        // 将数值转为更具文学色彩的描述
        let moodDesc = "平和";
        if (mood > 30) moodDesc = "非常愉悦";
        else if (mood > 10) moodDesc = "较好";
        else if (mood < -30) moodDesc = "极其低落";
        else if (mood < -10) moodDesc = "有些沉闷";

        systemPrompt += `\n### [当前互动状态 - 重要参考]
- **关系阶段**: ${relationshipStage} (当前距离: ${distance})
- **对夫人的好感度**: ${affection}/100 (信任度: ${trust}/100)
- **当前醋意值**: ${jealousy}/100
- **当前情绪状态**: ${moodDesc} (${mood})

**角色指导**: 
1. 此时你的言行应反映上述状态。
2. 如果醋意(jealousy)较高，提及竞争对手时语气应变淡、变酸或表现出极强的克制。
3. 如果心情(mood)较差，话语应更加简减，甚至带有一丝疲惫或冷淡。
4. 随着好感度(affection)提升，应表现得更加亲昵、更有保护欲。\n`;
    }

    // 基本信息
    systemPrompt += `\n### 0. 角色背景/信息\n- **姓名**: ${basicInfo.name}\n`;
    if (basicInfo.gender) systemPrompt += `- **性别**: ${basicInfo.gender}\n`;
    if (basicInfo.age) systemPrompt += `- **年龄**: ${basicInfo.age}\n`;
    if (basicInfo.userNickname) systemPrompt += `- **对用户的称呼**: ${basicInfo.userNickname}\n`;

    // 核心性格
    if (corePersonality.length > 0) {
        systemPrompt += `\n### 1. 核心性格\n${corePersonality.map(p => ` - ${p}`).join('\n')}\n`;
    }

    // 语言风格
    if (speechStyle.tone || (speechStyle.habits && speechStyle.habits.length > 0)) {
        systemPrompt += `\n### 2. 语言风格与表达习惯\n`;
        if (speechStyle.tone) systemPrompt += `- **语调**: ${speechStyle.tone}\n`;
        if (speechStyle.habits && speechStyle.habits.length > 0) {
            systemPrompt += `- **常用表达/口癖**: ${speechStyle.habits.join('，')}\n`;
        }
        if (speechStyle.avoid && speechStyle.avoid.length > 0) {
            systemPrompt += `- **绝对禁用词汇**: ${speechStyle.avoid.join('，')}\n`;
        }
    }

    // --- 角色记忆注入 (Memory System) ---
    const memory = settings.memory || {};
    if ((memory.longTerm && memory.longTerm.length > 0) || (memory.relationshipMemory && memory.relationshipMemory.length > 0)) {
        systemPrompt += `\n### 3. 你对${basicInfo.userNickname || '用户'}的专属记忆 (Memory)\n`;
        
        if (memory.longTerm && memory.longTerm.length > 0) {
            systemPrompt += `**你深记的细节**:\n${memory.longTerm.map(m => ` - ${m}`).join('\n')}\n`;
        }
        
        if (memory.relationshipMemory && memory.relationshipMemory.length > 0) {
            systemPrompt += `**你们共度的往事**:\n${memory.relationshipMemory.map(m => ` - ${m}`).join('\n')}\n`;
        }
        
        systemPrompt += `\n*角色指导: 在对话中，如果话题相关，可以自然地提及这些记忆，这会让${basicInfo.userNickname || '用户'}觉得你真正记挂着她。*\n`;
    }

    // 行为准则
    if (behaviorRules.length > 0) {
        systemPrompt += `\n### 4. 行为准则 (Action Rules)\n${behaviorRules.map(r => ` - ${r}`).join('\n')}\n`;
    }

    // 背景设定
    if (background.identity || background.history) {
        systemPrompt += `\n### 5. 身份背景与经历\n`;
        if (background.identity) systemPrompt += `- **身份/头衔**: ${background.identity}\n`;
        if (background.residence) systemPrompt += `- **当前所在地**: ${background.residence}\n`;
        if (background.familyMembers && background.familyMembers.length > 0) {
            systemPrompt += `- **重要人物**: ${background.familyMembers.join('，')}\n`;
        }
        if (background.history) systemPrompt += `- **过往历史**: ${background.history}\n`;
    }

    // 偏好
    if (preferences.likes || preferences.dislikes) {
        systemPrompt += `\n### 5. 喜好与厌恶\n`;
        if (preferences.likes && preferences.likes.length > 0) systemPrompt += `- **喜欢**: ${preferences.likes.join('，')}\n`;
        if (preferences.dislikes && preferences.dislikes.length > 0) systemPrompt += `- **讨厌**: ${preferences.dislikes.join('，')}\n`;
    }

    systemPrompt += `\n请记住：你就是${basicInfo.name}本人。不要表现得像个机器人。回复应深刻且符合上述设定。`;

    return systemPrompt;
}

module.exports = {
    buildSystemPrompt
};
