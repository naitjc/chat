<script setup>
import { ref, onMounted } from 'vue'

const emit = defineEmits(['select-character', 'update-background'])

const characters = ref([])
const selectedCharacterId = ref('')
const backgroundInputRef = ref(null)

onMounted(async () => {
  try {
    const response = await fetch('/characters.json')
    if (response.ok) {
      characters.value = await response.json()
    } else {
      console.error('Failed to load characters')
    }
  } catch (error) {
    console.error('Error loading characters:', error)
  }
})

const onCharacterSelect = () => {
  const selectedChar = characters.value.find(c => c.id === selectedCharacterId.value)
  emit('select-character', selectedChar || null)
}

const triggerBackgroundUpload = () => {
  backgroundInputRef.value.click()
}

const handleBackgroundChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e_reader) => {
      emit('update-background', e_reader.target.result)
    }
    reader.readAsDataURL(file)
  }
  e.target.value = ''
}
</script>

<template>
  <el-header style="height: auto; padding: 16px 24px;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <el-select 
          v-model="selectedCharacterId" 
          placeholder="选择角色" 
          @change="onCharacterSelect"
          style="width: 200px;"
        >
          <el-option value="" label="-- 自定义 --" />
          <el-option
            v-for="char in characters"
            :key="char.id"
            :value="char.id"
            :label="char.roleName"
          />
        </el-select>
      </div>
      
      <div>
        <input type="file" ref="backgroundInputRef" accept="image/*" style="display: none;" @change="handleBackgroundChange">
        <el-button type="primary" @click="triggerBackgroundUpload" :icon="'Picture'">
          设置聊天背景
        </el-button>
      </div>
    </div>
  </el-header>
</template>

<style scoped>
:deep(.el-header) {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
