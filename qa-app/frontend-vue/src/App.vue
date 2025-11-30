<script setup>
import { ref } from 'vue';
import AppHeader from './components/AppHeader.vue';
import CharacterSettings from './components/CharacterSettings.vue';
import ChatArea from './components/ChatArea.vue';

const characterSettings = ref({
  roleName: '',
  behavioralTraits: '',
  identityBackground: '',
  personalityTraits: '',
  languageStyle: ''
});

const chatBackground = ref(null);

const handleCharacterSelect = (character) => {
  if (character) {
    characterSettings.value = {
      roleName: character.roleName,
      behavioralTraits: character.behavioralTraits,
      identityBackground: character.identityBackground,
      personalityTraits: character.personalityTraits,
      languageStyle: character.languageStyle
    };
  } else {
    // Reset to empty if custom
    characterSettings.value = {
      roleName: '',
      behavioralTraits: '',
      identityBackground: '',
      personalityTraits: '',
      languageStyle: ''
    };
  }
};

const handleBackgroundUpdate = (background) => {
  chatBackground.value = background;
};
</script>

<template>
  <div id="app-root">
    <AppHeader 
      @select-character="handleCharacterSelect"
      @update-background="handleBackgroundUpdate"
    />
    <div id="main-container">
      <CharacterSettings v-model="characterSettings" />
      <ChatArea 
        :characterSettings="characterSettings" 
        :chatBackground="chatBackground"
      />
    </div>
  </div>
</template>

<style scoped>
#app-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

#main-container {
    display: flex;
    gap: 24px;
    width: 100%;
    min-width: 0;
    max-width: none;
    flex: 1; /* Fill remaining height */
    min-height: 0; /* Allow shrinking */
    margin: 0 auto;
}

@media (max-width: 800px) {
    #main-container {
        flex-direction: column;
        height: auto;
        width: 100%;
        padding: 0;
        gap: 10px;
    }
    
    #app-root {
      height: auto;
      min-height: 100vh;
    }
}
</style>
