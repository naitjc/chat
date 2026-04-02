<script setup>
import { useChatStore } from '../../store/chatStore'
import { ref, computed } from 'vue'
import { marked } from 'marked'

marked.setOptions({ breaks: true })

const props = defineProps({
  msg: { type: Object, required: true },
  index: { type: Number },
  searchQuery: { type: String, default: '' },
})
const emit = defineEmits(['toggle-bookmark'])

const chatStore = useChatStore()
const avatarInputRef = ref(null)

const isUser = computed(() => props.msg.displayRole === 'user')

// 时间戳
const formattedTime = computed(() => {
  if (!props.msg.timestamp) return ''
  const date = new Date(props.msg.timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
})

// 高亮搜索词
const highlightSearch = (text) => {
  if (!props.searchQuery) return text
  const regex = new RegExp(`(${props.searchQuery})`, 'gi')
  return text.replace(regex, '<mark class="search-highlight">$1</mark>')
}

// 渲染 Markdown（仅对 bot 消息）
const renderedContent = computed(() => {
  if (isUser.value) return null
  let text = props.msg.content || ''
  text = highlightSearch(text)
  return marked.parse(text)
})

// 用户消息纯文本高亮
const userContent = computed(() => highlightSearch(props.msg.content || ''))

const triggerAvatarUpload = () => avatarInputRef.value.click()
const handleAvatarChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (isUser.value) chatStore.setUserAvatar(ev.target.result)
      else if (chatStore.isGroupMode && props.msg.characterId) {
        // 更新群聊单个角色的头像不在本次迭代范围，只是占位
      } else chatStore.setBotAvatar(ev.target.result)
    }
    reader.readAsDataURL(file)
  }
  e.target.value = ''
}

// 根据单群聊模式获取头像和名称
const avatarSrc = computed(() => {
  if (isUser.value) return chatStore.userAvatar
  if (chatStore.isGroupMode && props.msg.characterAvatar) return props.msg.characterAvatar
  return chatStore.characterSettings.avatar
})

const charName = computed(() => {
  if (isUser.value) return '我'
  if (chatStore.isGroupMode && props.msg.characterName) return props.msg.characterName
  return chatStore.characterSettings.basicInfo.name || 'Bot'
})

</script>

<template>
  <div class="chat-message-item" :class="isUser ? 'is-user' : 'is-bot'">
    
    <!-- 头像 -->
    <div class="avatar-col">
      <el-avatar :src="avatarSrc" :size="42" class="message-avatar" @click="!isUser && !chatStore.isGroupMode && triggerAvatarUpload()"/>
      <input v-if="!isUser && !chatStore.isGroupMode" type="file" ref="avatarInputRef" accept="image/*" style="display: none;" @change="handleAvatarChange">
    </div>

    <!-- 消息区域 -->
    <div class="message-col">
      <div class="message-header" :class="isUser ? 'align-end' : 'align-start'">
        <!-- 群聊模式下显示名称 -->
        <span v-if="chatStore.isGroupMode && !isUser" class="char-name">{{ charName }}</span>
        <span class="message-time">{{ formattedTime }}</span>
        <span 
          class="bookmark-icon" 
          :class="{ active: msg.bookmarked }"
          @click="emit('toggle-bookmark')"
          title="标记书签"
        >
          {{ msg.bookmarked ? '⭐' : '☆' }}
        </span>
      </div>

      <div class="bubble-wrapper">
        <div class="message-bubble" :class="isUser ? 'user-bubble' : 'bot-bubble'">
          <!-- Bot 消息渲染 Markdown；用户消息纯文本 -->
          <div v-if="isUser" class="md-content plain" v-html="userContent"></div>
          <div v-else class="md-content" v-html="renderedContent"></div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.chat-message-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  max-width: 85%;
}

.is-user {
  flex-direction: row-reverse;
  align-self: flex-end;
}

.is-bot {
  flex-direction: row;
  align-self: flex-start;
}

.avatar-col {
  flex-shrink: 0;
  margin-top: 18px; /* 对齐气泡 */
}

.message-avatar {
  border: 2px solid var(--border-glass-strong);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}
.message-avatar:hover {
  transform: scale(1.08);
  box-shadow: var(--shadow-md);
}

.message-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
}
.align-end { flex-direction: row-reverse; }
.align-start { flex-direction: row; }

.char-name {
  font-weight: 600;
  color: var(--text-secondary);
}

.bookmark-icon {
  cursor: pointer;
  opacity: 0.3;
  transition: all 0.2s;
  font-size: 14px;
}
.bookmark-icon:hover { opacity: 0.8; transform: scale(1.2); }
.bookmark-icon.active { opacity: 1; color: #fbbf24; }
.chat-message-item:hover .bookmark-icon { opacity: 0.8; }
.chat-message-item:hover .bookmark-icon.active { opacity: 1; }

.bubble-wrapper {
  display: flex;
  flex-direction: column;
}

.message-bubble {
  padding: 12px 18px;
  border-radius: 18px;
  font-size: 15px;
  line-height: 1.7;
  box-shadow: var(--shadow-sm);
  word-break: break-word;
  transition: transform 0.2s ease;
}

.chat-message-item:hover .message-bubble {
  transform: translateY(-1px);
}

.user-bubble {
  background: var(--user-bubble-bg);
  color: var(--user-bubble-text);
  border-bottom-right-radius: 5px;
  border: 1px solid var(--border-glass-strong);
}

.bot-bubble {
  background: var(--bot-bubble-bg);
  backdrop-filter: blur(8px);
  color: var(--bot-bubble-text);
  border-bottom-left-radius: 5px;
  border: 1px solid var(--bot-bubble-border);
}

.plain { white-space: pre-wrap; }
</style>
