const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { DatabaseSync } = require("node:sqlite");
const config = require("../config/config");

const databasePath = path.resolve(config.databasePath);
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new DatabaseSync(databasePath);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    title_is_custom INTEGER NOT NULL DEFAULT 0,
    character_name TEXT NOT NULL DEFAULT '',
    preview TEXT NOT NULL DEFAULT '',
    snapshot_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_conversations_updated_at
  ON conversations(updated_at DESC);
`);

const listStatement = db.prepare(`
  SELECT id, title, title_is_custom, character_name, preview,
         created_at, updated_at
  FROM conversations
  ORDER BY updated_at DESC
`);
const getStatement = db.prepare(`
  SELECT id, title, title_is_custom, character_name, preview,
         snapshot_json, created_at, updated_at
  FROM conversations
  WHERE id = ?
`);
const insertStatement = db.prepare(`
  INSERT INTO conversations (
    id, title, title_is_custom, character_name, preview,
    snapshot_json, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const updateStatement = db.prepare(`
  UPDATE conversations
  SET title = ?, title_is_custom = ?, character_name = ?, preview = ?,
      snapshot_json = ?, updated_at = ?
  WHERE id = ?
`);
const renameStatement = db.prepare(`
  UPDATE conversations
  SET title = ?, title_is_custom = 1, updated_at = ?
  WHERE id = ?
`);
const deleteStatement = db.prepare("DELETE FROM conversations WHERE id = ?");

function normalizeRow(row, includeSnapshot = false) {
  if (!row) return null;
  const result = {
    id: row.id,
    title: row.title,
    titleCustomized: Boolean(row.title_is_custom),
    characterName: row.character_name,
    preview: row.preview,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (includeSnapshot) result.snapshot = JSON.parse(row.snapshot_json);
  return result;
}

function validateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    const error = new Error("会话快照不能为空");
    error.status = 400;
    throw error;
  }
}

function listConversations() {
  return listStatement.all().map((row) => normalizeRow(row));
}

function getConversation(id) {
  return normalizeRow(getStatement.get(id), true);
}

function createConversation(input) {
  validateSnapshot(input.snapshot);

  const id = input.id || randomUUID();
  const now = new Date().toISOString();
  insertStatement.run(
    id,
    String(input.title || "新对话").trim(),
    input.titleCustomized ? 1 : 0,
    String(input.characterName || ""),
    String(input.preview || ""),
    JSON.stringify(input.snapshot),
    now,
    now,
  );
  return getConversation(id);
}

function updateConversation(id, input) {
  const existing = getConversation(id);
  if (!existing) return null;
  validateSnapshot(input.snapshot);

  const now = new Date().toISOString();
  updateStatement.run(
    String(input.title || existing.title).trim(),
    (input.titleCustomized ?? existing.titleCustomized) ? 1 : 0,
    String(input.characterName ?? existing.characterName),
    String(input.preview ?? existing.preview),
    JSON.stringify(input.snapshot),
    now,
    id,
  );
  return getConversation(id);
}

function renameConversation(id, title) {
  const normalizedTitle = String(title || "").trim();
  if (!normalizedTitle) {
    const error = new Error("会话标题不能为空");
    error.status = 400;
    throw error;
  }
  const result = renameStatement.run(normalizedTitle.slice(0, 80), new Date().toISOString(), id);
  return result.changes ? getConversation(id) : null;
}

function deleteConversation(id) {
  return deleteStatement.run(id).changes > 0;
}

module.exports = {
  databasePath,
  listConversations,
  getConversation,
  createConversation,
  updateConversation,
  renameConversation,
  deleteConversation,
};
