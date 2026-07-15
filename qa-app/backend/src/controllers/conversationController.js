const conversationStore = require("../services/conversationStore");

function handleError(error, res, next) {
  if (error.code?.startsWith("SQLITE_CONSTRAINT")) {
    return res.status(409).json({ error: { message: "会话 ID 已存在" } });
  }
  if (error.status) {
    return res.status(error.status).json({ error: { message: error.message } });
  }
  return next(error);
}

function list(req, res, next) {
  try {
    res.json({ conversations: conversationStore.listConversations() });
  } catch (error) {
    handleError(error, res, next);
  }
}

function get(req, res, next) {
  try {
    const conversation = conversationStore.getConversation(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: { message: "会话不存在" } });
    }
    res.json({ conversation });
  } catch (error) {
    handleError(error, res, next);
  }
}

function create(req, res, next) {
  try {
    const conversation = conversationStore.createConversation(req.body || {});
    res.status(201).json({ conversation });
  } catch (error) {
    handleError(error, res, next);
  }
}

function update(req, res, next) {
  try {
    const conversation = conversationStore.updateConversation(
      req.params.id,
      req.body || {},
    );
    if (!conversation) {
      return res.status(404).json({ error: { message: "会话不存在" } });
    }
    res.json({ conversation });
  } catch (error) {
    handleError(error, res, next);
  }
}

function rename(req, res, next) {
  try {
    const conversation = conversationStore.renameConversation(
      req.params.id,
      req.body?.title,
    );
    if (!conversation) {
      return res.status(404).json({ error: { message: "会话不存在" } });
    }
    res.json({ conversation });
  } catch (error) {
    handleError(error, res, next);
  }
}

function remove(req, res, next) {
  try {
    if (!conversationStore.deleteConversation(req.params.id)) {
      return res.status(404).json({ error: { message: "会话不存在" } });
    }
    res.status(204).end();
  } catch (error) {
    handleError(error, res, next);
  }
}

module.exports = { list, get, create, update, rename, remove };
