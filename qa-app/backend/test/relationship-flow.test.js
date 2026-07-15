const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "chat-rp-test-"));
process.env.SQLITE_PATH = path.join(tempDirectory, "chat.db");
process.env.API_KEY = process.env.API_KEY || "test-key";

const store = require("../src/services/conversationStore");
const { updateStateObject } = require("../src/services/stateEngine");
const { buildSystemPrompt } = require("../src/services/promptBuilder");
const { validateChatInput } = require("../src/controllers/chatController");

function snapshot() {
  return {
    schemaVersion: 1,
    characterSettings: {
      id: "character-one",
      basicInfo: { name: "测试角色" },
      relationshipState: {
        affection: 10,
        mood: 0,
        relationshipStage: "stranger",
        distance: "distant",
      },
      memory: { longTerm: ["初始记忆"], relationshipMemory: [] },
    },
    characterDefaults: {
      relationshipState: {
        affection: 10,
        mood: 0,
        relationshipStage: "stranger",
        distance: "distant",
      },
      memory: { longTerm: ["初始记忆"], relationshipMemory: [] },
    },
    conversationHistory: [],
    apiHistory: [],
  };
}

function createStory() {
  return store.createRelationship({
    snapshot: snapshot(),
    mode: "story",
    goal: "和用户一起找到失落的星图。",
  });
}

test("a relationship owns sequential chapters and closes the previous chapter", () => {
  const created = createStory();
  const next = store.createNextChapter(created.conversation.id, {
    title: "第二章",
    summary: "第一章结束。",
  });

  assert.equal(next.relationship.chapters.length, 2);
  assert.equal(next.relationship.chapters[0].status, "closed");
  assert.equal(next.relationship.chapters[1].status, "open");
  assert.equal(next.conversation.snapshot.conversationHistory.length, 0);
  assert.match(next.conversation.snapshot.apiHistory[0].content, /第一章结束/);
});

test("forking uses the selected chapter checkpoint and then evolves independently", () => {
  const created = createStory();
  const firstSnapshot = structuredClone(created.conversation.snapshot);
  firstSnapshot.characterSettings.relationshipState.affection = 35;
  firstSnapshot.characterSettings.memory.longTerm.push("第一章形成的记忆");
  store.updateConversation(created.conversation.id, {
    snapshot: firstSnapshot,
    title: "第一章",
  });

  const next = store.createNextChapter(created.conversation.id, {
    summary: "第一章结束。",
  });
  const secondSnapshot = structuredClone(next.conversation.snapshot);
  secondSnapshot.characterSettings.relationshipState.affection = 80;
  store.updateConversation(next.conversation.id, {
    snapshot: secondSnapshot,
  });

  const fork = store.forkConversation(created.conversation.id, {
    summary: "第一章结束。",
  });
  assert.equal(
    fork.conversation.snapshot.characterSettings.relationshipState.affection,
    35,
  );
  assert.equal(
    fork.conversation.snapshot.characterDefaults.relationshipState.affection,
    35,
  );
  assert.equal(fork.relationship.forkedFromConversationId, created.conversation.id);
  assert.notEqual(fork.relationship.id, created.relationship.id);
  assert.equal(fork.relationship.mode, "story");
  assert.equal(fork.relationship.goal, created.relationship.goal);
});

test("free mode never creates chapters", () => {
  const created = store.createRelationship({
    snapshot: snapshot(),
    mode: "free",
  });
  assert.equal(created.relationship.mode, "free");
  assert.equal(created.relationship.goal, "");
  assert.throws(
    () => store.createNextChapter(created.conversation.id),
    (error) => error.status === 409 && /自由模式/.test(error.message),
  );
});

test("new story mode requires a final goal", () => {
  assert.throws(
    () => store.createRelationship({ snapshot: snapshot(), mode: "story" }),
    (error) => error.status === 400 && /最终目标/.test(error.message),
  );
});

test("chat prompts keep the two mode boundaries explicit", () => {
  const settings = snapshot().characterSettings;
  const freePrompt = buildSystemPrompt(settings, { mode: "free" });
  assert.match(freePrompt, /没有主线、章节或预设结局/);

  const storyPrompt = buildSystemPrompt(settings, {
    mode: "story",
    goal: "找到失落的星图",
    chapterNumber: 2,
    chapterTitle: "雾中的车站",
  });
  assert.match(storyPrompt, /找到失落的星图/);
  assert.match(storyPrompt, /用户决定主角的行动/);
  assert.match(storyPrompt, /不得擅自跳章/);
});

test("chat input validation rejects oversized or malformed payloads", () => {
  assert.doesNotThrow(() => validateChatInput({ question: "你好", history: [] }));
  assert.throws(
    () => validateChatInput({ question: { text: "错误" } }),
    (error) => error.status === 400,
  );
  assert.throws(
    () => validateChatInput({ question: "x".repeat(12001) }),
    (error) => error.status === 413,
  );
  assert.throws(
    () => validateChatInput({ history: new Array(121).fill({}) }),
    (error) => error.status === 413,
  );
});

test("relationship state clamps model output and preserves the stranger stage", () => {
  const low = updateStateObject(
    { affection: 10, mood: 0, relationshipStage: "stranger" },
    { affection: 1000, mood: -1000 },
  );
  assert.equal(low.affection, 20);
  assert.equal(low.mood, -15);
  assert.equal(low.relationshipStage, "stranger");
  assert.equal(low.distance, "distant");
});
