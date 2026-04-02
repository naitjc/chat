<script setup>
import { computed } from 'vue'
import { useChatStore } from '../store/chatStore'
import StatusPanel from './chat/StatusPanel.vue'

const chatStore = useChatStore()
const settings = computed(() => chatStore.characterSettings)
const hasCharacter = computed(() => !!settings.value.basicInfo.name)

// 头像上传
const triggerAvatarUpload = () => document.getElementById('avatar-upload-input').click()
const handleAvatarChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (ev) => chatStore.setBotAvatar(ev.target.result)
    reader.readAsDataURL(file)
  }
  e.target.value = ''
}

const arrayJoin = (arr) => (arr || []).join('；')
const arraySplit = (val) => (val || '').split(/[；;]/).map(s => s.trim()).filter(Boolean)
</script>

<template>
  <el-card class="settings-card">
    <template #header>
      <div class="card-header">
        <el-icon :size="18" style="margin-right: 6px;"><User /></el-icon>
        <span>角色设定</span>
      </div>
    </template>

    <div class="settings-body">
      <!-- 头像区 -->
      <div class="avatar-section" @click="triggerAvatarUpload">
        <el-avatar :src="settings.avatar" :size="72" class="char-avatar" />
        <div class="avatar-overlay">
          <span>更换头像</span>
        </div>
        <input id="avatar-upload-input" type="file" accept="image/*" style="display:none" @change="handleAvatarChange" />
      </div>

      <!-- 当前角色名 -->
      <div v-if="hasCharacter" class="char-name-display">
        {{ settings.basicInfo.name }}
      </div>

      <!-- 关系状态面板 -->
      <StatusPanel v-if="hasCharacter && settings.relationshipState" />

      <!-- 折叠面板 -->
      <el-collapse class="settings-collapse">

        <!-- 基本信息 -->
        <el-collapse-item name="basic">
          <template #title><span class="collapse-title">📋 基本信息</span></template>
          <div class="form-row">
            <el-form-item label="角色名称" style="flex:2">
              <el-input v-model="settings.basicInfo.name" placeholder="顾时夜" />
            </el-form-item>
            <el-form-item label="年龄" style="flex:1">
              <el-input v-model="settings.basicInfo.age" placeholder="31" />
            </el-form-item>
          </div>
          <div class="form-row">
            <el-form-item label="性别" style="flex:1">
              <el-input v-model="settings.basicInfo.gender" placeholder="男" />
            </el-form-item>
            <el-form-item label="称呼用户为" style="flex:1.5">
              <el-input v-model="settings.basicInfo.userNickname" placeholder="夫人" />
            </el-form-item>
          </div>
        </el-collapse-item>

        <!-- 性格与风格 -->
        <el-collapse-item name="personality">
          <template #title><span class="collapse-title">🎭 性格与风格</span></template>
          <el-form-item label="核心性格 (分号分隔)">
            <el-input
              :model-value="arrayJoin(settings.corePersonality)"
              @update:model-value="val => settings.corePersonality = arraySplit(val)"
              type="textarea" :autosize="{ minRows: 2, maxRows: 4 }"
              placeholder="沉稳克制；情绪内敛；偶尔吃醋..."
            />
          </el-form-item>
          <el-form-item label="语调描述">
            <el-input v-model="settings.speechStyle.tone" placeholder="温和、简短、克制" />
          </el-form-item>
          <el-form-item label="口头禅 (分号分隔)">
            <el-input
              :model-value="arrayJoin(settings.speechStyle.habits)"
              @update:model-value="val => settings.speechStyle.habits = arraySplit(val)"
              placeholder='常说"嗯"；偶尔说"好不好"'
            />
          </el-form-item>
          <el-form-item label="禁用词汇 (分号分隔)">
            <el-input
              :model-value="arrayJoin(settings.speechStyle.avoid)"
              @update:model-value="val => settings.speechStyle.avoid = arraySplit(val)"
              placeholder="哈哈；呵；粗俗表达"
            />
          </el-form-item>
        </el-collapse-item>

        <!-- 行为与背景 -->
        <el-collapse-item name="background">
          <template #title><span class="collapse-title">📖 背景设定</span></template>
          <el-form-item label="行为准则 (分号分隔)">
            <el-input
              :model-value="arrayJoin(settings.behaviorRules)"
              @update:model-value="val => settings.behaviorRules = arraySplit(val)"
              type="textarea" :autosize="{ minRows: 2, maxRows: 4 }"
            />
          </el-form-item>
          <el-form-item label="身份标签">
            <el-input v-model="settings.background.identity" placeholder="北大洲掌权者" />
          </el-form-item>
          <el-form-item label="居住地">
            <el-input v-model="settings.background.residence" placeholder="顾公馆" />
          </el-form-item>
          <el-form-item label="生平历史">
            <el-input v-model="settings.background.history" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
          </el-form-item>
        </el-collapse-item>

        <!-- 喜好 -->
        <el-collapse-item name="prefs">
          <template #title><span class="collapse-title">❤️ 喜好设定</span></template>
          <el-form-item label="喜欢 (分号分隔)">
            <el-input
              :model-value="arrayJoin(settings.preferences.likes)"
              @update:model-value="val => settings.preferences.likes = arraySplit(val)"
            />
          </el-form-item>
          <el-form-item label="讨厌 (分号分隔)">
            <el-input
              :model-value="arrayJoin(settings.preferences.dislikes)"
              @update:model-value="val => settings.preferences.dislikes = arraySplit(val)"
            />
          </el-form-item>
        </el-collapse-item>

      </el-collapse>
    </div>
  </el-card>
</template>

<style scoped>
.settings-card {
  width: 300px;
  height: 100%;
  flex-shrink: 0;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.22) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 8px 32px rgba(124, 131, 253, 0.06);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  color: #334155;
}

:deep(.el-card__header) {
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(124,131,253,0.12) 0%, rgba(167,139,250,0.12) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

:deep(.el-card__body) {
  height: calc(100% - 52px);
  padding: 0;
}

.settings-body {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  scrollbar-width: none;
}
.settings-body::-webkit-scrollbar { display: none; }

/* 头像区域 */
.avatar-section {
  position: relative;
  width: 72px;
  height: 72px;
  margin: 0 auto 10px;
  cursor: pointer;
  border-radius: 50%;
}

.char-avatar {
  width: 72px !important;
  height: 72px !important;
  border: 3px solid rgba(124, 131, 253, 0.4);
  box-shadow: 0 4px 16px rgba(124, 131, 253, 0.2);
  transition: all 0.3s ease;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0,0,0,0.45);
  color: white;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-section:hover .avatar-overlay { opacity: 1; }
.avatar-section:hover .char-avatar { transform: scale(1.03); }

/* 角色名 */
.char-name-display {
  text-align: center;
  font-size: 17px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 14px;
  letter-spacing: 0.5px;
}

/* 折叠面板 */
.settings-collapse {
  border: none;
}

:deep(.el-collapse-item__header) {
  background: transparent;
  border: none;
  font-size: 13px;
  height: 36px;
  padding: 0 4px;
  border-radius: 8px;
  transition: background 0.2s;
}
:deep(.el-collapse-item__header:hover) {
  background: rgba(124, 131, 253, 0.06);
}

:deep(.el-collapse-item__wrap) {
  background: transparent;
  border: none;
}

:deep(.el-collapse-item__content) {
  padding: 8px 4px 4px;
}

.collapse-title {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

/* 表单 */
.form-row {
  display: flex;
  gap: 10px;
}

:deep(.el-form-item) {
  margin-bottom: 10px;
}

:deep(.el-form-item__label) {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  padding-bottom: 3px;
}

:deep(.el-input__wrapper), :deep(.el-textarea__inner) {
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 10px;
  box-shadow: none !important;
  font-size: 13px;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover), :deep(.el-textarea__inner:hover) {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(124, 131, 253, 0.3);
}

:deep(.el-input__wrapper.is-focus), :deep(.el-textarea__inner:focus) {
  background: #fff;
  border-color: #7c83fd;
  box-shadow: 0 0 0 2px rgba(124, 131, 253, 0.12) !important;
}

@media (max-width: 1000px) {
  .settings-card { width: 240px; }
}

@media (max-width: 800px) {
  .settings-card {
    width: 100% !important;
    height: auto !important;
    max-height: 40%;
  }
}
</style>
