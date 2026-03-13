<script setup>
import { useChatStore } from '../../store/chatStore'
import { ref } from 'vue'

const props = defineProps({
  msg: {
    type: Object,
    required: true
  }
})

const chatStore = useChatStore()
const avatarInputRef = ref(null)

const triggerAvatarUpload = () => {
  avatarInputRef.value.click()
}

const handleAvatarChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e_reader) => {
      if (props.msg.displayRole === 'user') {
        chatStore.setUserAvatar(e_reader.target.result)
      } else {
        chatStore.setBotAvatar(e_reader.target.result)
      }
    }
    reader.readAsDataURL(file)
  }
  e.target.value = ''
}
</script>

<template>
  <div 
    :style="{
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      flexDirection: msg.displayRole === 'user' ? 'row-reverse' : 'row',
      alignSelf: msg.displayRole === 'user' ? 'flex-end' : 'flex-start',
      maxWidth: '85%'
    }"
    class="chat-message-item"
  >
    <!-- 头像 -->
    <el-avatar 
      :src="msg.displayRole === 'user' ? chatStore.userAvatar : chatStore.characterSettings.avatar"
      :size="44"
      class="message-avatar"
      @click="triggerAvatarUpload"
    />
    
    <!-- 隐藏的头像上传 -->
    <input type="file" ref="avatarInputRef" accept="image/*" style="display: none;" @change="handleAvatarChange">
    
    <!-- 消息内容 -->
    <div :style="{ 
      marginTop: '0',
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: msg.displayRole === 'user' ? 'flex-end' : 'flex-start' 
    }">
      <div 
        class="message-bubble"
        :class="msg.displayRole === 'user' ? 'user-bubble' : 'bot-bubble'"
      >
        <div style="line-height: 1.7; white-space: pre-wrap;">{{ msg.content }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-avatar {
  margin-top: 0;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.message-avatar:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 16px rgba(0,0,0,0.12);
}

/* Chat Bubbles */
.message-bubble {
  padding: 14px 20px;
  border-radius: 20px;
  font-size: 15px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  max-width: 100%;
  word-break: break-word;
  transition: transform 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.chat-message-item:hover .message-bubble {
  transform: translateY(-1px);
}

.user-bubble {
  background: linear-gradient(135deg, #7c83fd 0%, #9672fb 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.bot-bubble {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  color: #2c3e50;
  border-bottom-left-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.5);
}
</style>
