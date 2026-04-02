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

// 自动滚动到底部：历史变化或正在发送时
watch(() => chatStore.conversationHistory, () => {
  if (!chatStore.showSearch) scrollToBottom() // 搜索模式下尽量不自动滚动以免干扰
}, { deep: true })
watch(() => chatStore.isSending, () => { scrollToBottom() })

// 返回搜索词高亮过滤后的消息列表
const displayMessages = computed(() => chatStore.filteredHistory)

// 状态变化提示文本 (仅单角色模式下显得合适, 或未来拆分群聊状态)
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

const onSearchInput = (e) => {
  chatStore.setSearch(e.target.value)
}

const toggleBookmark = (msgIndex) => {
  chatStore.toggleBookmark(msgIndex)
}
</script>

<template>
  <el-card class="chat-main-card">

    <!-- 搜索功能栏 -->
    <Transition name="search-fade">
      <div v-if="chatStore.showSearch" class="search-bar">
        <el-input
          :model-value="chatStore.searchQuery"
          @input="chatStore.setSearch"
          placeholder="搜索聊天记录..."
          prefix-icon="Search"
          clearable
        />
        <el-button @click="chatStore.toggleSearch" plain style="margin-left: 10px;">取消</el-button>
      </div>
    </Transition>

    <!-- 状态变化浮动提示 -->
    <Transition name="notice-fade">
      <div v-if="stateNoticeText" class="state-notice" :style="{ top: chatStore.showSearch ? '60px' : '12px'}">
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
        <template v-for="(msg, index) in displayMessages" :key="msg.timestamp + index">
          <MessageBubble
            v-if="!msg.streaming || msg.content"
            :msg="msg"
            :index="index"
            :search-query="chatStore.searchQuery"
            @toggle-bookmark="toggleBookmark(index)"
          />
        </template>
      </TransitionGroup>

      <!-- 对方正在输入（单角色模式） -->
      <Transition name="typing-fade">
        <div
          v-if="chatStore.isSending && !chatStore.isGroupMode && chatStore.characterSettings.basicInfo.name && !chatStore.streamingContent"
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
  background: var(--bg-glass-card) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-glass);
  box-shadow: var(--shadow-md);
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

/* 搜索栏 */
.search-bar {
  padding: 10px 20px;
  background: var(--bg-glass);
  border-bottom: 1px solid var(--border-glass);
  display: flex;
  align-items: center;
  z-index: 5;
}

.search-fade-enter-active, .search-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.search-fade-enter-from, .search-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 状态变化提示 */
.state-notice {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-glass-strong);
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-accent);
  white-space: nowrap;
  z-index: 10;
  box-shadow: var(--shadow-sm);
  transition: top 0.3s ease;
}

.notice-reason {
  color: var(--text-muted);
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
  gap: 20px;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) transparent;
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
  border: 2px solid var(--border-glass-strong);
  box-shadow: var(--shadow-sm);
}

.typing-bubble {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 12px 18px;
  background: var(--bot-bubble-bg);
  backdrop-filter: blur(8px);
  border-radius: 18px;
  border-bottom-left-radius: 5px;
  border: 1px solid var(--bot-bubble-border);
  box-shadow: var(--shadow-sm);
}

.typing-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-muted);
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
