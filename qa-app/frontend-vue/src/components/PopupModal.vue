<script setup>
import { ref } from 'vue';
import popupImage from '../assets/OIP-C.webp';

const isVisible = ref(true);

const close = () => {
  isVisible.value = false;
};
</script>

<template>
  <div v-if="isVisible" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <button class="close-button" @click="close">×</button>
      <img :src="popupImage" alt="Popup Image" class="popup-image" />
      <p class="popup-text">虽然只是一个聊天机器人，但是也不能做那些不好的事情噢！</p>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000; /* High z-index to be on top of everything including snow */
}

.modal-content {
  background-color: #1f2937; /* Dark background matching theme */
  padding: 20px;
  border-radius: 12px;
  position: relative;
  text-align: center;
  max-width: 90%;
  max-height: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  border: 1px solid #374151;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
}

.close-button:hover {
  color: #f3f4f6;
}

.popup-image {
  max-width: 100%;
  max-height: 60vh;
  border-radius: 8px;
  display: block;
  margin: 0 auto;
}

.popup-text {
  color: #f3f4f6;
  font-size: 24px;
  font-weight: bold;
  margin-top: 16px;
  margin-bottom: 0;
}
</style>
