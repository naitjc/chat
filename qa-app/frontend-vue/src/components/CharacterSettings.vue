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
  width: 25%;
  min-width: 300px;
  height: 100%;
  flex-shrink: 0;
}

:deep(.el-card) {
  height: 100%;
}

:deep(.el-card__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 20px;
}

:deep(.el-card__body) {
  height: calc(100% - 60px);
  overflow-y: auto;
  overflow-x: hidden;
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
