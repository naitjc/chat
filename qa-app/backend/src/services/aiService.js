const axios = require('axios');
const config = require('../config/config');
const { buildSystemPrompt } = require('./promptBuilder');
const { compressHistoryIfNeeded } = require('./historyManager');

async function getChatCompletion(payload) {
    const {
        question,
        history,
        image,
        roleName,
        behavioralTraits,
        identityBackground,
        personalityTraits,
        languageStyle,
        gender,
        likedItems,
        dislikedItems,
        userNickname,
        temperature,
        top_p,
        top_k
    } = payload;

    const modelToUse = config.model;
    const apiKey = config.apiKey;

    if (!apiKey) {
        throw new Error("API_KEY 未设置");
    }

    console.log("Calling API with model:", modelToUse);
    console.log(`Parameters - Temperature: ${temperature ?? 0.7}, Top-P: ${top_p ?? 0.9}, Top-K: ${top_k ?? 50}`);

    const systemPrompt = buildSystemPrompt({
        roleName, behavioralTraits, identityBackground, personalityTraits,
        languageStyle, gender, likedItems, dislikedItems, userNickname
    });

    let messages = [{ role: 'system', content: systemPrompt }];

    let userContent = [];
    if (question) {
        userContent.push({ type: "text", text: question });
    }
    if (image) {
        userContent.push({
            type: "image_url",
            image_url: { url: image }
        });
    }

    const currentHistory = await compressHistoryIfNeeded(history, apiKey, modelToUse);
    const currentUserMessage = { role: 'user', content: userContent };

    messages = messages.concat([
        ...currentHistory,
        currentUserMessage
    ]);

    try {
        const response = await axios.post(
            config.apiURL,
            {
                model: modelToUse,
                messages: messages,
                stream: false,
                temperature: temperature ?? 0.7,
                top_p: top_p ?? 0.9,
                top_k: top_k ?? 50
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

            const nextApiHistory = [
                ...currentHistory,
                currentUserMessage,
                currentBotMessage
            ];

            return {
                answer: answer,
                history: nextApiHistory
            };
        } else {
            throw new Error('从API收到的响应无效');
        }
    } catch (error) {
        console.error('调用API时出错:', error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = {
    getChatCompletion
};
