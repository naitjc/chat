const { callLLM } = require('./llmClient');
const { analyzeImpact, updateStateObject } = require('../../../shared/runtime.cjs');
async function analyzeMessageImpact(message, characterName, currentState, characterPrefs = {}, history = [], settings = {}) {
  return analyzeImpact(callLLM, message, {
    ...settings, basicInfo: settings.basicInfo || { name: characterName },
    relationshipState: currentState, preferences: characterPrefs,
  }, history);
}
module.exports = { analyzeMessageImpact, updateStateObject };
