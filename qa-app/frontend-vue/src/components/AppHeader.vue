<script setup>
import { ref, reactive, inject, computed, defineAsyncComponent, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useChatStore } from '../store/chatStore'
import {
  Brush,
  ChatLineRound,
  ChatDotRound,
  Connection,
  Download,
  EditPen,
  MoreFilled,
  PictureFilled,
  Reading,
  RefreshLeft,
  Search,
  Setting,
  User,
} from '@element-plus/icons-vue'
import { readOptimizedImage } from '../utils/imageFile'
import { isNativeApp } from '../services/platform'
import { FIXED_NATIVE_MODEL } from '../services/nativeModelConfig'

const nativeSettingsService = () => import('../services/nativeModelSettings')
const nativeLlmService = () => import('../services/nativeLlmRuntime')

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
const userAvatarInputRef = ref(null)
const showWizard = ref(false)
const showMoreMenu = ref(false)
const nativeSettingsOpen = ref(false)
const isTestingNativeModel = ref(false)
const isSavingNativeModel = ref(false)
const nativeModelSettings = reactive({ apiURL: '', apiKey: '' })
const guideOpen = ref(false)
const activeGuideSection = ref(0)
const guideSections = [
  { title: '开始使用', items: ['顶部选择预设角色或自定义角色。', '点击聊天存档名称打开聊天；角色设定面板会显示当前角色和关系状态。', '没有合适角色时，创建角色并填写姓名、性格、语调、身份和背景。'] },
  { title: '创建聊天存档', items: ['自由模式没有主线和章节，适合日常聊天；创建时可设置存档名称和初始好感度。', '故事模式 Beta 需要最终目标，从好感度 0 开始；用户决定行动、节奏和是否切章。', '每个存档都有独立的聊天记录、关系状态、记忆和背景。'] },
  { title: '打开与收起存档', items: ['第一次点击存档会打开角色设定和聊天面板。', '再次点击当前存档会收起两个面板，但不会删除数据。', '删除存档会删除对应记录且无法恢复。'] },
  { title: '好感度与情绪', items: ['好感度影响称呼、亲疏距离、主动性和亲密程度。', '情绪影响语气、表达长度、玩笑程度和回应方式。', '关系阶段：0～24 素昧平生；25～60 泛泛之交；61～80 志同道合；81～90 亲密无间；91～100 相濡以沫。', '新建存档时情绪会在 -10～10 之间随机生成，并固定保存在存档中。'] },
  { title: '故事模式功能', items: ['故事状态面板显示最终目标、目标状态、当前章节、章节回顾和已确认事件。', '模型可以建议切章，但不会替用户做关键决定。', '过去章节为只读，可以从过去章节创建分支故事。'] },
  { title: '确认关键事件', items: ['在故事状态面板点击“确认关键事件”。', '填写明确发生且希望长期保留的事实。', '保存后会成为故事记忆，供后续章节继承。', '普通闲聊不会自动写入长期记忆。'] },
  { title: '上下文容量与继承', items: ['聊天面板右上角显示估算上下文占用量。', '达到约 70%、85% 和 95% 时会分级提醒。', '点击“开启并继承”会保留角色设定、关系值、长期记忆、事件、目标和前情提要。', '百分比是文本长度估算值，不等同于服务商精确 token 计费值。'] },
  { title: '角色设定与界面', items: ['角色设定支持基本信息、性格、表达习惯、行为准则、背景、喜好和厌恶。', '顶部更多菜单支持更换头像、聊天背景和主题。', '消息区域支持搜索、收藏和 Markdown 显示。'] },
  { title: '数据与隐私', items: ['Web 端使用后端 SQLite，Android 端使用手机 SQLite。', 'Web 和 Android 存档不会自动同步。', '删除存档不可恢复。', '模型请求会发送到当前配置的兼容接口，请勿填写敏感信息。'] },
  { title: '常见问题', items: ['状态通过语气、称呼、主动性和亲疏距离体现，不会机械复述数字。', '存档保存自己的角色快照；新建存档会使用最新角色设定。', 'Web 和 Android 使用独立本地存储，不会自动同步。'] },
]

const themes = [
  { id: 'default', label: '✨ 默认', color: '#7c83fd' },
  { id: 'dark',    label: '🌙 暗夜', color: '#818cf8' },
  { id: 'sakura',  label: '🌸 樱花', color: '#e879a0' },
  { id: 'ocean',   label: '🌊 海洋', color: '#0ea5e9' },
]
const defaultUserAvatar = '/avatars/用户默认头像.png'

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

  if (isNativeApp) {
    try {
      const { loadNativeModelSettings } = await nativeSettingsService()
      Object.assign(nativeModelSettings, await loadNativeModelSettings())
      if (!nativeModelSettings.apiKey) nativeSettingsOpen.value = true
    } catch (error) {
      ElMessage.error(`无法读取模型配置：${error.message}`)
    }
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

const resetChatBackground = async () => {
  if (!chatStore.chatBackground) return
  try {
    await ElMessageBox.confirm(
      '将移除当前聊天存档的自定义背景，恢复应用默认背景。',
      '恢复默认背景',
      {
        confirmButtonText: '恢复默认',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
    emit('update-background', null)
    showMoreMenu.value = false
    ElMessage.success('已恢复默认聊天背景')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.message || '恢复背景失败')
    }
  }
}

const triggerUserAvatarUpload = () => {
  showMoreMenu.value = false
  userAvatarInputRef.value?.click()
}

const handleUserAvatarChange = async (e) => {
  const file = e.target.files[0]
  try {
    if (file) {
      chatStore.setUserAvatar(await readOptimizedImage(file, { maxDimension: 512 }))
      ElMessage.success('我的头像已更新')
    }
  } catch (error) {
    ElMessage.error(error.message)
  }
  e.target.value = ''
}

const resetUserAvatar = async () => {
  if (chatStore.userAvatar === defaultUserAvatar) return
  try {
    await ElMessageBox.confirm(
      '将当前聊天存档中的个人头像恢复为默认头像。',
      '恢复默认头像',
      {
        confirmButtonText: '恢复默认',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
    chatStore.setUserAvatar(defaultUserAvatar)
    showMoreMenu.value = false
    ElMessage.success('已恢复默认头像')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.message || '恢复头像失败')
    }
  }
}

const deleteCustomChar = async (character) => {
  const characterName = character.basicInfo?.name || '未命名角色'
  const archiveCount = chatStore.relationships.filter(relationship => (
    relationship.characterId === character.id
    || relationship.characterName === characterName
  )).length
  const archiveText = archiveCount
    ? `，以及与该角色关联的 ${archiveCount} 个聊天存档和其中全部章节`
    : ''
  try {
    await ElMessageBox.confirm(
      `将永久删除角色“${characterName}”${archiveText}。此操作无法恢复。`,
      '确认删除角色',
      {
        confirmButtonText: '删除角色',
        cancelButtonText: '取消',
        type: 'warning',
        distinguishCancelAndClose: true,
      },
    )
  } catch {
    return
  }

  try {
    await chatStore.deleteCustomCharacter(character.id)
    if (selectedCharacterId.value === character.id) selectedCharacterId.value = ''
    showMoreMenu.value = false
    ElMessage.success(archiveCount ? '角色和关联存档已删除' : '角色已删除')
  } catch (error) {
    ElMessage.error(error.message)
  }
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

const openNativeSettings = async () => {
  const { loadNativeModelSettings } = await nativeSettingsService()
  Object.assign(nativeModelSettings, await loadNativeModelSettings())
  nativeSettingsOpen.value = true
  showMoreMenu.value = false
}

const saveNativeSettings = async () => {
  isSavingNativeModel.value = true
  try {
    const { saveNativeModelSettings } = await nativeSettingsService()
    Object.assign(
      nativeModelSettings,
      await saveNativeModelSettings(nativeModelSettings),
    )
    nativeSettingsOpen.value = false
    ElMessage.success('模型配置已安全保存在本机')
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    isSavingNativeModel.value = false
  }
}

const testNativeSettings = async () => {
  isTestingNativeModel.value = true
  try {
    const { saveNativeModelSettings } = await nativeSettingsService()
    const { testNativeModelConnection } = await nativeLlmService()
    const settings = await saveNativeModelSettings(nativeModelSettings)
    Object.assign(nativeModelSettings, settings)
    await testNativeModelConnection(settings)
    ElMessage.success('模型接口连接成功')
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    isTestingNativeModel.value = false
  }
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
              :aria-label="`删除角色 ${c.basicInfo.name}`"
              @click.stop="deleteCustomChar(c)"
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
      <el-tooltip content="使用教程" placement="bottom">
        <el-button
          :icon="Reading"
          class="guide-button"
          aria-label="教程"
          @click="guideOpen = true"
        >教程</el-button>
      </el-tooltip>

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
            <div v-if="chatStore.customCharacters.length" class="mobile-character-list">
              <div class="mobile-character-list-title">管理我的角色</div>
              <div
                v-for="c in chatStore.customCharacters"
                :key="`manage-${c.id}`"
                class="mobile-character-row"
              >
                <span>{{ c.basicInfo.name }}</span>
                <el-button
                  type="danger"
                  text
                  size="small"
                  :aria-label="`删除角色 ${c.basicInfo.name}`"
                  @click="deleteCustomChar(c)"
                >删除</el-button>
              </div>
            </div>
            <div class="menu-actions-grid compact-actions single-action">
              <el-button class="menu-action" @click="openWizard">
                <el-icon><EditPen /></el-icon>
                <span>创建角色</span>
              </el-button>
            </div>
          </section>

          <section class="menu-section">
            <div class="menu-section-title"><el-icon><User /></el-icon> 我的头像</div>
            <div class="user-avatar-setting">
              <el-avatar :src="chatStore.userAvatar" :size="42" />
              <div class="user-avatar-actions">
                <el-button
                  size="small"
                  :disabled="chatStore.isActiveChapterReadOnly"
                  @click="triggerUserAvatarUpload"
                >更换头像</el-button>
                <el-button
                  size="small"
                  text
                  :disabled="chatStore.userAvatar === defaultUserAvatar || chatStore.isActiveChapterReadOnly"
                  @click="resetUserAvatar"
                >恢复默认</el-button>
              </div>
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
                <span>{{ chatStore.chatBackground ? '更换背景' : '聊天背景' }}</span>
              </el-button>
              <el-button
                class="menu-action background-reset-action"
                :disabled="!chatStore.chatBackground"
                @click="resetChatBackground"
              >
                <el-icon><RefreshLeft /></el-icon>
                <span>恢复默认背景</span>
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
            </div>
          </section>

          <section v-if="isNativeApp" class="menu-section">
            <div class="menu-section-title"><el-icon><Connection /></el-icon> 本地应用</div>
            <div class="menu-actions-grid single-action">
              <el-button class="menu-action" @click="openNativeSettings">
                <el-icon><Setting /></el-icon>
                <span>模型 API 设置</span>
              </el-button>
            </div>
          </section>
        </div>
      </el-popover>

      <input ref="backgroundInputRef" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="handleBackgroundChange">
      <input ref="userAvatarInputRef" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="handleUserAvatarChange">
    </div>
  </el-header>

  <!-- 角色创建向导 -->
  <CharacterWizard v-if="showWizard" @save="onWizardSave" @close="showWizard = false" />

  <el-dialog
    v-if="isNativeApp"
    v-model="nativeSettingsOpen"
    title="模型 API 设置"
    width="min(92vw, 460px)"
    :close-on-click-modal="false"
  >
    <p class="native-settings-note">
      聊天数据保存在手机 SQLite 中；以下密钥只保存在系统安全存储，不会写入安装包。
    </p>
    <el-form label-position="top">
      <el-form-item label="OpenAI 兼容 API 地址">
        <el-input v-model="nativeModelSettings.apiURL" placeholder="https://example.com/v1" />
      </el-form-item>
      <el-form-item label="API Key">
        <el-input
          v-model="nativeModelSettings.apiKey"
          type="password"
          show-password
          autocomplete="off"
          placeholder="输入你自己的 API Key"
        />
      </el-form-item>
      <div class="fixed-model-row">
        <span>固定模型</span>
        <strong>{{ FIXED_NATIVE_MODEL }}</strong>
      </div>
    </el-form>
    <template #footer>
      <el-button :loading="isTestingNativeModel" @click="testNativeSettings">
        测试连接
      </el-button>
      <el-button type="primary" :loading="isSavingNativeModel" @click="saveNativeSettings">
        保存
      </el-button>
    </template>
  </el-dialog>

  <el-drawer v-model="guideOpen" title="使用教程" direction="rtl" size="min(760px, 92vw)" class="guide-drawer">
    <div class="guide-layout">
      <nav class="guide-nav" aria-label="教程章节">
        <button v-for="(section, index) in guideSections" :key="section.title" type="button" :class="{ active: activeGuideSection === index }" @click="activeGuideSection = index">
          <span>{{ String(index + 1).padStart(2, '0') }}</span>{{ section.title }}
        </button>
      </nav>
      <article class="guide-content">
        <p class="guide-lead">这是一个本地角色聊天应用。选择章节查看详细说明。</p>
        <section>
          <h3>{{ guideSections[activeGuideSection].title }}</h3>
          <ol><li v-for="item in guideSections[activeGuideSection].items" :key="item">{{ item }}</li></ol>
        </section>
      </article>
    </div>
  </el-drawer>
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
.guide-button { padding-inline: 10px; }

.guide-layout { display: flex; gap: 20px; min-height: 100%; }
.guide-nav { width: 180px; flex: 0 0 180px; display: flex; flex-direction: column; gap: 4px; border-right: 1px solid var(--border-glass); padding-right: 14px; }
.guide-nav button { border: 0; border-radius: 8px; padding: 9px 10px; text-align: left; background: transparent; color: var(--text-secondary); cursor: pointer; font: inherit; font-size: 12px; }
.guide-nav button span { display: inline-block; width: 26px; color: var(--text-muted); font-size: 10px; }
.guide-nav button:hover, .guide-nav button.active { background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--text-primary); }
.guide-nav button.active span { color: var(--primary); }

.guide-content { max-height: min(66vh, 620px); overflow-y: auto; padding-right: 8px; color: var(--text-secondary); line-height: 1.6; }
.guide-content section { padding: 10px 0; border-top: 1px solid var(--border-glass); }
.guide-content h3 { margin: 0 0 4px; color: var(--text-primary); font-size: 14px; }
.guide-content p { margin: 4px 0; font-size: 12px; }
.guide-content ol, .guide-content ul { margin: 5px 0 0; padding-left: 20px; font-size: 12px; }
.guide-content li { margin: 3px 0; }
.guide-lead { color: var(--text-primary); font-weight: 600; }

:deep(.guide-drawer .el-drawer__body) { padding: 18px; }

@media (max-width: 600px) {
  .guide-button { padding-inline: 8px; }
  .guide-layout { gap: 12px; }
  .guide-nav { width: 132px; flex-basis: 132px; padding-right: 8px; }
  .guide-nav button { padding-inline: 6px; font-size: 11px; }
  .guide-nav button span { width: 20px; }
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

.mobile-character-list {
  margin: 2px 0 8px;
  padding: 7px 9px;
  border: 1px solid var(--border-glass);
  border-radius: 10px;
  background: color-mix(in srgb, var(--bg-glass) 88%, transparent);
}

.mobile-character-list-title {
  margin-bottom: 2px;
  color: var(--text-muted);
  font-size: 10px;
}

.mobile-character-row {
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 12px;
}

.mobile-character-row :deep(.el-button) {
  margin: 0;
  padding: 4px;
}

.menu-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
}

.user-avatar-setting {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar-setting :deep(.el-avatar) {
  flex-shrink: 0;
  border: 2px solid var(--border-glass-strong);
}

.user-avatar-actions {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-avatar-actions :deep(.el-button) {
  margin: 0;
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

.background-reset-action {
  grid-column: 1 / -1;
}

.menu-action-emoji {
  width: 1em;
  text-align: center;
}

.native-settings-note {
  margin: 0 0 16px;
  padding: 10px 12px;
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--primary) 8%, transparent);
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.6;
}

.fixed-model-row {
  margin-top: 2px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--text-secondary);
  background: var(--input-bg);
  border: 1px solid var(--border-glass);
  border-radius: 10px;
  font-size: 12px;
}

.fixed-model-row strong {
  color: var(--text-accent);
  font-size: 13px;
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
