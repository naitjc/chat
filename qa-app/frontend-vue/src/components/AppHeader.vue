<script setup>
import { ref, onMounted } from 'vue';

const emit = defineEmits(['select-character', 'update-background']);

const characters = ref([]);
const selectedCharacterId = ref('');
const backgroundInputRef = ref(null);

onMounted(async () => {
  try {
    const response = await fetch('/characters.json');
    if (response.ok) {
      characters.value = await response.json();
    } else {
      console.error('Failed to load characters');
    }
  } catch (error) {
    console.error('Error loading characters:', error);
  }
});

const onCharacterSelect = () => {
  const selectedChar = characters.value.find(c => c.id === selectedCharacterId.value);
  emit('select-character', selectedChar || null);
};

const triggerBackgroundUpload = () => {
  backgroundInputRef.value.click();
};

const handleBackgroundChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e_reader) => {
      emit('update-background', e_reader.target.result);
    };
    reader.readAsDataURL(file);
  }
  e.target.value = '';
};
</script>

<template>
  <div id="app-header">
    <div class="header-left">
      <div class="input-group">
        <label for="character-select">选择角色:</label>
        <select id="character-select" v-model="selectedCharacterId" @change="onCharacterSelect">
          <option value="">-- 自定义 --</option>
          <option v-for="char in characters" :key="char.id" :value="char.id">
            {{ char.name }}
          </option>
        </select>
      </div>
    </div>
    
    <div class="header-right">
      <input type="file" ref="backgroundInputRef" accept="image/*" style="display: none;" @change="handleBackgroundChange">
      <button id="bg-button" title="设置聊天背景" @click="triggerBackgroundUpload">
        🎨 设置聊天背景
      </button>
    </div>
  </div>
</template>

<style scoped>
#app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
  border-radius: 12px;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.input-group label {
  font-weight: 600;
  color: #374151;
}

select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  background-color: #f9fafb;
  color: #1f2937;
  cursor: pointer;
  transition: all 0.2s;
}

select:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

#bg-button {
  padding: 8px 16px;
  background-color: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

#bg-button:hover {
  background-color: #e5e7eb;
  color: #1f2937;
}
</style>
