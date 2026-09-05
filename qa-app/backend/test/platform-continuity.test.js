const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
process.env.SQLITE_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rp-platform-')), 'test.db');
const web = require('../src/services/conversationStore');
const url = relative => pathToFileURL(path.resolve(__dirname, relative)).href;
let source = fs.readFileSync(path.resolve(__dirname, '../../frontend-vue/src/services/nativeConversationStore.js'), 'utf8');
source = source.replace("'rp-core'", JSON.stringify(url('../../shared/runtime.cjs')))
  .replace("'@capacitor-community/sqlite'", JSON.stringify(url('./helpers/native-sqlite.mjs')));
const native = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
function snapshot() {
  return { characterSettings: { basicInfo: { name: '林舟' }, relationshipState: { affection: 95, mood: 35, relationshipStage: 'intimate', confirmedStage: 'intimate', stageEvidence: '双方表达了承诺' }, memory: { longTerm: ['事实'], continuity: { location: '旧车站', present: '两人', pending: [{ id: 'sea', text: '去海边', status: 'open' }] } } }, conversationHistory: [], apiHistory: [] };
}
for (const [name, platform] of [['Web', Promise.resolve(web)], ['Android SQL adapter', native]]) {
  test(`${name}: zero initial affection is preserved and high initial scores cannot grant intimacy`, async () => {
    const store = await platform;
    const zero = await store.createRelationship({ mode: 'free', snapshot: snapshot(), initialAffection: 0, initialMood: -7 });
    const persisted = await store.getConversation(zero.conversation.id);
    assert.equal(persisted.snapshot.characterSettings.relationshipState.affection, 0);
    assert.equal(persisted.snapshot.characterSettings.relationshipState.mood, -7);
    assert.equal(persisted.snapshot.characterSettings.relationshipState.relationshipStage, 'stranger');
    assert.equal(persisted.snapshot.characterSettings.relationshipState.confirmedStage, undefined);
    const empty = await store.createRelationship({ mode: 'free', snapshot: snapshot(), initialAffection: null, initialMood: 0 });
    assert.equal(empty.conversation.snapshot.characterSettings.relationshipState.affection, 10);
    const high = await store.createRelationship({ mode: 'free', snapshot: snapshot(), initialAffection: 100 });
    assert.equal(high.conversation.snapshot.characterSettings.relationshipState.relationshipStage, 'familiar');
  });
  test(`${name}: inherited state retains commitment, mood and memory`, async () => {
    const store = await platform;
    const original = snapshot();
    const created = await store.createRelationship({ mode: 'story', goal: '找到星图', snapshot: original, inheritedSummary: '前情', initialAffection: 95 });
    assert.deepEqual(created.conversation.snapshot.characterSettings, original.characterSettings);
  });
  test(`${name}: forks use the selected chapter's scene and pending status, never future changes`, async () => {
    const store = await platform;
    const created = await store.createRelationship({ mode: 'story', goal: '找到星图', snapshot: snapshot(), inheritedSummary: '前情' });
    const next = await store.createNextChapter(created.conversation.id, { summary: '仍在旧车站' });
    const changed = structuredClone(next.conversation.snapshot);
    changed.characterSettings.memory.continuity.location = '海边';
    changed.characterSettings.memory.continuity.pending[0].status = 'done';
    await store.updateConversation(next.conversation.id, { snapshot: changed });
    const fork = await store.forkConversation(created.conversation.id, { summary: '分支' });
    const state = fork.conversation.snapshot.characterSettings;
    assert.equal(state.relationshipState.relationshipStage, 'intimate');
    assert.equal(state.relationshipState.mood, 35);
    assert.equal(state.memory.continuity.location, '旧车站');
    assert.equal(state.memory.continuity.pending[0].status, 'open');
    assert.equal((await store.getConversation(next.conversation.id)).snapshot.characterSettings.memory.continuity.location, '海边');
    await assert.rejects(async () => store.updateConversation(created.conversation.id, { snapshot: changed }));
  });
}
