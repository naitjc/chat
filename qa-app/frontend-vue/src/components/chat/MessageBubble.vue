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
  if (props.msg.displayRole === 'user') {
    avatarInputRef.value.click()
  } else {
    // Alternatively, emit an event or trigger bot avatar upload. We'll handle it nicely.
    // In ChatArea it was opening two different refs.
  }
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
      :size="42"
      style="margin-top: 0; cursor: pointer; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.1);"
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
        <div style="line-height: 1.6; white-space: pre-wrap;">{{ msg.content }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Chat Bubbles */
.message-bubble {
  padding: 12px 18px;
  border-radius: 18px;
  font-size: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  max-width: 100%;
  word-break: break-word;
}

.user-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.bot-bubble {
  background: white;
  color: #333;
  border: 1px solid #eef0f3;
}
</style>
