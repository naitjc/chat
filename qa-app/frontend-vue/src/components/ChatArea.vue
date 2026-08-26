<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useChatStore } from '../store/chatStore'
import MessageBubble from './chat/MessageBubble.vue'
import MessageInput from './chat/MessageInput.vue'

const props = defineProps({
  isMobile: { type: Boolean, default: false },
})

const chatStore = useChatStore()
const chatBoxRef = ref(null)
const isAcceptingSuggestion = ref(false)
const isConfirmingGoal = ref(false)
const isCreatingInheritedConversation = ref(false)
const storyDetailsOpen = ref(false)

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
const chapterRecap = computed(() => {
  const summary = chatStore.activeConversation?.summary
  if (summary) return summary
  const continuity = (chatStore.apiHistory || []).find(
    (message) => message.role === 'system' && String(message.content || '').startsWith('[上一章提要]'),
  )
  return continuity?.content?.replace(/^\[上一章提要\]\s*/, '') || '本章正在进行中，结束章节时会生成回顾。'
})

const stateNoticeItems = computed(() => {
  const sc = chatStore.stateChangeNotice
  if (!sc) return []
  const parts = []
  if (sc.affectionDelta > 0) parts.push(`💖 好感度 +${sc.affectionDelta}`)
  else if (sc.affectionDelta < 0) parts.push(`💔 好感度 ${sc.affectionDelta}`)
  if (sc.moodDelta > 0) parts.push(`😊 情绪 +${sc.moodDelta}`)
  else if (sc.moodDelta < 0) parts.push(`😔 情绪 ${sc.moodDelta}`)
  return parts
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

const keepGoalActive = () => {
  chatStore.dismissGoalSuggestion()
  ElMessage.info('目标保持进行中，之后会结合新剧情再次判断')
}

const confirmGoalAchievement = async () => {
  if (!chatStore.goalSuggestion) return
  isConfirmingGoal.value = true
  try {
    await chatStore.confirmGoalAchievement()
    ElMessage.success('最终目标已标记为达成，故事仍可继续')
  } catch (error) {
    ElMessage.error(error.message || '目标状态保存失败')
  } finally {
    isConfirmingGoal.value = false
  }
}

const confirmStoryEvent = async () => {
  try {
    const { value } = await ElMessageBox.prompt(
      '只记录你明确确认的事实，例如“我们约定下周一起调查旧车站”。这条内容会作为故事记忆继承到后续章节。',
      '确认关键事件',
      {
        inputType: 'textarea',
        inputPattern: /\S+/,
        inputErrorMessage: '关键事件不能为空',
        confirmButtonText: '保存事件',
        cancelButtonText: '取消',
      },
    )
    if (await chatStore.addConfirmedStoryEvent(value)) {
      ElMessage.success('关键事件已加入故事记忆')
    }
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.message || '保存关键事件失败')
    }
  }
}

const createInheritedConversation = async () => {
  isCreatingInheritedConversation.value = true
  try {
    const result = await chatStore.createInheritedConversation()
    if (result) ElMessage.success('已开启继承对话，关系和记忆已保留')
  } catch (error) {
    ElMessage.error(error.message || '开启继承对话失败')
  } finally {
    isCreatingInheritedConversation.value = false
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
      <div v-if="stateNoticeItems.length" class="state-notice" :style="{ top: chatStore.showSearch ? '60px' : '12px'}">
        <div class="state-notice-values">
          <span v-for="item in stateNoticeItems" :key="item">{{ item }}</span>
        </div>
        <p v-if="chatStore.stateChangeNotice?.reason" class="notice-reason">
          {{ chatStore.stateChangeNotice.reason }}
        </p>
      </div>
    </Transition>

    <div
      v-if="chatStore.activeRelationship"
      class="mode-context"
      :class="chatStore.isStoryMode ? 'story' : 'free'"
    >
      <span class="mode-context-badge">
        {{ chatStore.isStoryMode ? '🎯 故事模式 Beta · 测试版' : '☁️ 自由模式' }}
      </span>
      <span v-if="chatStore.isStoryMode" class="mode-context-copy">
        最终目标：{{ chatStore.activeRelationship.goal || '尚未设置' }}
        · {{ chatStore.activeRelationship.goalStatus === 'achieved' ? '已达成' : '进行中' }}
      </span>
      <span
        class="context-usage-indicator"
        :class="chatStore.contextNoticeLevel"
        :title="`估算上下文：${chatStore.contextUsage.tokens.toLocaleString()} tokens`"
      >
        上下文 {{ chatStore.contextUsage.percent }}%
        <small>{{ chatStore.contextUsage.tokens.toLocaleString() }} tokens</small>
      </span>
    </div>

    <section v-if="chatStore.isStoryMode" class="story-status-panel" :class="{ compact: props.isMobile }">
      <div class="story-status-header">
        <div>
          <span class="story-status-kicker">故事状态</span>
          <strong>{{ chatStore.activeConversation?.title || '当前章节' }}</strong>
        </div>
        <el-button v-if="props.isMobile" size="small" text @click="storyDetailsOpen = !storyDetailsOpen">
          {{ storyDetailsOpen ? '收起' : '展开故事信息' }}
        </el-button>
      </div>
      <div v-show="!props.isMobile || storyDetailsOpen" class="story-status-body">
        <div class="story-status-actions">
          <el-button size="small" plain @click="confirmStoryEvent">确认关键事件</el-button>
        </div>
        <div class="story-status-grid">
          <div class="story-status-item">
            <span>最终目标</span>
            <strong>{{ chatStore.activeRelationship.goal || '尚未设置' }}</strong>
          </div>
          <div class="story-status-item">
            <span>章节进度</span>
            <strong>第 {{ chatStore.activeConversation?.chapterNumber || 1 }} 章 · {{ chatStore.activeRelationship.chapters?.length || 1 }} 章</strong>
          </div>
        </div>
        <div class="story-recap">
          <span>章节回顾</span>
          <p>{{ chapterRecap }}</p>
        </div>
        <div v-if="chatStore.characterSettings.memory?.relationshipMemory?.length" class="story-events">
          <span>已确认事件</span>
          <ul>
            <li v-for="event in chatStore.characterSettings.memory.relationshipMemory.slice(-3)" :key="event">{{ event }}</li>
          </ul>
        </div>
      </div>
    </section>

    <Transition name="chapter-suggestion">
      <aside v-if="chatStore.contextNoticeLevel !== 'normal'" class="context-capacity-notice" :class="chatStore.contextNoticeLevel" aria-live="polite">
        <span class="chapter-suggestion-icon">{{ chatStore.contextNoticeLevel === 'hard' ? '⛔' : '🧠' }}</span>
        <div class="chapter-suggestion-copy">
          <strong>
            {{ chatStore.contextNoticeLevel === 'hard' ? '记忆容量已接近极限' : '记忆正在变得庞大' }}
          </strong>
          <span>
            {{ chatStore.characterSettings.basicInfo?.name || '角色' }}的前情记录已使用约 {{ chatStore.contextUsage.percent }}%，可以开启一段继承对话。
          </span>
        </div>
        <div class="chapter-suggestion-actions">
          <el-button size="small" type="primary" :loading="isCreatingInheritedConversation" @click="createInheritedConversation">
            开启并继承
          </el-button>
        </div>
      </aside>
    </Transition>

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
        v-if="chatStore.goalSuggestion"
        class="chapter-suggestion-card goal-suggestion-card"
        aria-live="polite"
      >
        <span class="chapter-suggestion-icon">🎯</span>
        <div class="chapter-suggestion-copy">
          <strong>最终目标可能已经达成</strong>
          <span>{{ chatStore.goalSuggestion.reason }}</span>
          <small>剧情证据：{{ chatStore.goalSuggestion.evidence }}</small>
        </div>
        <div class="chapter-suggestion-actions">
          <el-button size="small" text @click="keepGoalActive">
            尚未达成
          </el-button>
          <el-button
            size="small"
            type="success"
            :loading="isConfirmingGoal"
            @click="confirmGoalAchievement"
          >
            确认已达成
          </el-button>
        </div>
      </aside>
      <aside
        v-else-if="chatStore.chapterSuggestion"
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

.story-status-panel {
  margin: 10px 16px 0;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, #7c3aed 20%, var(--border-glass));
  border-radius: 12px;
  background: color-mix(in srgb, #7c3aed 5%, var(--bg-glass-card));
  color: var(--text-primary);
  flex-shrink: 0;
}
.story-status-header, .story-status-grid { display: flex; justify-content: space-between; gap: 14px; }
.story-status-header { align-items: center; }
.story-status-actions { margin-top: 8px; display: flex; justify-content: flex-end; }
.story-status-header strong, .story-status-item strong { display: block; margin-top: 3px; font-size: 12px; }
.story-status-kicker, .story-status-item > span, .story-recap > span, .story-events > span { color: var(--text-muted); font-size: 10px; }
.story-status-grid { margin-top: 10px; }
.story-status-item { min-width: 0; flex: 1; }
.story-status-item strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.story-recap, .story-events { margin-top: 10px; padding-top: 9px; border-top: 1px solid var(--border-glass); }
.story-recap p { margin: 4px 0 0; color: var(--text-secondary); font-size: 11px; line-height: 1.5; }
.story-events ul { margin: 5px 0 0; padding-left: 16px; color: var(--text-secondary); font-size: 11px; line-height: 1.5; }
.context-capacity-notice { margin: 10px 12px 0; padding: 10px 12px; display: flex; align-items: center; gap: 10px; border: 1px solid color-mix(in srgb, #f59e0b 28%, var(--border-glass)); border-radius: 12px; background: color-mix(in srgb, #f59e0b 9%, var(--bg-glass)); }
.context-capacity-notice.high { border-color: color-mix(in srgb, #f97316 35%, var(--border-glass)); background: color-mix(in srgb, #f97316 10%, var(--bg-glass)); }
.context-capacity-notice.hard { border-color: color-mix(in srgb, #ef4444 40%, var(--border-glass)); background: color-mix(in srgb, #ef4444 10%, var(--bg-glass)); }

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
.context-usage-indicator {
  margin-left: auto;
  flex-shrink: 0;
  padding: 4px 8px;
  border: 1px solid color-mix(in srgb, var(--primary) 24%, var(--border-glass));
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.context-usage-indicator small { margin-left: 4px; color: var(--text-muted); font-size: 9px; }
.context-usage-indicator.soft { color: #b45309; border-color: rgba(245, 158, 11, 0.35); }
.context-usage-indicator.high { color: #c2410c; border-color: rgba(249, 115, 22, 0.4); }
.context-usage-indicator.hard { color: #b91c1c; border-color: rgba(239, 68, 68, 0.45); }

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

.goal-suggestion-card {
  background: color-mix(in srgb, #22c55e 10%, var(--bg-glass));
  border-color: color-mix(in srgb, #22c55e 30%, var(--border-glass));
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
  max-width: calc(100% - 32px);
  background: var(--bg-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-glass-strong);
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-accent);
  z-index: 10;
  box-shadow: var(--shadow-sm);
  transition: top 0.3s ease;
}

.state-notice-values {
  display: flex;
  justify-content: center;
  gap: 12px;
  white-space: nowrap;
}

.notice-reason {
  margin: 3px 0 0;
  color: var(--text-muted);
  font-weight: 400;
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
  text-align: center;
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
    padding: 14px 10px;
  }

  .message-stream {
    gap: 16px;
  }

  .context-usage-indicator small { display: none; }

  .mode-context {
    padding: 8px 10px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 4px 8px;
  }

  .mode-context-copy {
    grid-column: 1 / -1;
    white-space: normal;
    line-height: 1.4;
  }

  .context-usage-indicator { grid-column: 2; grid-row: 1; margin-left: 0; }

  .story-status-panel.compact {
    margin: 6px 8px 0;
    padding: 9px 11px;
  }

  .story-status-panel.compact .story-status-actions { justify-content: stretch; }
  .story-status-panel.compact .story-status-actions :deep(.el-button) { width: 100%; margin: 0; }
  .story-status-panel.compact .story-status-grid { flex-direction: column; gap: 7px; }
  .story-status-panel.compact .story-status-item strong { white-space: normal; }

  .search-bar { padding: 8px; }
  .search-bar :deep(.el-button) { margin-left: 6px !important; }

  .state-notice {
    left: 10px;
    right: 10px;
    max-width: none;
    max-height: min(40vh, 260px);
    padding: 9px 12px;
    transform: none;
    overflow-y: auto;
    border-radius: 12px;
  }

  .state-notice-values {
    flex-wrap: wrap;
    gap: 4px 12px;
  }

  .notice-reason {
    width: 100%;
  }

  .notice-fade-enter-from,
  .notice-fade-leave-to {
    transform: translateY(-8px);
  }

  .chapter-suggestion-card {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .chapter-suggestion-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .context-capacity-notice {
    align-items: flex-start;
    flex-wrap: wrap;
    margin: 8px 8px 0;
  }

  .context-capacity-notice .chapter-suggestion-actions {
    justify-content: stretch;
  }

  .context-capacity-notice .chapter-suggestion-actions :deep(.el-button) {
    width: 100%;
    margin: 0;
  }
}
</style>
