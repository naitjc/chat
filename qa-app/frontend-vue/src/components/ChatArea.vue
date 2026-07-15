<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useChatStore } from '../store/chatStore'
import MessageBubble from './chat/MessageBubble.vue'
import MessageInput from './chat/MessageInput.vue'

const chatStore = useChatStore()
const chatBoxRef = ref(null)
const isAcceptingSuggestion = ref(false)

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

const toggleBookmark = (message) => {
  const originalIndex = chatStore.conversationHistory.indexOf(message)
  if (originalIndex >= 0) chatStore.toggleBookmark(originalIndex)
}

const forkFromReadonly = async () => {
  const relationship = chatStore.activeRelationship
  if (!relationship || !chatStore.activeConversationId) return
  try {
    const { value } = await ElMessageBox.prompt(
      '分支故事会继承这里的关系、记忆与最终目标，之后独立发展。',
      '从这里创建分支故事',
      {
        inputValue: `${relationship.characterName} · 分支故事`,
        inputPattern: /\S+/,
        inputErrorMessage: '故事名称不能为空',
        confirmButtonText: '创建分支',
        cancelButtonText: '取消',
      },
    )
    await chatStore.forkFromConversation(chatStore.activeConversationId, value.trim())
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.message || '创建分支失败')
    }
  }
}

const continueCurrentChapter = () => {
  chatStore.dismissChapterSuggestion()
  ElMessage.info('继续当前章节，稍后会重新判断故事节奏')
}

const acceptChapterSuggestion = async () => {
  const suggestion = chatStore.chapterSuggestion
  if (!suggestion) return
  const nextNumber = Number(chatStore.activeConversation?.chapterNumber || 1) + 1
  try {
    const { value } = await ElMessageBox.prompt(
      `模型判断：${suggestion.reason}。确认后当前章节将归档为只读。`,
      `建议进入第 ${nextNumber} 章`,
      {
        inputValue: suggestion.title,
        inputPattern: /\S+/,
        inputErrorMessage: '章节名称不能为空',
        confirmButtonText: '确认并进入',
        cancelButtonText: '取消',
      },
    )
    isAcceptingSuggestion.value = true
    const result = await chatStore.createNextChapter({ title: value.trim() })
    if (result) ElMessage.success(`已进入“${result.conversation.title}”`)
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.message || '创建章节失败')
    }
  } finally {
    isAcceptingSuggestion.value = false
  }
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
          :prefix-icon="Search"
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

    <div
      v-if="chatStore.activeRelationship"
      class="mode-context"
      :class="chatStore.isStoryMode ? 'story' : 'free'"
    >
      <span class="mode-context-badge">
        {{ chatStore.isStoryMode ? '🎯 故事模式' : '☁️ 自由模式' }}
      </span>
      <span class="mode-context-copy">
        <template v-if="chatStore.isStoryMode">
          最终目标：{{ chatStore.activeRelationship.goal || '尚未设置' }}
        </template>
        <template v-else>没有主线和章节，想聊什么都可以</template>
      </span>
    </div>

    <div v-if="chatStore.isActiveChapterReadOnly" class="readonly-notice">
      <span>这是过去的章节，只能查看。</span>
      <el-button
        size="small"
        type="primary"
        plain
        @click="forkFromReadonly"
      >
        从这里创建分支故事
      </el-button>
    </div>

    <!-- 聊天消息区域 -->
    <div
      ref="chatBoxRef"
      class="chat-messages-container"
      :style="chatStore.chatBackground ? { backgroundImage: `url(${chatStore.chatBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}"
    >
      <div class="message-stream">
        <div v-if="!chatStore.activeConversationId" class="empty-chat-state">
          <span class="empty-chat-icon">💬</span>
          <strong>选择一种模式开始聊天</strong>
          <span>在左侧新建“自由模式”或“故事模式”存档。</span>
        </div>
        <TransitionGroup name="chat-list">
          <template v-for="(msg, index) in displayMessages" :key="msg.timestamp + index">
            <MessageBubble
              v-if="!msg.streaming || msg.content"
              :msg="msg"
              :index="index"
              :search-query="chatStore.searchQuery"
              @toggle-bookmark="toggleBookmark(msg)"
            />
          </template>
        </TransitionGroup>

        <!-- 对方正在输入 -->
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
    </div>

    <Transition name="chapter-suggestion">
      <aside
        v-if="chatStore.chapterSuggestion"
        class="chapter-suggestion-card"
        aria-live="polite"
      >
        <span class="chapter-suggestion-icon">✨</span>
        <div class="chapter-suggestion-copy">
          <strong>本章似乎告一段落</strong>
          <span>{{ chatStore.chapterSuggestion.reason }}</span>
          <small>建议下一章：{{ chatStore.chapterSuggestion.title }}</small>
        </div>
        <div class="chapter-suggestion-actions">
          <el-button size="small" text @click="continueCurrentChapter">
            继续本章
          </el-button>
          <el-button
            size="small"
            type="primary"
            :loading="isAcceptingSuggestion"
            @click="acceptChapterSuggestion"
          >
            进入下一章
          </el-button>
        </div>
      </aside>
    </Transition>

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

.mode-context,
.readonly-notice {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--border-glass);
  background: color-mix(in srgb, var(--primary) 7%, var(--bg-glass));
  z-index: 4;
}

.chapter-suggestion-card {
  margin: 10px 12px 0;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
  background: color-mix(in srgb, #8b5cf6 11%, var(--bg-glass));
  border: 1px solid color-mix(in srgb, #8b5cf6 28%, var(--border-glass));
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
}

.chapter-suggestion-icon {
  flex-shrink: 0;
  font-size: 22px;
}

.chapter-suggestion-copy {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
}

.chapter-suggestion-copy strong {
  color: var(--text-primary);
  font-size: 13px;
}

.chapter-suggestion-copy small {
  color: var(--text-accent);
}

.chapter-suggestion-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.chapter-suggestion-enter-active,
.chapter-suggestion-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.chapter-suggestion-enter-from,
.chapter-suggestion-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.mode-context.story {
  background: color-mix(in srgb, #8b5cf6 8%, var(--bg-glass));
}

.mode-context-badge {
  flex-shrink: 0;
  color: var(--text-primary);
  font-size: 11px;
  font-weight: 700;
}

.mode-context-copy {
  min-width: 0;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.readonly-notice {
  color: var(--text-secondary);
  font-size: 12px;
  background: color-mix(in srgb, #94a3b8 10%, var(--bg-glass));
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
  padding: 20px 16px;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) transparent;
}

.message-stream {
  width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.empty-chat-state {
  min-height: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  text-align: center;
}

.empty-chat-icon {
  margin-bottom: 10px;
  font-size: 30px;
}

.empty-chat-state strong {
  color: var(--text-primary);
  font-size: 15px;
}

.empty-chat-state span:last-child {
  margin-top: 5px;
  font-size: 12px;
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

@media (max-width: 800px) {
  .chat-main-card {
    border-radius: 16px;
  }

  .chat-messages-container {
    padding: 16px 12px;
  }

  .message-stream {
    gap: 16px;
  }

  .chapter-suggestion-card {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .chapter-suggestion-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
