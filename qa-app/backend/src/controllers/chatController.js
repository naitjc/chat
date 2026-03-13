const aiService = require('../services/aiService');
const config = require('../config/config');

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

function updateModel(req, res) {
    const { model } = req.body;
    if (!model || typeof model !== 'string') {
        return res.status(400).json({ error: '无效的模型名称' });
    }
    
    config.setModel(model);
    console.log(`Model dynamically updated to: ${model}`);
    
    res.json({ message: '模型切换成功', currentModel: config.model });
}

module.exports = {
    handleChat,
    updateModel
};
