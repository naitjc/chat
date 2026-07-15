<script setup>
import AppHeader from './components/AppHeader.vue'
import CharacterSettings from './components/CharacterSettings.vue'
import ChatArea from './components/ChatArea.vue'
import ConversationSidebar from './components/ConversationSidebar.vue'
import SnowEffect from './components/SnowEffect.vue'
import PopupModal from './components/PopupModal.vue'
import { useChatStore } from './store/chatStore'
import { ref, provide, onMounted, onBeforeUnmount, watch } from 'vue'
import { Close } from '@element-plus/icons-vue'

const chatStore = useChatStore()
const showSnow = ref(true)
const isMobile = ref(false)
const showDesktopSettings = ref(true)
const showDesktopConversations = ref(true)
const settingsDrawerOpen = ref(false)
const conversationDrawerOpen = ref(false)
let mobileMediaQuery
provide('showSnow', showSnow)

const syncLayout = (event) => {
  isMobile.value = event.matches
  if (!event.matches) {
    settingsDrawerOpen.value = false
    conversationDrawerOpen.value = false
  }
}

onMounted(async () => {
  document.documentElement.setAttribute('data-theme', chatStore.currentTheme)

  mobileMediaQuery = window.matchMedia('(max-width: 800px)')
  syncLayout(mobileMediaQuery)
  mobileMediaQuery.addEventListener('change', syncLayout)
  await chatStore.initializeConversations()
})

onBeforeUnmount(() => {
  mobileMediaQuery?.removeEventListener('change', syncLayout)
  chatStore.persistActiveConversation({ force: true })
})

const handleCharacterSelect = (character) => chatStore.setCharacter(character)
const handleBackgroundUpdate = (bg) => chatStore.setChatBackground(bg)
const toggleSettings = () => {
  if (isMobile.value) {
    conversationDrawerOpen.value = false
    settingsDrawerOpen.value = !settingsDrawerOpen.value
    return
  }
  showDesktopSettings.value = !showDesktopSettings.value
}

const toggleConversations = () => {
  if (isMobile.value) {
    settingsDrawerOpen.value = false
    conversationDrawerOpen.value = !conversationDrawerOpen.value
    return
  }
  showDesktopConversations.value = !showDesktopConversations.value
}

// 角色表单和模型滑块会直接修改响应式对象，在这里统一触发防抖保存。
watch(
  () => ({
    userAvatar: chatStore.userAvatar,
    characterSettings: chatStore.characterSettings,
    chatBackground: chatStore.chatBackground,
    conversationHistory: chatStore.conversationHistory,
    apiHistory: chatStore.apiHistory,
    modelParams: chatStore.modelParams,
    bookmarkedIndices: chatStore.bookmarkedIndices,
    searchQuery: chatStore.searchQuery,
    showSearch: chatStore.showSearch,
    characterDefaults: chatStore._characterDefaults,
  }),
  () => chatStore.scheduleConversationSave(),
  { deep: true },
)
</script>

<template>
  <div id="app-root">
    <PopupModal />
    <SnowEffect v-if="showSnow" />

    <el-container direction="vertical">
      <AppHeader
        :is-mobile="isMobile"
        :settings-open="isMobile ? settingsDrawerOpen : showDesktopSettings"
        :conversations-open="isMobile ? conversationDrawerOpen : showDesktopConversations"
        @select-character="handleCharacterSelect"
        @update-background="handleBackgroundUpdate"
        @toggle-settings="toggleSettings"
        @toggle-conversations="toggleConversations"
      />
      <el-main>
        <Transition name="settings-panel">
          <ConversationSidebar v-if="!isMobile && showDesktopConversations" />
        </Transition>
        <Transition name="settings-panel">
          <CharacterSettings v-if="!isMobile && showDesktopSettings" />
        </Transition>
        <ChatArea />
      </el-main>
    </el-container>

    <el-drawer
      v-if="isMobile"
      v-model="conversationDrawerOpen"
      direction="ltr"
      size="88%"
      :with-header="false"
      class="conversation-drawer"
    >
      <ConversationSidebar @selected="conversationDrawerOpen = false" />
    </el-drawer>

    <el-drawer
      v-if="isMobile"
      v-model="settingsDrawerOpen"
      direction="ltr"
      size="88%"
      :with-header="false"
      class="settings-drawer"
    >
      <div class="mobile-drawer-header">
        <span>角色与关系</span>
        <el-button
          :icon="Close"
          circle
          text
          aria-label="关闭角色设置"
          @click="settingsDrawerOpen = false"
        />
      </div>
      <CharacterSettings />
    </el-drawer>
  </div>
</template>

<style scoped>
#app-root {
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.el-container) {
  box-sizing: border-box;
  height: 92vh;
  width: 96vw;
  max-width: 1450px;
}

:deep(.el-main) {
  overflow: hidden;
  padding: 0;
  display: flex;
  gap: 20px;
  flex: 1;
  min-height: 0;
}

.settings-panel-enter-active,
.settings-panel-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.settings-panel-enter-from,
.settings-panel-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

@media (max-width: 800px) {
  #app-root {
    align-items: stretch;
  }

  :deep(.el-container) {
    width: 100%;
    height: 100dvh;
    max-width: none;
    padding: 10px;
  }

  :deep(.el-main) {
    overflow: hidden;
    gap: 0;
  }
}
</style>

<style>
.settings-drawer.el-drawer {
  max-width: 360px;
  background: var(--bg-gradient);
}

.conversation-drawer.el-drawer {
  max-width: 360px;
  background: var(--bg-gradient);
}

.conversation-drawer .el-drawer__body {
  padding: 0;
  overflow: hidden;
}

.settings-drawer .el-drawer__body {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.mobile-drawer-header {
  height: 54px;
  padding: 0 12px 0 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 700;
  background: var(--bg-glass-hover);
  border-bottom: 1px solid var(--border-glass);
}

.settings-drawer .settings-card {
  width: 100% !important;
  height: auto !important;
  max-height: none !important;
  min-height: 0;
  flex: 1;
  border: none;
  border-radius: 0;
}

.settings-drawer .settings-card > .el-card__header {
  display: none;
}

.settings-drawer .settings-card > .el-card__body {
  height: 100% !important;
}
</style>
