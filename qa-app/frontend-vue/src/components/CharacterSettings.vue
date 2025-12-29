<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    default: () => ({
      roleName: '',
      behavioralTraits: '',
      identityBackground: '',
      personalityTraits: '',
      languageStyle: '',
      gender: '',
      likedItems: '',
      dislikedItems: '',
      userNickname: ''
    })
  }
})

const emit = defineEmits(['update:modelValue'])

// Local state to bind inputs, sync with props
const localSettings = ref({ ...props.modelValue })

// Only update local when props change from parent (e.g., character selection)
watch(() => props.modelValue, (newValue) => {
  // Deep compare to avoid unnecessary updates
  const jsonNew = JSON.stringify(newValue)
  const jsonLocal = JSON.stringify(localSettings.value)
  if (jsonNew !== jsonLocal) {
    localSettings.value = { ...newValue }
  }
}, { deep: true })

// Emit changes to parent when user edits
watch(localSettings, (newValue) => {
  emit('update:modelValue', newValue)
}, { deep: true })
</script>

<template>
  <el-card class="character-settings-card">
    <template #header>
      <span style="font-size: 18px; font-weight: bold;">角色设定</span>
    </template>
    
    <el-form label-position="top" label-width="auto">
      <el-form-item label="角色名称:">
        <el-input 
          v-model="localSettings.roleName" 
          placeholder="例如：小鸟游六花"
        />
      </el-form-item>

      <el-form-item label="行为特征:">
        <el-input 
          v-model="localSettings.behavioralTraits"
          placeholder="例如：右眼戴着眼罩，左手绑着绷带..."
        />
      </el-form-item>

      <el-form-item label="身份背景:">
        <el-input 
          v-model="localSettings.identityBackground"
          type="textarea"
          :rows="2"
          placeholder="例如：富樫勇太的同班同学兼女友..."
        />
      </el-form-item>

      <el-form-item label="性格特征:">
        <el-input 
          v-model="localSettings.personalityTraits"
          type="textarea"
          :rows="2"
          placeholder="例如：内向怕生，有很强的妄想症..."
        />
      </el-form-item>

      <el-form-item label="语言风格:">
        <el-input 
          v-model="localSettings.languageStyle"
          type="textarea"
          :rows="2"
          placeholder="例如：充满中二病的词汇和设定..."
        />
      </el-form-item>

      <el-form-item label="角色性别:">
        <el-input 
          v-model="localSettings.gender"
          placeholder="例如：女"
        />
      </el-form-item>

      <el-form-item label="喜欢的物品:">
        <el-input 
          v-model="localSettings.likedItems"
          placeholder="例如：自动伞、眼罩、绷带..."
        />
      </el-form-item>

      <el-form-item label="讨厌的物品:">
        <el-input 
          v-model="localSettings.dislikedItems"
          placeholder="例如：数学题、过于现实的话题..."
        />
      </el-form-item>

      <el-form-item label="称呼用户的昵称:">
        <el-input 
          v-model="localSettings.userNickname"
          placeholder="例如：勇太、Master..."
        />
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped>
.character-settings-card {
  width: 20%;
  min-width: 240px;
  height: 100%;
  flex-shrink: 0;
}

:deep(.el-card) {
  height: 100%;
  background: rgba(255, 255, 255, 0.15) !important;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
}

:deep(.el-card__header) {
  background: linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%);
  color: #2c3e50;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

:deep(.el-card__body) {
  height: calc(100% - 60px);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;
}

/* Custom Scrollbar */
:deep(.el-card__body)::webkit-scrollbar {
  width: 6px;
}

:deep(.el-card__body)::webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

:deep(.el-card__body)::webkit-scrollbar-track {
  background-color: transparent;
}

/* Input Styles */
:deep(.el-input__wrapper), :deep(.el-textarea__inner) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  border-radius: 8px;
  transition: all 0.3sease;
}

:deep(.el-input__wrapper:hover), :deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

:deep(.el-input__wrapper.is-focus), :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px #409eff inset !important; 
}

@media (max-width: 800px) {
  .character-settings-card {
    width: 100% !important;
    height: auto !important;
    max-height: 300px;
  }
  
  :deep(.el-card__body) {
    height: auto;
    max-height: 240px;
  }
}
</style>
