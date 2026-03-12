<script setup>
import AppHeader from './components/AppHeader.vue'
import CharacterSettings from './components/CharacterSettings.vue'
import ChatArea from './components/ChatArea.vue'
import SnowEffect from './components/SnowEffect.vue'
import PopupModal from './components/PopupModal.vue'
import { useChatStore } from './store/chatStore'

const chatStore = useChatStore()

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
    <SnowEffect />
    
    <el-container direction="vertical" style="height: 85vh; width: 100%; max-width: 85vw; margin: 0; padding: 0;">
      <AppHeader 
        @select-character="handleCharacterSelect"
        @update-background="handleBackgroundUpdate"
      />
      
      <el-main style="padding: 0; display: flex; gap: 20px; flex: 1; min-height: 0;">
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
  background: linear-gradient(180deg, #dce9f5 0%, #c5d8ef 100%);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.el-container) {
  box-sizing: border-box;
  height: 100%;
}

:deep(.el-main) {
  overflow: hidden;
  padding: 0;
}

@media (max-width: 800px) {
  :deep(.el-main) {
    flex-direction: column;
    overflow-y: auto;
  }
}
</style>
