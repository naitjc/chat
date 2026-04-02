<script setup>
import { useChatStore } from '../../store/chatStore'
import { ref, computed } from 'vue'
import { marked } from 'marked'

// 配置 marked 去除外层 <p> 包裹的选项
marked.setOptions({ breaks: true })

const props = defineProps({
  msg: {
    type: Object,
    required: true
  }
})

const chatStore = useChatStore()
const avatarInputRef = ref(null)

const isUser = computed(() => props.msg.displayRole === 'user')

// 渲染 Markdown（仅对 bot 消息）
const renderedContent = computed(() => {
  if (isUser.value) return null
  return marked.parse(props.msg.content || '')
})

const triggerAvatarUpload = () => avatarInputRef.value.click()

const handleAvatarChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      isUser.value
        ? chatStore.setUserAvatar(ev.target.result)
        : chatStore.setBotAvatar(ev.target.result)
    }
    reader.readAsDataURL(file)
  }
  e.target.value = ''
}
</script>

<template>
  <div
    class="chat-message-item"
    :class="isUser ? 'is-user' : 'is-bot'"
  >
    <!-- 头像 -->
    <el-avatar
      :src="isUser ? chatStore.userAvatar : chatStore.characterSettings.avatar"
      :size="42"
      class="message-avatar"
      @click="triggerAvatarUpload"
    />
    <input type="file" ref="avatarInputRef" accept="image/*" style="display: none;" @change="handleAvatarChange">

    <!-- 消息气泡 -->
    <div class="bubble-wrapper">
      <div
        class="message-bubble"
        :class="isUser ? 'user-bubble' : 'bot-bubble'"
      >
        <!-- Bot 消息渲染 Markdown；用户消息纯文本 -->
        <div v-if="isUser" class="md-content plain">{{ msg.content }}</div>
        <div v-else class="md-content" v-html="renderedContent"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-message-item {
  display: flex;
  gap: 10px;
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

.message-avatar {
  flex-shrink: 0;
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 3px 10px rgba(0,0,0,0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin-top: 2px;
}

.message-avatar:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 16px rgba(0,0,0,0.12);
}

.bubble-wrapper {
  display: flex;
  flex-direction: column;
}

.message-bubble {
  padding: 12px 18px;
  border-radius: 18px;
  font-size: 15px;
  line-height: 1.7;
  box-shadow: 0 3px 12px rgba(0,0,0,0.04);
  word-break: break-word;
  transition: transform 0.2s ease;
}

.chat-message-item:hover .message-bubble {
  transform: translateY(-1px);
}

.user-bubble {
  background: linear-gradient(135deg, #7c83fd 0%, #9d72fb 100%);
  color: white;
  border-bottom-right-radius: 5px;
  border: 1px solid rgba(255,255,255,0.15);
}

.bot-bubble {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(8px);
  color: #1e293b;
  border-bottom-left-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.plain {
  white-space: pre-wrap;
}
</style>
