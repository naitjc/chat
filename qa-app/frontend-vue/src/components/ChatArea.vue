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

watch(() => chatStore.conversationHistory, () => { scrollToBottom() }, { deep: true })
watch(() => chatStore.isSending, () => { scrollToBottom() })
</script>

<template>
  <el-card class="chat-main-card">
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

      <!-- 对方正在输入... 动态气泡 -->
      <Transition name="typing-fade">
        <div 
          v-if="chatStore.isSending && chatStore.characterSettings.basicInfo.name"
          class="typing-indicator-wrapper"
        >
          <el-avatar 
            :src="chatStore.characterSettings.avatar"
            :size="44"
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
  background: rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

:deep(.el-card__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: transparent;
}

.chat-messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.1) transparent;
}

/* 对方正在输入 */
.typing-indicator-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  align-self: flex-start;
}

.typing-avatar {
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.typing-bubble {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  border-bottom-left-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  min-width: 62px;
}

.typing-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #9ca3af;
  animation: typing-bounce 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(1) { animation-delay: 0s; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* 打字气泡出现/消失动画 */
.typing-fade-enter-active, .typing-fade-leave-active {
  transition: all 0.3s ease;
}
.typing-fade-enter-from, .typing-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 消息列表动画 */
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

