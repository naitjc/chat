const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const conversationController = require("../controllers/conversationController");

router.post("/qa/stream", chatController.handleChatStream);
router.put("/model", chatController.updateModel);
router.get("/conversations", conversationController.list);
router.post("/conversations", conversationController.create);
router.get("/conversations/:id", conversationController.get);
router.put("/conversations/:id", conversationController.update);
router.patch("/conversations/:id/title", conversationController.rename);
router.delete("/conversations/:id", conversationController.remove);

module.exports = router;
