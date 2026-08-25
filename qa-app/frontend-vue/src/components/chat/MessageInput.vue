<script setup>
import { ref, computed, defineAsyncComponent } from 'vue'
import { useChatStore } from '../../store/chatStore'
import { InfoFilled, Setting } from '@element-plus/icons-vue'
const EmojiPicker = defineAsyncComponent(() => import('./EmojiPicker.vue'))

const chatStore = useChatStore()
const chatInput = ref('')
const textareaRef = ref(null)
const showEmojiPicker = ref(false)

const hasText = computed(() => chatInput.value.trim().length > 0)
const canSend = computed(
  () => hasText.value &&
    !chatStore.isSending &&
    Boolean(chatStore.activeConversationId) &&
    !chatStore.isActiveChapterReadOnly,
)
const inputPlaceholder = computed(() => {
  if (!chatStore.activeConversationId) return '请先从左侧选择聊天模式…'
  if (chatStore.isActiveChapterReadOnly) return '过去章节为只读，可从这里创建分支故事'
  const name = chatStore.characterSettings.basicInfo.name
  return name ? `对${name}说点什么…` : '输入消息…'
})

const sendMessage = async () => {
  if (!canSend.value) return
  const text = chatInput.value
  chatInput.value = ''
  await chatStore.sendMessage(text)
}

const handleEnter = (event) => {
  if (event.isComposing) return
  if (!event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

// 获取底层 textarea DOM 元素
const getTextarea = () => textareaRef.value?.$el?.querySelector('textarea')

// 将表情插入到当前光标位置
const insertEmoji = (emoji) => {
  const el = getTextarea()
  if (!el) {
    chatInput.value += emoji
    return
  }
  const start = el.selectionStart ?? chatInput.value.length
  const end = el.selectionEnd ?? chatInput.value.length
  chatInput.value =
    chatInput.value.slice(0, start) + emoji + chatInput.value.slice(end)
  // 下一帧恢复光标到插入点之后
  requestAnimationFrame(() => {
    el.focus()
    const pos = start + [...emoji].length
    el.setSelectionRange(pos, pos)
  })
}
</script>

<template>
  <div class="message-input-container">
    <div class="input-tools" aria-label="输入工具">

    <!-- 表情选择器 -->
    <el-popover
      v-model:visible="showEmojiPicker"
      placement="top-start"
      :show-arrow="false"
      :offset="8"
      trigger="click"
      popper-class="emoji-popover"
      width="auto"
    >
      <template #reference>
        <el-button class="emoji-btn-trigger" title="表情">😊</el-button>
      </template>
      <EmojiPicker @select="insertEmoji" />
    </el-popover>

    <el-popover
      placement="top"
      title="模型参数调节"
      :width="300"
      trigger="click"
      popper-class="parameter-popover"
    >
      <template #reference>
        <el-button :icon="Setting" circle class="settings-btn" aria-label="模型参数" />
      </template>
      <div style="padding: 10px;">
        <!-- Temperature Slider -->
        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-weight: bold; color: #606266;">
              Temperature (温度)
              <el-tooltip content="控制回复的随机性 [0.00, 1.00]。值越高越有创造力，越低越稳定严谨。" placement="top">
                <el-icon style="margin-left: 4px; vertical-align: middle;"><InfoFilled /></el-icon>
              </el-tooltip>
            </span>
            <span style="color: #409EFF; font-family: monospace;">{{ chatStore.modelParams.temperature.toFixed(2) }}</span>
          </div>
          <el-slider
            v-model="chatStore.modelParams.temperature"
            :min="0"
            :max="1"
            :step="0.01"
            :show-tooltip="false"
          />
        </div>

        <!-- Top-P Slider -->
        <div style="margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-weight: bold; color: #606266;">
              Top-P (核采样)
              <el-tooltip content="另一种控制随机性的方式 [0.01, 1.00]。通常建议保持在 0.7-0.9 之间。" placement="top">
                <el-icon style="margin-left: 4px; vertical-align: middle;"><InfoFilled /></el-icon>
              </el-tooltip>
            </span>
            <span style="color: #409EFF; font-family: monospace;">{{ chatStore.modelParams.top_p.toFixed(2) }}</span>
          </div>
          <el-slider
            v-model="chatStore.modelParams.top_p"
            :min="0.01"
            :max="1"
            :step="0.01"
            :show-tooltip="false"
          />
        </div>
      </div>
    </el-popover>
    </div>

    <div class="input-wrapper">
      <el-input
        ref="textareaRef"
        v-model="chatInput"
        type="textarea"
        :autosize="{ minRows: 1, maxRows: 5 }"
        :placeholder="inputPlaceholder"
        aria-label="聊天消息"
        @keydown.enter="handleEnter"
        class="custom-textarea"
        :disabled="chatStore.isSending || !chatStore.activeConversationId || chatStore.isActiveChapterReadOnly"
      />
    </div>

    <el-button
      type="primary"
      @click="sendMessage"
      :disabled="!canSend"
      :loading="chatStore.isSending"
      class="send-btn"
    >
      发送
    </el-button>
  </div>
</template>

<style scoped>
.message-input-container {
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  gap: 16px;
  align-items: flex-end;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.input-wrapper {
  flex: 1;
  min-width: 0;
}

.input-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

:deep(.custom-textarea .el-textarea__inner) {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
  padding: 10px 14px;
  font-size: 15px;
  line-height: 1.5;
  transition: all 0.3s ease;
  resize: none;
}

:deep(.custom-textarea .el-textarea__inner:focus) {
  background: white;
  border-color: #409effb3;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.send-btn {
  height: 40px;
  padding: 0 24px;
  border-radius: 20px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 10px rgba(64, 158, 255, 0.2);
}

.send-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(64, 158, 255, 0.3);
}

.settings-btn {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.6) !important;
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
  transition: all 0.3s ease;
}

.settings-btn:hover {
  background: white !important;
  transform: rotate(45deg);
}

.emoji-btn-trigger {
  width: 40px !important;
  height: 40px !important;
  border-radius: 10px !important;
  background: rgba(255, 255, 255, 0.6) !important;
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
  font-size: 18px;
  padding: 0 !important;
  transition: all 0.25s ease;
  flex-shrink: 0;
}

.emoji-btn-trigger:hover {
  background: white !important;
  transform: scale(1.08);
}

@media (max-width: 800px) {
  .message-input-container {
    padding: 8px 10px max(8px, env(safe-area-inset-bottom));
    gap: 8px;
    display: flex;
    align-items: flex-end;
  }

  .input-tools {
    flex-shrink: 0;
  }

  .settings-btn {
    display: none;
  }

  .send-btn {
    height: 42px;
    min-width: 64px;
    padding: 0 14px;
  }

  .emoji-btn-trigger {
    width: 42px !important;
    height: 42px !important;
  }

  :deep(.custom-textarea .el-textarea__inner) {
    min-height: 42px !important;
    padding: 10px 12px;
    font-size: 14px;
  }
}
</style>

<style>
/* Popover 本身无背景，由 EmojiPicker 组件自己绘制 */
.emoji-popover {
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
</style>
