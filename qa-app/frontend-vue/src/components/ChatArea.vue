<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { useChatStore } from '../store/chatStore'
import MessageBubble from './chat/MessageBubble.vue'
import MessageInput from './chat/MessageInput.vue'

const chatStore = useChatStore()
const chatBoxRef = ref(null)

const scrollToBottom = async () => {
  await nextTick()
  if (chatBoxRef.value) {
    chatBoxRef.value.scrollTop = chatBoxRef.value.scrollHeight
  }
}

watch(() => chatStore.conversationHistory, () => { scrollToBottom() }, { deep: true })
watch(() => chatStore.isSending, () => { scrollToBottom() })

// 状态变化提示文本
const stateNoticeText = computed(() => {
  const sc = chatStore.stateChangeNotice
  if (!sc) return null
  const parts = []
  if (sc.affectionDelta > 0) parts.push(`💖 好感度 +${sc.affectionDelta}`)
  else if (sc.affectionDelta < 0) parts.push(`💔 好感度 ${sc.affectionDelta}`)
  if (sc.moodDelta > 0) parts.push(`😊 情绪 +${sc.moodDelta}`)
  else if (sc.moodDelta < 0) parts.push(`😔 情绪 ${sc.moodDelta}`)
  return parts.length ? parts.join('  ') : null
})
</script>

<template>
  <el-card class="chat-main-card">
    <!-- 状态变化浮动提示 -->
    <Transition name="notice-fade">
      <div v-if="stateNoticeText" class="state-notice">
        {{ stateNoticeText }}
        <span v-if="chatStore.stateChangeNotice?.reason" class="notice-reason">
          — {{ chatStore.stateChangeNotice.reason }}
        </span>
      </div>
    </Transition>

    <!-- 聊天消息区域 -->
    <div
      ref="chatBoxRef"
      class="chat-messages-container"
      :style="chatStore.chatBackground ? { backgroundImage: `url(${chatStore.chatBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}"
    >
      <TransitionGroup name="chat-list">
        <MessageBubble
          v-for="(msg, index) in chatStore.conversationHistory"
          :key="index"
          :msg="msg"
        />
      </TransitionGroup>

      <!-- 对方正在输入（仅在非流式模式下显示，流式模式下消息本身就在更新） -->
      <Transition name="typing-fade">
        <div
          v-if="chatStore.isSending && chatStore.characterSettings.basicInfo.name && !chatStore.streamingContent"
          class="typing-indicator-wrapper"
        >
          <el-avatar
            :src="chatStore.characterSettings.avatar"
            :size="42"
            class="typing-avatar"
          />
          <div class="typing-bubble">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 输入区域 -->
    <MessageInput />
  </el-card>
</template>

<style scoped>
.chat-main-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.22) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 8px 32px rgba(124, 131, 253, 0.06);
  overflow: hidden;
  position: relative;
}

:deep(.el-card__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: transparent;
}

/* 状态变化提示 */
.state-notice {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(124, 131, 253, 0.2);
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #4c4f8f;
  white-space: nowrap;
  z-index: 10;
  box-shadow: 0 4px 16px rgba(124, 131, 253, 0.12);
}

.notice-reason {
  color: #94a3b8;
  font-weight: 400;
  font-size: 12px;
}

.notice-fade-enter-active, .notice-fade-leave-active {
  transition: all 0.4s ease;
}
.notice-fade-enter-from, .notice-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}

/* 聊天消息区域 */
.chat-messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scrollbar-width: thin;
  scrollbar-color: rgba(124,131,253,0.2) transparent;
}

/* 对方正在输入 */
.typing-indicator-wrapper {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  align-self: flex-start;
}

.typing-avatar {
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 3px 10px rgba(0,0,0,0.08);
}

.typing-bubble {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 12px 18px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(8px);
  border-radius: 18px;
  border-bottom-left-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 3px 12px rgba(0,0,0,0.04);
}

.typing-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #9ca3af;
  animation: typing-bounce 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(1) { animation-delay: 0s; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-5px); opacity: 1; }
}

.typing-fade-enter-active, .typing-fade-leave-active {
  transition: all 0.3s ease;
}
.typing-fade-enter-from, .typing-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 消息列表动画 */
.chat-list-enter-active, .chat-list-leave-active {
  transition: all 0.35s ease;
}
.chat-list-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.chat-list-leave-to {
  opacity: 0;
}
</style>
