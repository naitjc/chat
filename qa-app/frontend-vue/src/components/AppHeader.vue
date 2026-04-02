<script setup>
import { ref, inject, computed, onMounted } from 'vue'
import { useChatStore } from '../store/chatStore'
import CharacterWizard from './CharacterWizard.vue'

const emit = defineEmits(['select-character', 'update-background'])
const chatStore = useChatStore()
const showSnow = inject('showSnow', ref(true))

const characters = ref([])
const selectedCharacterId = ref('')
const backgroundInputRef = ref(null)
const showWizard = ref(false)
const showThemePicker = ref(false)

const themes = [
  { id: 'default', label: '✨ 默认', color: '#7c83fd' },
  { id: 'dark',    label: '🌙 暗夜', color: '#818cf8' },
  { id: 'sakura',  label: '🌸 樱花', color: '#e879a0' },
  { id: 'ocean',   label: '🌊 海洋', color: '#0ea5e9' },
]

// 合并预设角色 + 自定义角色
const allCharacters = computed(() => [...characters.value, ...chatStore.customCharacters])

onMounted(async () => {
  try {
    const response = await fetch('/characters.json')
    if (response.ok) characters.value = await response.json()
  } catch (e) { console.error('加载角色失败:', e) }
})

// 单角色 / 群聊模式下的角色选择
const onCharacterSelect = () => {
  if (chatStore.isGroupMode) {
    const char = allCharacters.value.find(c => c.id === selectedCharacterId.value)
    if (char) chatStore.addGroupCharacter(char)
    selectedCharacterId.value = ''
  } else {
    const char = allCharacters.value.find(c => c.id === selectedCharacterId.value)
    emit('select-character', char || null)
  }
}

const triggerBackgroundUpload = () => backgroundInputRef.value.click()
const handleBackgroundChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (ev) => emit('update-background', ev.target.result)
    reader.readAsDataURL(file)
  }
  e.target.value = ''
}

const clearHistory = () => chatStore.clearHistory()

const deleteCustomChar = (charId) => {
  chatStore.deleteCustomCharacter(charId)
  if (selectedCharacterId.value === charId) selectedCharacterId.value = ''
}

const exportHistory = () => {
  const history = chatStore.conversationHistory
  if (!history.length) return
  const lines = history.map(m => {
    const name = m.displayRole === 'user' ? '我' : (m.characterName || chatStore.characterSettings.basicInfo.name || '角色')
    const time = m.timestamp ? `[${new Date(m.timestamp).toLocaleTimeString('zh-CN')}]` : ''
    return `${time} [${name}]: ${m.content}`
  })
  const blob = new Blob([lines.join('\n\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `对话记录_${new Date().toLocaleDateString('zh-CN')}.txt`
  a.click(); URL.revokeObjectURL(url)
}

const applyTheme = (theme) => {
  chatStore.setTheme(theme)
  showThemePicker.value = false
}

const onWizardSave = (character) => {
  chatStore.saveCustomCharacter(character)
  showWizard.value = false
  if (!chatStore.isGroupMode) {
    emit('select-character', character)
  } else {
    chatStore.addGroupCharacter(character)
  }
}

// 头部显示：群聊模式显示所有角色头像，否则显示当前角色
const displayName = computed(() => {
  if (chatStore.isGroupMode && chatStore.groupCharacters.length) {
    return `群聊 · ${chatStore.groupCharacters.length}位角色`
  }
  return chatStore.characterSettings.basicInfo.name || ''
})
</script>

<template>
  <el-header class="app-header">
    <div class="header-left">
      <!-- 角色选择 -->
      <el-select
        v-model="selectedCharacterId"
        :placeholder="chatStore.isGroupMode ? '➕ 添加角色' : '✨ 选择角色'"
        @change="onCharacterSelect"
        class="character-select"
      >
        <el-option value="" :label="chatStore.isGroupMode ? '— 选择添加 —' : '— 自定义 —'" />
        <el-option-group label="预设角色">
          <el-option v-for="c in characters" :key="c.id" :value="c.id" :label="c.basicInfo.name" />
        </el-option-group>
        <el-option-group v-if="chatStore.customCharacters.length" label="我的角色">
          <el-option v-for="c in chatStore.customCharacters" :key="c.id" :value="c.id" :label="c.basicInfo.name">
            <span style="flex: 1;">{{ c.basicInfo.name }}</span>
            <el-button
              size="small"
              type="danger"
              text
              @click.stop="deleteCustomChar(c.id)"
              style="padding: 0 4px; margin-left: 8px; font-size: 12px;"
            >✕</el-button>
          </el-option>
        </el-option-group>
      </el-select>

      <!-- 头像与名称 -->
      <template v-if="chatStore.isGroupMode && chatStore.groupCharacters.length">
        <div class="group-avatars">
          <el-avatar
            v-for="(c, i) in chatStore.groupCharacters.slice(0, 3)"
            :key="c.id"
            :src="c.avatar"
            :size="30"
            class="group-avatar"
            :style="{ marginLeft: i > 0 ? '-10px' : '0', zIndex: 3 - i }"
          />
          <span v-if="chatStore.groupCharacters.length > 3" class="group-more">
            +{{ chatStore.groupCharacters.length - 3 }}
          </span>
        </div>
      </template>
      <template v-else-if="chatStore.characterSettings.basicInfo.name">
        <el-avatar :src="chatStore.characterSettings.avatar" :size="34" class="header-avatar" />
      </template>

      <span v-if="displayName" class="header-char-name">{{ displayName }}</span>
    </div>

    <div class="header-right">
      <!-- 群聊模式切换 -->
      <el-tooltip :content="chatStore.isGroupMode ? '退出群聊' : '开启群聊'" placement="bottom">
        <el-button class="icon-btn" :class="{ active: chatStore.isGroupMode }" @click="chatStore.toggleGroupMode()">
          👥
        </el-button>
      </el-tooltip>

      <!-- 创建角色 -->
      <el-tooltip content="创建新角色" placement="bottom">
        <el-button class="icon-btn" @click="showWizard = true">✏️</el-button>
      </el-tooltip>

      <!-- 搜索 -->
      <el-tooltip content="搜索消息" placement="bottom">
        <el-button class="icon-btn" :class="{ active: chatStore.showSearch }" @click="chatStore.toggleSearch()">🔍</el-button>
      </el-tooltip>

      <!-- 雪花 -->
      <el-tooltip content="切换雪花特效" placement="bottom">
        <el-button class="icon-btn" :class="{ active: showSnow }" @click="showSnow = !showSnow">❄</el-button>
      </el-tooltip>

      <!-- 主题 -->
      <el-popover :visible="showThemePicker" placement="bottom" :width="220" trigger="click">
        <template #reference>
          <el-tooltip content="切换主题" placement="bottom">
            <el-button class="icon-btn" @click="showThemePicker = !showThemePicker">🎨</el-button>
          </el-tooltip>
        </template>
        <div class="theme-picker">
          <div class="theme-picker-title">选择主题</div>
          <div class="theme-grid">
            <div
              v-for="t in themes" :key="t.id"
              class="theme-item"
              :class="{ selected: chatStore.currentTheme === t.id }"
              :style="{ '--dot-color': t.color }"
              @click="applyTheme(t.id)"
            >
              <span class="theme-dot"></span>
              <span>{{ t.label }}</span>
            </div>
          </div>
        </div>
      </el-popover>

      <!-- 导出 -->
      <el-tooltip content="导出对话" placement="bottom">
        <el-button class="icon-btn" @click="exportHistory">📤</el-button>
      </el-tooltip>

      <!-- 清空 -->
      <el-popconfirm title="确定清空所有对话吗？" confirm-button-text="清空" cancel-button-text="取消" @confirm="clearHistory">
        <template #reference>
          <el-button class="icon-btn danger" title="清空对话">🗑</el-button>
        </template>
      </el-popconfirm>

      <!-- 背景 -->
      <el-tooltip content="设置聊天背景" placement="bottom">
        <el-button class="bg-btn" @click="triggerBackgroundUpload">🖼 背景</el-button>
      </el-tooltip>
      <input type="file" ref="backgroundInputRef" accept="image/*" style="display:none" @change="handleBackgroundChange">
    </div>
  </el-header>

  <!-- 角色创建向导 -->
  <CharacterWizard v-if="showWizard" @save="onWizardSave" @close="showWizard = false" />
</template>

<style scoped>
.app-header {
  height: auto !important;
  padding: 10px 18px;
  background: var(--bg-glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 20px;
  margin-bottom: 16px;
  border: 1px solid var(--border-glass-strong);
  box-shadow: var(--shadow-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: var(--transition);
}

.header-left { display: flex; align-items: center; gap: 10px; }
.header-right { display: flex; align-items: center; gap: 6px; }

.character-select { width: 150px; }
:deep(.character-select .el-input__wrapper) {
  border-radius: 12px;
  background: var(--input-bg);
  border: 1px solid var(--border-glass);
  box-shadow: none !important;
  color: var(--text-primary);
}

.header-avatar {
  border: 2px solid rgba(124, 131, 253, 0.4);
  box-shadow: var(--shadow-primary);
}

.header-char-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-accent);
  letter-spacing: 0.3px;
}

/* 群聊头像叠加 */
.group-avatars { display: flex; align-items: center; }
.group-avatar { border: 2px solid var(--border-glass-strong) !important; }
.group-more {
  background: var(--bg-glass-hover);
  border-radius: 12px;
  padding: 2px 7px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-left: 4px;
}

/* 图标按钮 */
.icon-btn {
  width: 34px !important; height: 34px !important;
  border-radius: 10px !important;
  background: var(--bg-glass) !important;
  border: 1px solid var(--border-glass) !important;
  font-size: 15px;
  transition: var(--transition);
  padding: 0 !important;
  color: var(--text-primary) !important;
  min-width: unset !important;
}
.icon-btn:hover {
  background: var(--bg-glass-hover) !important;
  transform: translateY(-1px);
  box-shadow: var(--shadow-primary);
}
.icon-btn.active {
  background: rgba(124, 131, 253, 0.2) !important;
  border-color: var(--primary) !important;
}
.icon-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1) !important;
  border-color: rgba(239, 68, 68, 0.3) !important;
}

.bg-btn {
  height: 34px !important;
  border-radius: 12px !important;
  background: var(--bg-glass) !important;
  border: 1px solid var(--border-glass) !important;
  font-size: 13px;
  color: var(--text-accent) !important;
  font-weight: 500;
  transition: var(--transition);
}
.bg-btn:hover { background: var(--bg-glass-hover) !important; transform: translateY(-1px); }

/* 主题选择器 */
.theme-picker-title {
  font-size: 13px; font-weight: 600; color: var(--text-secondary);
  margin-bottom: 10px;
}
.theme-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.theme-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  border: 1px solid transparent;
}
.theme-item:hover { background: var(--bg-glass-hover); }
.theme-item.selected { border-color: var(--dot-color); background: color-mix(in srgb, var(--dot-color) 8%, transparent); }
.theme-dot {
  width: 12px; height: 12px;
  border-radius: 50%;
  background: var(--dot-color);
  flex-shrink: 0;
}
</style>
