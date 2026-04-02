<script setup>
import { ref, inject, onMounted } from 'vue'
import { useChatStore } from '../store/chatStore'

const emit = defineEmits(['select-character', 'update-background'])
const chatStore = useChatStore()
const showSnow = inject('showSnow', ref(true))

const characters = ref([])
const selectedCharacterId = ref('')
const backgroundInputRef = ref(null)

onMounted(async () => {
  try {
    const response = await fetch('/characters.json')
    if (response.ok) characters.value = await response.json()
  } catch (error) {
    console.error('加载角色列表失败:', error)
  }
})

const onCharacterSelect = () => {
  const selectedChar = characters.value.find(c => c.id === selectedCharacterId.value)
  emit('select-character', selectedChar || null)
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

const clearHistory = () => {
  chatStore.clearHistory()
}

const exportHistory = () => {
  const history = chatStore.conversationHistory
  if (!history.length) return

  const charName = chatStore.characterSettings.basicInfo.name || '角色'
  const lines = history.map(m => `[${m.displayRole === 'user' ? '我' : charName}]: ${m.content}`)
  const text = lines.join('\n\n')
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${charName}_对话记录_${new Date().toLocaleDateString('zh-CN')}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <el-header class="app-header">
    <div class="header-left">
      <!-- 角色选择 -->
      <el-select
        v-model="selectedCharacterId"
        placeholder="✨ 选择角色"
        @change="onCharacterSelect"
        class="character-select"
      >
        <el-option value="" label="— 自定义 —" />
        <el-option
          v-for="char in characters"
          :key="char.id"
          :value="char.id"
          :label="char.basicInfo.name"
        />
      </el-select>

      <!-- 角色头像 -->
      <el-avatar
        v-if="chatStore.characterSettings.basicInfo.name"
        :src="chatStore.characterSettings.avatar"
        :size="36"
        class="header-avatar"
      />
      <span v-if="chatStore.characterSettings.basicInfo.name" class="header-char-name">
        {{ chatStore.characterSettings.basicInfo.name }}
      </span>
    </div>

    <div class="header-right">
      <!-- 雪花开关 -->
      <el-tooltip content="切换雪花特效" placement="bottom">
        <el-button
          :icon="showSnow ? 'MagicStick' : 'MagicStick'"
          circle
          class="icon-btn"
          :class="{ active: showSnow }"
          @click="showSnow = !showSnow"
        >❄</el-button>
      </el-tooltip>

      <!-- 导出对话 -->
      <el-tooltip content="导出对话记录" placement="bottom">
        <el-button circle class="icon-btn" @click="exportHistory">📤</el-button>
      </el-tooltip>

      <!-- 清空对话 -->
      <el-popconfirm
        title="确定要清空所有对话记录吗？"
        confirm-button-text="清空"
        cancel-button-text="取消"
        @confirm="clearHistory"
      >
        <template #reference>
          <el-tooltip content="清空对话" placement="bottom">
            <el-button circle class="icon-btn danger">🗑</el-button>
          </el-tooltip>
        </template>
      </el-popconfirm>

      <!-- 背景上传 -->
      <el-tooltip content="设置聊天背景" placement="bottom">
        <el-button class="bg-btn" @click="triggerBackgroundUpload">🖼 背景</el-button>
      </el-tooltip>
      <input type="file" ref="backgroundInputRef" accept="image/*" style="display: none;" @change="handleBackgroundChange">
    </div>
  </el-header>
</template>

<style scoped>
.app-header {
  height: auto !important;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 20px;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 24px rgba(124, 131, 253, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.character-select {
  width: 160px;
}

:deep(.character-select .el-input__wrapper) {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(124, 131, 253, 0.2);
  box-shadow: none !important;
}

.header-avatar {
  border: 2px solid rgba(124, 131, 253, 0.4);
  box-shadow: 0 2px 8px rgba(124, 131, 253, 0.2);
}

.header-char-name {
  font-size: 15px;
  font-weight: 600;
  color: #4c4f8f;
  letter-spacing: 0.3px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px !important;
  background: rgba(255, 255, 255, 0.5) !important;
  border: 1px solid rgba(255, 255, 255, 0.6) !important;
  font-size: 16px;
  transition: var(--transition);
  padding: 0 !important;
}

.icon-btn:hover {
  background: rgba(124, 131, 253, 0.15) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124, 131, 253, 0.2);
}

.icon-btn.active {
  background: rgba(124, 131, 253, 0.2) !important;
  border-color: rgba(124, 131, 253, 0.4) !important;
}

.icon-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1) !important;
  border-color: rgba(239, 68, 68, 0.3) !important;
}

.bg-btn {
  height: 36px;
  border-radius: 12px !important;
  background: rgba(255, 255, 255, 0.5) !important;
  border: 1px solid rgba(255, 255, 255, 0.6) !important;
  font-size: 13px;
  color: #4c4f8f;
  font-weight: 500;
  transition: var(--transition);
}

.bg-btn:hover {
  background: rgba(124, 131, 253, 0.15) !important;
  transform: translateY(-1px);
}
</style>
