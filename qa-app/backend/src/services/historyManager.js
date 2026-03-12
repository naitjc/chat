const axios = require('axios');
const config = require('../config/config');

async function summarizeHistory(messages, apiKey, model) {
    const summaryPrompt = "请简要总结上述对话的内容，保留关键信息，字数控制在200字以内。";
    const summaryMessages = [
        ...messages,
        { role: 'user', content: summaryPrompt }
    ];

    try {
        const response = await axios.post(
            config.apiURL,
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

async function compressHistoryIfNeeded(currentHistory, apiKey, modelToUse) {
    let history = Array.isArray(currentHistory) ? currentHistory : [];
    
    // Check if history needs compression (e.g., >= 10 messages = 5 turns)
    if (history.length >= 10) {
        console.log("History length:", history.length, "- Triggering compression");
        try {
            // Keep the last 2 messages (1 turn) intact
            const recentMessages = history.slice(-2);
            // Summarize the rest
            const messagesToSummarize = history.slice(0, -2);

            const summary = await summarizeHistory(messagesToSummarize, apiKey, modelToUse);

            // Construct new history: Summary + Recent Messages
            history = [
                { role: 'system', content: `[前情提要] ${summary}` },
                ...recentMessages
            ];
            console.log("Compression complete. New history length:", history.length);
        } catch (err) {
            console.error("Compression failed, continuing with full history:", err.message);
        }
    }
    
    return history;
}

module.exports = {
    compressHistoryIfNeeded
};
