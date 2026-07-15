<script setup>
import { ref, inject, computed, defineAsyncComponent, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useChatStore } from '../store/chatStore'
import {
  Brush,
  ChatLineRound,
  ChatDotRound,
  Download,
  EditPen,
  MoreFilled,
  PictureFilled,
  Search,
  Setting,
} from '@element-plus/icons-vue'
import { readOptimizedImage } from '../utils/imageFile'

const CharacterWizard = defineAsyncComponent(() => import('./CharacterWizard.vue'))

defineProps({
  isMobile: { type: Boolean, default: false },
  settingsOpen: { type: Boolean, default: true },
  conversationsOpen: { type: Boolean, default: true },
})

const emit = defineEmits([
  'select-character',
  'update-background',
  'toggle-settings',
  'toggle-conversations',
])
const chatStore = useChatStore()
const showSnow = inject('showSnow', ref(true))

const characters = ref([])
const selectedCharacterId = ref('')
const backgroundInputRef = ref(null)
const showWizard = ref(false)
const showMoreMenu = ref(false)

const themes = [
  { id: 'default', label: '✨ 默认', color: '#7c83fd' },
  { id: 'dark',    label: '🌙 暗夜', color: '#818cf8' },
  { id: 'sakura',  label: '🌸 樱花', color: '#e879a0' },
  { id: 'ocean',   label: '🌊 海洋', color: '#0ea5e9' },
]

// 合并预设角色 + 自定义角色
const allCharacters = computed(() => [...characters.value, ...chatStore.customCharacters])

watch(
  () => chatStore.characterSettings.id,
  (characterId) => { selectedCharacterId.value = characterId || '' },
  { immediate: true },
)

onMounted(async () => {
  try {
    const response = await fetch('/characters.json')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    if (!Array.isArray(data)) throw new Error('角色数据格式错误')
    characters.value = data
  } catch (error) {
    console.error('加载角色失败:', error)
    ElMessage.error('预设角色加载失败，请刷新页面重试')
  }
})

const onCharacterSelect = () => {
  const char = allCharacters.value.find(c => c.id === selectedCharacterId.value)
  emit('select-character', char || null)
  showMoreMenu.value = false
}

const triggerBackgroundUpload = () => {
  showMoreMenu.value = false
  backgroundInputRef.value?.click()
}
const handleBackgroundChange = async (e) => {
  const file = e.target.files[0]
  try {
    if (file) {
      emit('update-background', await readOptimizedImage(file, { maxDimension: 1920 }))
    }
  } catch (error) {
    ElMessage.error(error.message)
  }
  e.target.value = ''
}

const startNewChapter = () => {
  chatStore.createNextChapter()
  showMoreMenu.value = false
}

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
  showMoreMenu.value = false
}

const applyTheme = (theme) => {
  chatStore.setTheme(theme)
  showMoreMenu.value = false
}

const openWizard = () => {
  showWizard.value = true
  showMoreMenu.value = false
}

const onWizardSave = (character) => {
  chatStore.saveCustomCharacter(character)
  showWizard.value = false
  emit('select-character', character)
}

const displayName = computed(() => {
  return chatStore.characterSettings.basicInfo.name || ''
})
</script>

<template>
  <el-header class="app-header">
    <div class="header-left">
      <el-select
        v-if="!isMobile"
        v-model="selectedCharacterId"
        placeholder="✨ 选择角色"
        @change="onCharacterSelect"
        class="character-select"
      >
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

      <template v-if="chatStore.characterSettings.basicInfo.name">
        <el-avatar :src="chatStore.characterSettings.avatar" :size="34" class="header-avatar" />
      </template>

      <span class="header-char-name">{{ displayName || '选择角色' }}</span>
    </div>

    <div class="header-right">
      <el-tooltip :content="conversationsOpen ? '收起聊天存档' : '展开聊天存档'" placement="bottom">
        <el-button
          :icon="ChatLineRound"
          class="icon-btn"
          :class="{ active: conversationsOpen }"
          aria-label="聊天存档"
          @click="emit('toggle-conversations')"
        />
      </el-tooltip>

      <el-tooltip :content="isMobile ? '角色设置' : (settingsOpen ? '收起角色设置' : '展开角色设置')" placement="bottom">
        <el-button
          :icon="Setting"
          class="icon-btn"
          :class="{ active: settingsOpen }"
          aria-label="角色设置"
          @click="emit('toggle-settings')"
        />
      </el-tooltip>

      <template v-if="!isMobile">
        <el-tooltip content="创建新角色" placement="bottom">
          <el-button :icon="EditPen" class="icon-btn" aria-label="创建新角色" @click="openWizard" />
        </el-tooltip>
      </template>

      <el-tooltip content="搜索消息" placement="bottom">
        <el-button
          :icon="Search"
          class="icon-btn"
          :class="{ active: chatStore.showSearch }"
          aria-label="搜索消息"
          @click="chatStore.toggleSearch()"
        />
      </el-tooltip>

      <el-popover
        v-model:visible="showMoreMenu"
        placement="bottom-end"
        :width="300"
        trigger="click"
        popper-class="app-more-popover"
      >
        <template #reference>
          <el-button
            :icon="MoreFilled"
            class="icon-btn"
            aria-label="更多操作"
            title="更多操作"
          />
        </template>

        <div class="more-menu">
          <section v-if="isMobile" class="menu-section">
            <div class="menu-section-title">角色</div>
            <el-select
              v-model="selectedCharacterId"
              placeholder="切换角色"
              @change="onCharacterSelect"
              class="menu-character-select"
            >
              <el-option-group label="预设角色">
                <el-option v-for="c in characters" :key="c.id" :value="c.id" :label="c.basicInfo.name" />
              </el-option-group>
              <el-option-group v-if="chatStore.customCharacters.length" label="我的角色">
                <el-option v-for="c in chatStore.customCharacters" :key="c.id" :value="c.id" :label="c.basicInfo.name" />
              </el-option-group>
            </el-select>
            <div class="menu-actions-grid compact-actions single-action">
              <el-button class="menu-action" @click="openWizard">
                <el-icon><EditPen /></el-icon>
                <span>创建角色</span>
              </el-button>
            </div>
          </section>

          <section class="menu-section">
            <div class="menu-section-title"><el-icon><Brush /></el-icon> 外观</div>
            <div class="theme-grid">
              <button
                v-for="t in themes" :key="t.id"
                type="button"
                class="theme-item"
                :class="{ selected: chatStore.currentTheme === t.id }"
                :style="{ '--dot-color': t.color }"
                @click="applyTheme(t.id)"
              >
                <span class="theme-dot"></span>
                <span>{{ t.label }}</span>
              </button>
            </div>
            <div class="menu-actions-grid">
              <el-button class="menu-action" :class="{ active: showSnow }" @click="showSnow = !showSnow">
                <span class="menu-action-emoji">❄</span>
                <span>{{ showSnow ? '关闭特效' : '开启特效' }}</span>
              </el-button>
              <el-button class="menu-action" @click="triggerBackgroundUpload">
                <el-icon><PictureFilled /></el-icon>
                <span>聊天背景</span>
              </el-button>
            </div>
          </section>

          <section class="menu-section">
            <div class="menu-section-title"><el-icon><ChatDotRound /></el-icon> 对话</div>
            <div class="menu-actions-grid">
              <el-button class="menu-action" :disabled="!chatStore.conversationHistory.length" @click="exportHistory">
                <el-icon><Download /></el-icon>
                <span>导出对话</span>
              </el-button>
              <el-popconfirm
                title="结束当前章节，并在同一关系中开启新章节？"
                confirm-button-text="开启"
                cancel-button-text="取消"
                @confirm="startNewChapter"
              >
                <template #reference>
                  <el-button
                    class="menu-action"
                    :disabled="!chatStore.activeConversationId || chatStore.isActiveChapterReadOnly"
                  >
                    <el-icon><ChatDotRound /></el-icon>
                    <span>开启新章节</span>
                  </el-button>
                </template>
              </el-popconfirm>
            </div>
          </section>
        </div>
      </el-popover>

      <input ref="backgroundInputRef" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="handleBackgroundChange">
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

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
.more-menu {
  color: var(--text-primary);
}

.menu-section + .menu-section {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border-glass);
}

.menu-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 9px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.menu-character-select {
  width: 100%;
  margin-bottom: 8px;
}

.menu-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
}

.compact-actions {
  margin-top: 0;
}

.single-action {
  grid-template-columns: 1fr;
}

.menu-action {
  width: 100%;
  margin: 0 !important;
  justify-content: flex-start;
  gap: 7px;
  border-radius: 10px;
  color: var(--text-secondary);
  background: var(--bg-glass);
  border-color: var(--border-glass);
}

.menu-action:hover,
.menu-action.active {
  color: var(--primary);
  border-color: color-mix(in srgb, var(--primary) 45%, transparent);
  background: color-mix(in srgb, var(--primary) 9%, transparent);
}

.menu-action-emoji {
  width: 1em;
  text-align: center;
}

.danger-action,
.danger-action:hover {
  color: #dc2626;
}

.theme-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.theme-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-family: inherit;
  color: var(--text-primary);
  text-align: left;
  background: transparent;
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

@media (max-width: 800px) {
  .app-header {
    min-height: 52px;
    padding: 8px 10px;
    margin-bottom: 10px;
    border-radius: 16px;
  }

  .header-left {
    gap: 8px;
    max-width: calc(100% - 132px);
  }

  .header-avatar {
    width: 30px !important;
    height: 30px !important;
  }

  .header-char-name {
    font-size: 13px;
  }

  .header-right {
    gap: 4px;
  }

  .icon-btn {
    width: 36px !important;
    height: 36px !important;
  }
}
</style>
