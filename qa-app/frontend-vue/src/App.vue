<script setup>
import { ref } from 'vue'
import AppHeader from './components/AppHeader.vue'
import CharacterSettings from './components/CharacterSettings.vue'
import ChatArea from './components/ChatArea.vue'
import SnowEffect from './components/SnowEffect.vue'
import PopupModal from './components/PopupModal.vue'

const characterSettings = ref({
  roleName: '',
  behavioralTraits: '',
  identityBackground: '',
  personalityTraits: '',
  languageStyle: ''
})

const chatBackground = ref(null)

const handleCharacterSelect = (character) => {
  if (character) {
    characterSettings.value = {
      roleName: character.roleName,
      behavioralTraits: character.behavioralTraits,
      identityBackground: character.identityBackground,
      personalityTraits: character.personalityTraits,
      languageStyle: character.languageStyle,
      avatar: character.avatar // Pass avatar
    }
  } else {
    // Reset to empty if custom
    characterSettings.value = {
      roleName: '',
      behavioralTraits: '',
      identityBackground: '',
      personalityTraits: '',
      languageStyle: ''
    }
  }
}

const handleBackgroundUpdate = (background) => {
  chatBackground.value = background
}
</script>

<template>
  <div id="app-root">
    <PopupModal />
    <SnowEffect />
    
    <el-container direction="vertical" style="height: 100vh; padding: 20px;">
      <AppHeader 
        @select-character="handleCharacterSelect"
        @update-background="handleBackgroundUpdate"
      />
      
      <el-main style="padding: 0; display: flex; gap: 20px; flex: 1; min-height: 0;">
        <CharacterSettings v-model="characterSettings" />
        <ChatArea 
          :characterSettings="characterSettings" 
          :chatBackground="chatBackground"
        />
      </el-main>
    </el-container>
  </div>
</template>

<style scoped>
#app-root {
  width: 100%;
  height: 100vh;
}

:deep(.el-container) {
  box-sizing: border-box;
}

:deep(.el-main) {
  overflow: hidden;
}

@media (max-width: 800px) {
  :deep(.el-main) {
    flex-direction: column;
    overflow-y: auto;
  }
}
</style>
