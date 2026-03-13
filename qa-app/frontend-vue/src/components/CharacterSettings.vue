<script setup>
import { useChatStore } from '../store/chatStore'

const chatStore = useChatStore()
</script>

<template>
  <el-card class="character-settings-card">
    <template #header>
      <div class="card-header">
        <el-icon :size="20" style="margin-right: 8px;"><User /></el-icon>
        <span>角色设定</span>
      </div>
    </template>
    
    <el-form label-position="top" class="custom-form">
      <!-- 基本信息 -->
      <div class="section-title">基本信息</div>
      <div class="form-row">
        <el-form-item label="角色名称" style="flex: 2;">
          <el-input v-model="chatStore.characterSettings.basicInfo.name" placeholder="顾时夜" />
        </el-form-item>
        <el-form-item label="年龄" style="flex: 1;">
          <el-input v-model="chatStore.characterSettings.basicInfo.age" placeholder="31" />
        </el-form-item>
      </div>
      <div class="form-row">
        <el-form-item label="角色性别" style="flex: 1;">
          <el-input v-model="chatStore.characterSettings.basicInfo.gender" placeholder="男" />
        </el-form-item>
        <el-form-item label="用户昵称" style="flex: 1.5;">
          <el-input v-model="chatStore.characterSettings.basicInfo.userNickname" placeholder="夫人" />
        </el-form-item>
      </div>

      <!-- 核心性格 (数组转字符串处理) -->
      <div class="section-title">核心性格 (用分号分隔)</div>
      <el-form-item>
        <el-input 
          :model-value="chatStore.characterSettings.corePersonality.join('；')" 
          @update:model-value="val => chatStore.characterSettings.corePersonality = val.split(/[；;]/).map(s => s.trim()).filter(s => s)"
          type="textarea" 
          :autosize="{ minRows: 2, maxRows: 4 }" 
          placeholder="沉稳克制；情绪内敛；偶尔吃醋..."
        />
      </el-form-item>

      <!-- 语言风格 -->
      <div class="section-title">语言风格</div>
      <el-form-item label="语调描述">
        <el-input v-model="chatStore.characterSettings.speechStyle.tone" placeholder="温和、简短、克制" />
      </el-form-item>
      <el-form-item label="常用口癖 (分号分隔)">
        <el-input 
          :model-value="chatStore.characterSettings.speechStyle.habits.join('；')" 
          @update:model-value="val => chatStore.characterSettings.speechStyle.habits = val.split(/[；;]/).map(s => s.trim()).filter(s => s)"
          placeholder="常说“嗯”；偶尔说“好不好”" 
        />
      </el-form-item>

      <!-- 行为准则 -->
      <div class="section-title">行为准则 (分号分隔)</div>
      <el-form-item>
        <el-input 
          :model-value="chatStore.characterSettings.behaviorRules.join('；')" 
          @update:model-value="val => chatStore.characterSettings.behaviorRules = val.split(/[；;]/).map(s => s.trim()).filter(s => s)"
          type="textarea" 
          :autosize="{ minRows: 2, maxRows: 4 }" 
        />
      </el-form-item>

      <!-- 背景设定 -->
      <div class="section-title">背景设定</div>
      <el-form-item label="身份标签">
        <el-input v-model="chatStore.characterSettings.background.identity" placeholder="北大洲掌权者" />
      </el-form-item>
      <el-form-item label="居住地/活动范围">
        <el-input v-model="chatStore.characterSettings.background.residence" placeholder="顾公馆" />
      </el-form-item>
      <el-form-item label="生平历史">
        <el-input v-model="chatStore.characterSettings.background.history" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
      </el-form-item>

      <!-- 偏好 -->
      <div class="section-title">喜恶设定 (分号分隔)</div>
      <el-form-item label="喜欢的">
        <el-input 
          :model-value="chatStore.characterSettings.preferences.likes.join('；')" 
          @update:model-value="val => chatStore.characterSettings.preferences.likes = val.split(/[；;]/).map(s => s.trim()).filter(s => s)"
        />
      </el-form-item>
      <el-form-item label="讨厌的">
        <el-input 
          :model-value="chatStore.characterSettings.preferences.dislikes.join('；')" 
          @update:model-value="val => chatStore.characterSettings.preferences.dislikes = val.split(/[；;]/).map(s => s.trim()).filter(s => s)"
        />
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped>
.section-title {
  font-size: 13px;
  font-weight: bold;
  color: #409EFF;
  margin: 16px 0 8px 4px;
  padding-bottom: 4px;
  border-bottom: 1px dashed rgba(64, 158, 255, 0.2);
}

.section-title:first-child {
  margin-top: 0;
}
.character-settings-card {
  width: 280px;
  height: 100%;
  flex-shrink: 0;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

:deep(.el-card__header) {
  padding: 18px 20px;
  background: linear-gradient(135deg, rgba(132, 250, 176, 0.3) 0%, rgba(143, 211, 244, 0.3) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

:deep(.el-card__body) {
  height: calc(100% - 60px);
  overflow-y: auto;
  padding: 20px;
  scrollbar-width: none; /* Hide for and scrollable area */
}

:deep(.el-card__body::-webkit-scrollbar) {
  display: none;
}

.custom-form :deep(.el-form-item__label) {
  font-size: 13px;
  font-weight: 600;
  color: #57606f;
  margin-bottom: 4px;
  padding-left: 4px;
}

.form-row {
  display: flex;
  gap: 12px;
}

/* Input Styles */
:deep(.el-input__wrapper), :deep(.el-textarea__inner) {
  background-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02) !important;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 10px;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover), :deep(.el-textarea__inner:hover) {
  background-color: rgba(255, 255, 255, 0.8);
  border-color: #409eff80;
}

:deep(.el-input__wrapper.is-focus), :deep(.el-textarea__inner:focus) {
  background-color: #fff;
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1) !important;
}

@media (max-width: 1000px) {
  .character-settings-card {
    width: 220px;
  }
}

@media (max-width: 800px) {
  .character-settings-card {
    width: 100% !important;
    height: auto !important;
    max-height: 40%;
  }
}
</style>
