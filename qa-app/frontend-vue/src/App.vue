<script setup>
import { ref } from 'vue';
import CharacterSettings from './components/CharacterSettings.vue';
import ChatArea from './components/ChatArea.vue';

const characterSettings = ref({
  roleName: '',
  behavioralTraits: '',
  identityBackground: '',
  personalityTraits: '',
  languageStyle: ''
});
</script>

<template>
  <div id="main-container">
    <CharacterSettings v-model="characterSettings" />
    <ChatArea :characterSettings="characterSettings" />
  </div>
</template>

<style scoped>
#main-container {
    display: flex;
    gap: 24px;
    width: 1200px;
    /* Fixed total width */
    height: 600px;
    /* Fixed total height */
    margin: 0 auto;
}
</style>
