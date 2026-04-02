const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data/characters');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * 加载角色持久化数据（状态 + 记忆 + 对话历史）
 */
function loadCharacterData(characterId) {
    const filePath = path.join(DATA_DIR, `${characterId}.json`);
    if (!fs.existsSync(filePath)) return null;
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    } catch (e) {
        console.error(`[持久化] 读取 ${characterId} 失败:`, e.message);
        return null;
    }
}

/**
 * 保存角色持久化数据
 */
function saveCharacterData(characterId, data) {
    const filePath = path.join(DATA_DIR, `${characterId}.json`);
    try {
        const toSave = {
            characterId,
            updatedAt: new Date().toISOString(),
            relationshipState: data.relationshipState || null,
            memory: data.memory || null,
            apiHistory: data.apiHistory || []
        };
        fs.writeFileSync(filePath, JSON.stringify(toSave, null, 2), 'utf-8');
        console.log(`[持久化] ${characterId} 已保存`);
    } catch (e) {
        console.error(`[持久化] 保存 ${characterId} 失败:`, e.message);
    }
}

/**
 * 列出所有已保存的角色 ID
 */
function listSavedCharacters() {
    try {
        return fs.readdirSync(DATA_DIR)
            .filter(f => f.endsWith('.json'))
            .map(f => f.replace('.json', ''));
    } catch {
        return [];
    }
}

/**
 * 删除角色存档
 */
function deleteCharacterData(characterId) {
    const filePath = path.join(DATA_DIR, `${characterId}.json`);
    try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {
        console.error(`[持久化] 删除 ${characterId} 失败:`, e.message);
    }
}

module.exports = { loadCharacterData, saveCharacterData, listSavedCharacters, deleteCharacterData };
