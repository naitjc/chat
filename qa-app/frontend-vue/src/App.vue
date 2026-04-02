<script setup>
import AppHeader from './components/AppHeader.vue'
import CharacterSettings from './components/CharacterSettings.vue'
import ChatArea from './components/ChatArea.vue'
import SnowEffect from './components/SnowEffect.vue'
import PopupModal from './components/PopupModal.vue'
import { useChatStore } from './store/chatStore'
import { ref, provide } from 'vue'

const chatStore = useChatStore()
const showSnow = ref(true)
provide('showSnow', showSnow)

const handleCharacterSelect = (character) => {
  chatStore.setCharacter(character)
}

const handleBackgroundUpdate = (background) => {
  chatStore.setChatBackground(background)
}
</script>

<template>
  <div id="app-root">
    <PopupModal />
    <SnowEffect v-if="showSnow" />

    <el-container direction="vertical">
      <AppHeader
        @select-character="handleCharacterSelect"
        @update-background="handleBackgroundUpdate"
      />

      <el-main>
        <CharacterSettings />
        <ChatArea />
      </el-main>
    </el-container>
  </div>
</template>

<style scoped>
#app-root {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  /* 背景由 style.css 的 body 背景渐变接管，这里仅做布局容器 */
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

@media (max-width: 800px) {
  :deep(.el-main) {
    flex-direction: column;
    overflow-y: auto;
    gap: 12px;
  }
}
</style>
