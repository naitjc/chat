<script setup>
import AppHeader from './components/AppHeader.vue'
import CharacterSettings from './components/CharacterSettings.vue'
import ChatArea from './components/ChatArea.vue'
import SnowEffect from './components/SnowEffect.vue'
import PopupModal from './components/PopupModal.vue'
import { useChatStore } from './store/chatStore'
import { ref, provide, onMounted } from 'vue'

const chatStore = useChatStore()
const showSnow = ref(true)
provide('showSnow', showSnow)

// 主题初始化
onMounted(() => {
  document.documentElement.setAttribute('data-theme', chatStore.currentTheme)
})

const handleCharacterSelect = (character) => chatStore.setCharacter(character)
const handleBackgroundUpdate = (bg) => chatStore.setChatBackground(bg)
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
