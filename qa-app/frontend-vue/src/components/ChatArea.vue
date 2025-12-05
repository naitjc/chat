<script setup>
import { ref, nextTick, computed, watch } from 'vue'

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
const currentImageBase64 = ref(null)
const isSending = ref(false)
const chatBoxRef = ref(null)
const imageInputRef = ref(null)
const avatarInputRef = ref(null)
const botAvatarInputRef = ref(null)

// Avatar state
const userAvatar = ref('https://example.com/my-face.jpg')
const botAvatar = ref('https://api.dicebear.com/7.x/bottts/svg?seed=Robot')

// Model parameters
const temperature = ref(0.7)
const top_p = ref(0.9)

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
const hasImage = computed(() => currentImageBase64.value !== null)
const canSend = computed(() => (hasText.value || hasImage.value) && !isSending.value)

const triggerImageUpload = () => {
  imageInputRef.value.click()
}

const handleImageChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e_reader) => {
      currentImageBase64.value = e_reader.target.result
    }
    reader.readAsDataURL(file)
  }
  e.target.value = ''
}

const clearImage = () => {
  currentImageBase64.value = null
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatBoxRef.value) {
    chatBoxRef.value.scrollTop = chatBoxRef.value.scrollHeight
  }
}

const addMessage = (role, content, image = null) => {
  conversationHistory.value.push({
    role: role === 'user' ? 'user' : 'assistant',
    displayRole: role,
    content: content,
    image: image
  })
  scrollToBottom()
}

const sendMessage = async () => {
  if (!canSend.value) return

  const question = chatInput.value.trim()
  const imageToSend = currentImageBase64.value

  // Add user message to UI
  addMessage('user', question, imageToSend)

  // Clear inputs
  chatInput.value = ''
  currentImageBase64.value = null
  isSending.value = true

  const payload = {
    question: question,
    image: imageToSend,
    history: conversationHistory.value.map(msg => ({
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
    likedItems: props.characterSettings.likedItems,
    dislikedItems: props.characterSettings.dislikedItems,
    userNickname: props.characterSettings.userNickname,
    temperature: temperature.value,
    top_p: top_p.value
  }

  try {
    const response = await fetch(import.meta.env.VITE_API_URL || 'http://localhost:8888/qa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`HTTP 错误！状态: ${response.status}`)
    }

    const data = await response.json()
    const answer = data.answer

    addMessage('bot', answer)
    
    // Update history for next turn
    apiHistory.value.push({ role: 'assistant', content: answer })

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
      <div 
        v-for="(msg, index) in conversationHistory" 
        :key="index"
        :style="{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
          flexDirection: msg.displayRole === 'user' ? 'row-reverse' : 'row',
          alignSelf: msg.displayRole === 'user' ? 'flex-end' : 'flex-start',
          maxWidth: '80%'
        }"
      >
        <!-- 头像 -->
        <el-avatar 
          :src="msg.displayRole === 'user' ? userAvatar : botAvatar"
          :size="40"
          style="cursor: pointer; flex-shrink: 0;"
          @click="msg.displayRole === 'user' ? triggerAvatarUpload() : triggerBotAvatarUpload()"
        />
        
        <!-- 消息内容 -->
        <div>
          <el-card 
            shadow="hover"
            :body-style="{ 
              padding: '12px 16px',
              backgroundColor: msg.displayRole === 'user' ? '#409EFF' : '#f5f5f5',
              color: msg.displayRole === 'user' ? 'white' : '#303133'
            }"
          >
            <el-image 
              v-if="msg.image" 
              :src="msg.image" 
              style="max-width: 100%; border-radius: 8px; margin-bottom: 8px;"
              fit="contain"
            />
            <div v-if="msg.content">{{ msg.content }}</div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 隐藏的文件上传输入 -->
    <input type="file" ref="avatarInputRef" accept="image/*" style="display: none;" @change="handleAvatarChange">
    <input type="file" ref="botAvatarInputRef" accept="image/*" style="display: none;" @change="handleBotAvatarChange">
    <input type="file" ref="imageInputRef" accept="image/*" style="display: none;" @change="handleImageChange">

    <!-- 图片预览 -->
    <div v-if="currentImageBase64" style="padding: 10px 20px; border-top: 1px solid #e5e7eb;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <el-image 
          :src="currentImageBase64" 
          style="max-height: 80px; border-radius: 8px;"
          fit="contain"
        />
        <el-button type="danger" :icon="'Close'" circle @click="clearImage" />
      </div>
    </div>

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
          <div style="margin-bottom: 15px;">
            <span style="display: block; margin-bottom: 5px; font-size: 14px;">Temperature ({{ temperature }})</span>
            <el-slider v-model="temperature" :min="0" :max="1" :step="0.1" show-tooltip />
          </div>
          <div>
            <span style="display: block; margin-bottom: 5px; font-size: 14px;">Top P ({{ top_p }})</span>
            <el-slider v-model="top_p" :min="0" :max="1" :step="0.1" show-tooltip />
          </div>
        </div>
      </el-popover>
      <el-button :icon="'Paperclip'" circle @click="triggerImageUpload" title="上传图片" />
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
}

:deep(.el-card__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
