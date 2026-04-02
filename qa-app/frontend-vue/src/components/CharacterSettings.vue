<script setup>
import { computed } from 'vue'
import { useChatStore } from '../store/chatStore'
import StatusPanel from './chat/StatusPanel.vue'
import { DocumentCopy } from '@element-plus/icons-vue'

const chatStore = useChatStore()

// 判断是展示群聊中的选中角色，还是单角色模式下的角色
const settings = computed(() => {
  if (chatStore.isGroupMode) {
    return chatStore.groupCharacters.find(c => c.id === chatStore.activeGroupCharId) || chatStore.characterSettings
  }
  return chatStore.characterSettings
})

const hasCharacter = computed(() => !!settings.value?.basicInfo?.name)

// 头像上传
const triggerAvatarUpload = () => {
  if (chatStore.isGroupMode) return // 暂不支持群聊内单独改预设头像
  const input = document.getElementById('avatar-upload-input')
  if (input) input.click()
}

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

// 导出单角色设定（复制）
const copyCharacterSettings = () => {
  if (!hasCharacter.value) return
  const charData = JSON.stringify(settings.value, null, 2)
  navigator.clipboard.writeText(charData)
    .then(() => ElMessage.success('已复制角色设定 JSON 到剪贴板'))
    .catch(() => ElMessage.error('复制失败，请手动操作'))
}

const updateSetting = (keyPath, val) => {
  if (chatStore.isGroupMode) {
    // 若要支持群聊中修改设定，需添加相应 action。这里保持简单，仅双向绑定到对象本身
    // 但 Vue 响应式会直接更新该对象，因为它是从 groupCharacters 引用的。
  }
}
</script>

<template>
  <el-card class="settings-card">
    <template #header>
      <div class="card-header">
        <div style="display:flex; align-items:center;">
          <el-icon :size="18" style="margin-right: 6px;"><User /></el-icon>
          <span>{{ chatStore.isGroupMode ? '群聊成员设定' : '角色设定' }}</span>
        </div>
        
        <!-- 复制角色设定 JSON 方便分享 -->
        <el-tooltip content="复制角色配置 JSON" placement="top">
          <el-button 
            v-if="hasCharacter && !chatStore.isGroupMode" 
            circle size="small" 
            :icon="DocumentCopy" 
            @click="copyCharacterSettings"
            style="background: transparent; border: none; font-size: 16px;" 
          />
        </el-tooltip>
      </div>
    </template>

    <div class="settings-body">
      <div v-if="!hasCharacter" class="empty-hint">请选择或创建一个角色</div>
      
      <template v-else>
        <!-- 群聊成员切换面板 -->
        <div v-if="chatStore.isGroupMode && chatStore.groupCharacters.length > 1" class="group-switcher">
          <el-select 
            :model-value="chatStore.activeGroupCharId"
            @update:model-value="chatStore.setActiveGroupChar"
            size="small"
            class="group-select"
          >
            <el-option 
              v-for="c in chatStore.groupCharacters" 
              :key="c.id" 
              :value="c.id" 
              :label="c.basicInfo.name" 
            />
          </el-select>
        </div>

        <!-- 头像区 -->
        <div class="avatar-section" @click="triggerAvatarUpload" :class="{ 'no-cursor': chatStore.isGroupMode }">
          <el-avatar :src="settings.avatar" :size="72" class="char-avatar" />
          <div v-if="!chatStore.isGroupMode" class="avatar-overlay">
            <span>更换头像</span>
          </div>
          <input v-if="!chatStore.isGroupMode" id="avatar-upload-input" type="file" accept="image/*" style="display:none" @change="handleAvatarChange" />
        </div>

        <!-- 当前角色名 -->
        <div class="char-name-display">{{ settings.basicInfo.name }}</div>

        <!-- 关系状态面板 -->
        <!-- 群聊模式下传递具体的状态 -->
        <StatusPanel 
          :override-state="chatStore.isGroupMode ? chatStore.groupStates[chatStore.activeGroupCharId] : null" 
        />

        <!-- 折叠面板 -->
        <el-collapse class="settings-collapse">
          
          <!-- 基本信息 -->
          <el-collapse-item name="basic">
            <template #title><span class="collapse-title">📋 基本信息</span></template>
            <div class="form-row">
              <el-form-item label="角色名称" style="flex:2">
                <el-input v-model="settings.basicInfo.name" placeholder="顾时夜" :disabled="chatStore.isGroupMode"/>
              </el-form-item>
              <el-form-item label="年龄" style="flex:1">
                <el-input v-model="settings.basicInfo.age" placeholder="31" :disabled="chatStore.isGroupMode"/>
              </el-form-item>
            </div>
            <div class="form-row">
              <el-form-item label="性别" style="flex:1">
                <el-input v-model="settings.basicInfo.gender" placeholder="男" :disabled="chatStore.isGroupMode"/>
              </el-form-item>
              <el-form-item label="称呼用户" style="flex:1.5">
                <el-input v-model="settings.basicInfo.userNickname" placeholder="夫人" :disabled="chatStore.isGroupMode"/>
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
                :disabled="chatStore.isGroupMode"
              />
            </el-form-item>
            <el-form-item label="语调描述">
              <el-input v-model="settings.speechStyle.tone" :disabled="chatStore.isGroupMode" />
            </el-form-item>
          </el-collapse-item>

          <!-- 行为与背景 -->
          <el-collapse-item name="background">
            <template #title><span class="collapse-title">📖 背景设定</span></template>
            <el-form-item label="身份标签">
              <el-input v-model="settings.background.identity" :disabled="chatStore.isGroupMode" />
            </el-form-item>
            <el-form-item label="行为准则 (分号分隔)">
              <el-input
                :model-value="arrayJoin(settings.behaviorRules)"
                @update:model-value="val => settings.behaviorRules = arraySplit(val)"
                type="textarea" :autosize="{ minRows: 2, maxRows: 4 }"
                :disabled="chatStore.isGroupMode"
              />
            </el-form-item>
          </el-collapse-item>
          
        </el-collapse>
      </template>
    </div>
  </el-card>
</template>

<style scoped>
.settings-card {
  width: 300px;
  height: 100%;
  flex-shrink: 0;
  border-radius: 20px;
  background: var(--bg-glass-card) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-glass);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

:deep(.el-card__header) {
  padding: 12px 16px;
  background: var(--bg-glass-hover);
  border-bottom: 1px solid var(--border-glass);
}

:deep(.el-card__body) {
  height: calc(100% - 50px);
  padding: 0;
}

.settings-body {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  scrollbar-width: none;
}
.settings-body::-webkit-scrollbar { display: none; }

.empty-hint {
  text-align: center;
  margin-top: 50px;
  color: var(--text-muted);
  font-size: 14px;
}

/* 群聊人员切换 */
.group-switcher {
  margin-bottom: 16px;
  text-align: center;
}
.group-select { width: 100%; }

/* 头像区域 */
.avatar-section {
  position: relative;
  width: 72px;
  height: 72px;
  margin: 0 auto 10px;
  cursor: pointer;
  border-radius: 50%;
}
.avatar-section.no-cursor { cursor: default; }

.char-avatar {
  width: 72px !important;
  height: 72px !important;
  border: 3px solid var(--border-glass-strong);
  box-shadow: var(--shadow-sm);
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
.avatar-section:not(.no-cursor):hover .char-avatar { transform: scale(1.03); }

/* 角色名 */
.char-name-display {
  text-align: center;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 14px;
  letter-spacing: 0.5px;
}

/* 折叠面板 */
.settings-collapse { border: none; }

:deep(.el-collapse-item__header) {
  background: transparent;
  border: none;
  font-size: 13px;
  height: 36px;
  padding: 0 4px;
  border-radius: 8px;
  transition: background 0.2s;
  color: var(--text-primary);
}
:deep(.el-collapse-item__header:hover) { background: var(--bg-glass-hover); }
:deep(.el-collapse-item__wrap) { background: transparent; border: none; }
:deep(.el-collapse-item__content) { padding: 8px 4px 4px; }

.collapse-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

/* 表单 */
.form-row { display: flex; gap: 10px; }

:deep(.el-form-item) { margin-bottom: 10px; }
:deep(.el-form-item__label) {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
  padding-bottom: 3px;
}

:deep(.el-input__wrapper), :deep(.el-textarea__inner) {
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 10px;
  box-shadow: none !important;
  font-size: 13px;
  transition: all 0.3s ease;
  color: var(--text-primary);
}
:deep(.el-input__wrapper:hover), :deep(.el-textarea__inner:hover) {
  background: var(--input-bg-focus);
}
:deep(.el-input__wrapper.is-focus), :deep(.el-textarea__inner:focus) {
  background: var(--input-bg-focus);
  border-color: var(--primary);
}
:deep(.el-input.is-disabled .el-input__wrapper), :deep(.el-textarea.is-disabled .el-textarea__inner) {
  background: var(--bg-glass);
  color: var(--text-secondary);
}

@media (max-width: 1000px) { .settings-card { width: 240px; } }
@media (max-width: 800px) {
  .settings-card { width: 100% !important; height: auto !important; max-height: 40%; }
}
</style>
