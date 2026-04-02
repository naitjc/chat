const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/qa', chatController.handleChat);
router.post('/qa/stream', chatController.handleChatStream);
router.put('/model', chatController.updateModel);

module.exports = router;
