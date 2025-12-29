<script setup>
import { ref, nextTick, computed, watch } from 'vue'
import { sendMessageToApi } from '../api/chat'

const props = defineProps({
  characterSettings: {
    type: Object,
    required: true
  },
  chatBackground: {
    type: String,
    default: null
  }
})

const chatInput = ref('')
const conversationHistory = ref([])
const isSending = ref(false)
const chatBoxRef = ref(null)
const avatarInputRef = ref(null)
const botAvatarInputRef = ref(null)

// Avatar state
const userAvatar = ref('https://example.com/my-face.jpg')
const botAvatar = ref('https://api.dicebear.com/7.x/bottts/svg?seed=Robot')

// Model parameters
// Model parameters
const selectedMode = ref('balanced')

const modelParams = computed(() => {
  switch (selectedMode.value) {
    case 'conservative':
      return { temperature: 0.4, top_p: 0.7, top_k: 40 }
    case 'creative':
      return { temperature: 0.8, top_p: 0.9, top_k: 60 }
    case 'balanced':
    default:
      return { temperature: 0.6, top_p: 0.8, top_k: 50 }
  }
})

const triggerAvatarUpload = () => {
  avatarInputRef.value.click()
}

const handleAvatarChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e_reader) => {
      userAvatar.value = e_reader.target.result
    }
    reader.readAsDataURL(file)
  }
  e.target.value = ''
}

const triggerBotAvatarUpload = () => {
  botAvatarInputRef.value.click()
}

const handleBotAvatarChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e_reader) => {
      botAvatar.value = e_reader.target.result
    }
    reader.readAsDataURL(file)
  }
  e.target.value = ''
}

// Watch for character changes to update avatar
watch(() => props.characterSettings, (newSettings) => {
  if (newSettings.avatar) {
    botAvatar.value = newSettings.avatar
  } else {
    // Reset to default when no avatar (custom character)
    botAvatar.value = 'https://api.dicebear.com/7.x/bottts/svg?seed=Robot'
  }
}, { deep: true })

// Watch for role name changes to clear history
watch(() => props.characterSettings.roleName, () => {
  conversationHistory.value = []
  apiHistory.value = []
})

const hasText = computed(() => chatInput.value.trim().length > 0)
const canSend = computed(() => hasText.value && !isSending.value)

const scrollToBottom = async () => {
  await nextTick()
  if (chatBoxRef.value) {
    chatBoxRef.value.scrollTop = chatBoxRef.value.scrollHeight
  }
}



const addMessage = (role, content) => {
  conversationHistory.value.push({
    role: role === 'user' ? 'user' : 'assistant',
    displayRole: role,
    content: content
  })
  scrollToBottom()
}

const sendMessage = async () => {
  if (!canSend.value) return

  const question = chatInput.value.trim()

  // Add user message to UI
  addMessage('user', question)

  // Clear inputs
  chatInput.value = ''
  isSending.value = true

  const payload = {
    question: question,
    history: apiHistory.value.map(msg => ({
        role: msg.role,
        content: msg.content
    })),
    roleName: props.characterSettings.roleName,
    behavioralTraits: props.characterSettings.behavioralTraits,
    identityBackground: props.characterSettings.identityBackground,
    personalityTraits: props.characterSettings.personalityTraits,
    languageStyle: props.characterSettings.languageStyle,
    gender: props.characterSettings.gender,
    likedItems: props.characterSettings.likedItems,
    dislikedItems: props.characterSettings.dislikedItems,
    userNickname: props.characterSettings.userNickname,
    userNickname: props.characterSettings.userNickname,
    temperature: modelParams.value.temperature,
    top_p: modelParams.value.top_p,
    top_k: modelParams.value.top_k
  }

  try {
    const data = await sendMessageToApi(payload)
    const answer = data.answer

    // Always append new answer to UI history to keep it complete/connected
    addMessage('bot', answer)

    // Update API history with the backend's returned state (potentially compressed)
    // The backend now returns the full history for the *next* turn, including the msg we just sent and the answer we just got.
    if (data.history) {
      console.log('Updating API history from backend. Length:', data.history.length)
      apiHistory.value = [...data.history]
    } else {
        // Fallback if backend doesn't return history (shouldn't happen with new backend code)
        apiHistory.value.push({ role: 'assistant', content: answer })
    }

  } catch (error) {
    console.error('请求失败:', error)
    addMessage('bot', '抱歉，发生了一个错误。请稍后再试。')
  } finally {
    isSending.value = false
  }
}

// Separate state for API history to match original behavior
const apiHistory = ref([])

</script>

<template>
  <el-card style="flex: 1; display: flex; flex-direction: column; height: 100%;">
    <!-- 聊天消息区域 -->
    <div 
      ref="chatBoxRef"
      style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px;"
      :style="chatBackground ? { backgroundImage: `url(${chatBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}"
    >
      <TransitionGroup name="chat-list">
        <div 
          v-for="(msg, index) in conversationHistory" 
          :key="index"
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
            :src="msg.displayRole === 'user' ? userAvatar : botAvatar"
            :size="42"
            style="margin-top: 0; cursor: pointer; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.1);"
            @click="msg.displayRole === 'user' ? triggerAvatarUpload() : triggerBotAvatarUpload()"
          />
          
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
      </TransitionGroup>
    </div>

    <!-- 隐藏的文件上传输入 -->
    <input type="file" ref="avatarInputRef" accept="image/*" style="display: none;" @change="handleAvatarChange">
    <input type="file" ref="botAvatarInputRef" accept="image/*" style="display: none;" @change="handleBotAvatarChange">

    <!-- 输入区域 -->
    <div style="padding: 16px 20px; border-top: 1px solid #e5e7eb; display: flex; gap: 12px; align-items: center;">
      <el-popover
        placement="top"
        title="模型参数设置"
        :width="300"
        trigger="click"
      >
        <template #reference>
          <el-button :icon="'Setting'" circle title="模型设置" />
        </template>
        <div style="padding: 10px;">
          <div style="margin-bottom: 10px; font-weight: bold; color: #606266;">模式选择</div>
          <el-radio-group v-model="selectedMode" size="small" style="display: flex; flex-direction: column; align-items: flex-start;">
            <el-radio label="conservative" style="margin-bottom: 8px;">
              稳健型
              <el-tooltip content="随机性低，适合严谨任务 (Temp: 0.4, TopP: 0.7, TopK: 40)" placement="right">
                <el-icon style="margin-left: 4px; vertical-align: middle;"><InfoFilled /></el-icon>
              </el-tooltip>
            </el-radio>
            <el-radio label="balanced" style="margin-bottom: 8px;">
              均衡型
              <el-tooltip content="平衡创造力与准确性 (Temp: 0.6, TopP: 0.8, TopK: 50)" placement="right">
                <el-icon style="margin-left: 4px; vertical-align: middle;"><InfoFilled /></el-icon>
              </el-tooltip>
            </el-radio>
            <el-radio label="creative">
              跳脱型
              <el-tooltip content="随机性高，更有创造力 (Temp: 0.8, TopP: 0.9, TopK: 60)" placement="right">
                <el-icon style="margin-left: 4px; vertical-align: middle;"><InfoFilled /></el-icon>
              </el-tooltip>
            </el-radio>
          </el-radio-group>
        </div>
      </el-popover>
      <el-input
        v-model="chatInput"
        placeholder="输入消息..."
        @keyup.enter="sendMessage"
        style="flex: 1;"
      />
      <el-button 
        type="primary" 
        @click="sendMessage" 
        :disabled="!canSend"
        :loading="isSending"
      >
        发送
      </el-button>
    </div>
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
