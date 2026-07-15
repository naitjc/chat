<script setup>
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, EditPen, Plus } from '@element-plus/icons-vue'
import { useChatStore } from '../store/chatStore'

const emit = defineEmits(['selected'])
const chatStore = useChatStore()

const conversations = computed(() => chatStore.conversations)

const formatUpdatedAt = (value) => {
  if (!value) return ''
  const date = new Date(value)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

const createConversation = async () => {
  const conversation = await chatStore.createConversation()
  if (conversation) emit('selected')
}

const selectConversation = async (id) => {
  await chatStore.switchConversation(id)
  emit('selected')
}

const renameConversation = async (conversation) => {
  try {
    const { value } = await ElMessageBox.prompt('输入新的会话名称', '重命名会话', {
      inputValue: conversation.title,
      inputPattern: /\S+/,
      inputErrorMessage: '会话名称不能为空',
      confirmButtonText: '保存',
      cancelButtonText: '取消',
    })
    await chatStore.renameConversation(conversation.id, value.trim())
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.message || '重命名失败')
    }
  }
}

const removeConversation = async (conversation) => {
  try {
    await ElMessageBox.confirm(
      `删除“${conversation.title}”？删除后无法恢复。`,
      '删除会话',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      },
    )
    await chatStore.deleteConversation(conversation.id)
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}
</script>

<template>
  <aside class="conversation-sidebar">
    <div class="conversation-header">
      <div class="conversation-title">会话</div>
      <el-tooltip content="新建会话" placement="right">
        <el-button
          :icon="Plus"
          circle
          class="new-conversation-button"
          :disabled="chatStore.isSending || chatStore.isConversationLoading"
          aria-label="新建会话"
          @click="createConversation"
        />
      </el-tooltip>
    </div>

    <div class="conversation-list">
      <div v-if="chatStore.isConversationLoading && !conversations.length" class="list-state">
        <span class="loading-dot"></span>
        正在加载会话
      </div>

      <div
        v-for="conversation in conversations"
        :key="conversation.id"
        class="conversation-item"
        :class="{ active: conversation.id === chatStore.activeConversationId }"
        role="button"
        :tabindex="chatStore.isSending ? -1 : 0"
        :aria-current="conversation.id === chatStore.activeConversationId ? 'true' : undefined"
        :aria-disabled="chatStore.isSending ? 'true' : undefined"
        :data-conversation-id="conversation.id"
        @click="!chatStore.isSending && selectConversation(conversation.id)"
        @keydown.enter.prevent="!chatStore.isSending && selectConversation(conversation.id)"
        @keydown.space.prevent="!chatStore.isSending && selectConversation(conversation.id)"
      >
        <div class="conversation-item-top">
          <span class="item-title">{{ conversation.title }}</span>
          <span class="item-time">{{ formatUpdatedAt(conversation.updatedAt) }}</span>
        </div>
        <div class="conversation-item-bottom">
          <span class="item-preview">
            {{ conversation.preview || conversation.characterName || '尚未开始对话' }}
          </span>
          <span class="item-actions">
            <el-button
              :icon="EditPen"
              text
              circle
              size="small"
              aria-label="重命名会话"
              @click.stop="renameConversation(conversation)"
            />
            <el-button
              :icon="Delete"
              text
              circle
              size="small"
              aria-label="删除会话"
              @click.stop="removeConversation(conversation)"
            />
          </span>
        </div>
      </div>

      <div v-if="chatStore.persistenceError" class="persistence-error">
        {{ chatStore.persistenceError }}
      </div>
    </div>
  </aside>
</template>

<style scoped>
.conversation-sidebar {
  width: 230px;
  height: 100%;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-glass);
  border-radius: 20px;
  background: var(--bg-glass-card);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: var(--shadow-md);
}

.conversation-header {
  height: 49px;
  min-height: 49px;
  padding: 8px 12px 8px 16px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid var(--border-glass);
  background: var(--bg-glass-hover);
}

.conversation-title {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 700;
}

.new-conversation-button {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  color: var(--primary);
  border-color: var(--border-glass);
  background: var(--bg-glass);
}

.conversation-list {
  width: 100%;
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  box-sizing: border-box;
}

.conversation-item {
  width: 100%;
  margin: 0 0 5px;
  padding: 10px;
  display: block;
  box-sizing: border-box;
  color: var(--text-primary);
  text-align: left;
  font: inherit;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 13px;
  background: transparent;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.conversation-item:hover {
  background: var(--bg-glass-hover);
}

.conversation-item.active {
  border-color: color-mix(in srgb, var(--primary) 32%, transparent);
  background: color-mix(in srgb, var(--primary) 11%, transparent);
}

.conversation-item[aria-disabled="true"] {
  cursor: not-allowed;
  opacity: 0.7;
}

.conversation-item-top,
.conversation-item-bottom {
  display: flex;
  align-items: center;
  min-width: 0;
}

.conversation-item-top {
  gap: 8px;
}

.conversation-item-bottom {
  min-height: 25px;
  margin-top: 4px;
}

.item-title,
.item-preview {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-title {
  flex: 1;
  font-size: 13px;
  font-weight: 650;
}

.item-time {
  flex-shrink: 0;
  color: var(--text-muted);
  font-size: 10px;
}

.item-preview {
  flex: 1;
  color: var(--text-muted);
  font-size: 11px;
}

.item-actions {
  display: flex;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.conversation-item:hover .item-actions,
.conversation-item.active .item-actions {
  opacity: 1;
}

.item-actions :deep(.el-button) {
  width: 24px;
  height: 24px;
  margin: 0;
  color: var(--text-secondary);
}

.list-state,
.persistence-error {
  margin: 18px 8px;
  color: var(--text-muted);
  font-size: 12px;
  text-align: center;
}

.persistence-error {
  padding: 8px;
  color: #dc2626;
  border-radius: 10px;
  background: rgba(220, 38, 38, 0.08);
}

.loading-dot {
  width: 7px;
  height: 7px;
  margin-right: 5px;
  display: inline-block;
  border-radius: 50%;
  background: var(--primary);
  animation: pulse 1s ease-in-out infinite alternate;
}

@keyframes pulse {
  to { opacity: 0.25; }
}

@media (max-width: 1100px) {
  .conversation-sidebar { width: 205px; }
}

@media (max-width: 800px) {
  .conversation-sidebar {
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }
}
</style>
