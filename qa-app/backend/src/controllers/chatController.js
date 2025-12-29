const aiService = require('../services/aiService');

async function handleChat(req, res) {
    const { question, image } = req.body;

    if (!question && !image) {
        return res.status(400).json({ error: '问题或图片不能为空' });
    }

    try {
        const result = await aiService.getChatCompletion(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message || '调用大模型API失败' });
    }
}

module.exports = {
    handleChat
};
