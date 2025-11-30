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
      languageStyle: ''
    })
  }
})

const emit = defineEmits(['update:modelValue'])

// Local state to bind inputs, sync with props
const localSettings = ref({ ...props.modelValue })

watch(() => props.modelValue, (newValue) => {
  localSettings.value = { ...newValue }
}, { deep: true })

watch(localSettings, (newValue) => {
  emit('update:modelValue', newValue)
}, { deep: true })
</script>

<template>
  <el-card style="width: 25%; min-width: 300px; flex-shrink: 0;">
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
          placeholder="例如：男主角富樫勇太的同班同学兼女友..."
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
    </el-form>
  </el-card>
</template>

<style scoped>
:deep(.el-card) {
  height: 100%;
  overflow-y: auto;
}

:deep(.el-card__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 20px;
}

@media (max-width: 800px) {
  .el-card {
    width: 100% !important;
    height: auto !important;
    max-height: 300px;
  }
}
</style>
