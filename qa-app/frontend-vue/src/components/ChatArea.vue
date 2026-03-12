<script setup>
import { ref, watch, nextTick } from 'vue'
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

watch(
  () => chatStore.conversationHistory,
  () => {
    scrollToBottom()
  },
  { deep: true }
)
</script>

<template>
  <el-card style="flex: 1; display: flex; flex-direction: column; height: 100%;">
    <!-- 聊天消息区域 -->
    <div 
      ref="chatBoxRef"
      style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px;"
      :style="chatStore.chatBackground ? { backgroundImage: `url(${chatStore.chatBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}"
    >
      <TransitionGroup name="chat-list">
        <MessageBubble 
          v-for="(msg, index) in chatStore.conversationHistory" 
          :key="index"
          :msg="msg"
        />
      </TransitionGroup>
    </div>

    <!-- 输入区域 -->
    <MessageInput />
  </el-card>
</template>

<style scoped>
:deep(.el-card) {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.15) !important;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
}

:deep(.el-card__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: transparent;
}

/* Animations */
.chat-list-enter-active,
.chat-list-leave-active {
  transition: all 0.4s ease;
}

.chat-list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.chat-list-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
