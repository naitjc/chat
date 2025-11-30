<script setup>
import { ref, nextTick, computed } from 'vue';

const props = defineProps({
  characterSettings: {
    type: Object,
    required: true
  },
  chatBackground: {
    type: String,
    default: null
  }
});

const chatInput = ref('');
const conversationHistory = ref([]);
const currentImageBase64 = ref(null);
const isSending = ref(false);
const chatBoxRef = ref(null);
const imageInputRef = ref(null);
const avatarInputRef = ref(null);
const botAvatarInputRef = ref(null);

// Avatar state
const userAvatar = ref('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix');
const botAvatar = ref('https://api.dicebear.com/7.x/bottts/svg?seed=Robot');

const triggerAvatarUpload = () => {
  avatarInputRef.value.click();
};

const handleAvatarChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e_reader) => {
      userAvatar.value = e_reader.target.result;
    };
    reader.readAsDataURL(file);
  }
  e.target.value = '';
};

const triggerBotAvatarUpload = () => {
  botAvatarInputRef.value.click();
};

const handleBotAvatarChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e_reader) => {
      botAvatar.value = e_reader.target.result;
    };
    reader.readAsDataURL(file);
  }
  e.target.value = '';
};

// Watch for character changes to update avatar
import { watch } from 'vue';
watch(() => props.characterSettings, (newSettings) => {
  if (newSettings.avatar) {
    botAvatar.value = newSettings.avatar;
  } else {
    // Optional: Reset to default if no avatar provided (e.g. custom character)
    // botAvatar.value = 'https://api.dicebear.com/7.x/bottts/svg?seed=Robot';
  }
}, { deep: true });

// Watch for role name changes to clear history
watch(() => props.characterSettings.roleName, () => {
  conversationHistory.value = [];
  apiHistory.value = [];
});

const hasText = computed(() => chatInput.value.trim().length > 0);
const hasImage = computed(() => currentImageBase64.value !== null);
const canSend = computed(() => (hasText.value || hasImage.value) && !isSending.value);

const triggerImageUpload = () => {
  imageInputRef.value.click();
};

const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e_reader) => {
      currentImageBase64.value = e_reader.target.result;
    };
    reader.readAsDataURL(file);
  }
  // Reset input so same file can be selected again if needed
  e.target.value = '';
};

const clearImage = () => {
  currentImageBase64.value = null;
};

const scrollToBottom = async () => {
  await nextTick();
  if (chatBoxRef.value) {
    chatBoxRef.value.scrollTop = chatBoxRef.value.scrollHeight;
  }
};

const addMessage = (role, content, image = null) => {
  conversationHistory.value.push({
    role: role === 'user' ? 'user' : 'assistant',
    displayRole: role,
    content: content,
    image: image
  });
  scrollToBottom();
};

const sendMessage = async () => {
  if (!canSend.value) return;

  const question = chatInput.value.trim();
  const imageToSend = currentImageBase64.value;

  // Add user message to UI
  addMessage('user', question, imageToSend);

  // Clear inputs
  chatInput.value = '';
  currentImageBase64.value = null;
  isSending.value = true;

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
    languageStyle: props.characterSettings.languageStyle
  };

  try {
    const response = await fetch('http://localhost:8888/qa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP 错误！状态: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.answer;

    addMessage('bot', answer);
    
    // Update history for next turn
    apiHistory.value.push({ role: 'assistant', content: answer });

  } catch (error) {
    console.error('请求失败:', error);
    addMessage('bot', '抱歉，发生了一个错误。请稍后再试。');
  } finally {
    isSending.value = false;
  }
};

// Separate state for API history to match original behavior
const apiHistory = ref([]);

</script>

<template>
  <div id="chat-container">
    <div id="chat-box" ref="chatBoxRef" :style="chatBackground ? { backgroundImage: `url(${chatBackground})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' } : {}">
      <div v-for="(msg, index) in conversationHistory" :key="index" :class="['message-row', msg.displayRole === 'user' ? 'user-row' : 'bot-row']">
        <img 
          :src="msg.displayRole === 'user' ? userAvatar : botAvatar" 
          class="avatar clickable" 
          @click="msg.displayRole === 'user' ? triggerAvatarUpload() : triggerBotAvatarUpload()"
          :title="msg.displayRole === 'user' ? '点击更换头像' : '点击更换AI头像'"
        >
        <div :class="['message', msg.displayRole === 'user' ? 'user-message' : 'bot-message']">
          <div class="content">
            <img v-if="msg.image" :src="msg.image" style="max-width: 100%; border-radius: 8px; margin-bottom: 8px;">
            <div v-if="msg.content">{{ msg.content }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Hidden avatar inputs -->
    <input type="file" ref="avatarInputRef" accept="image/*" style="display: none;" @change="handleAvatarChange">
    <input type="file" ref="botAvatarInputRef" accept="image/*" style="display: none;" @change="handleBotAvatarChange">
    
    <div id="image-preview-container" v-if="currentImageBase64" style="display: flex;">
      <img id="image-preview" :src="currentImageBase64" alt="Image Preview">
      <button id="clear-image" @click="clearImage">×</button>
    </div>

    <div id="input-area">
      <input type="file" ref="imageInputRef" accept="image/*" style="display: none;" @change="handleImageChange">
      <button id="upload-button" title="上传图片" @click="triggerImageUpload">📎</button>
      <input type="text" id="chat-input" v-model="chatInput" placeholder="输入消息..." @keypress.enter="sendMessage">
      <button id="send-button" :disabled="!canSend" @click="sendMessage">发送</button>
    </div>
  </div>
</template>

<style scoped>
#chat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: #ffffff;
    border-radius: 20px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    border: 1px solid #f0f0f0;
    box-sizing: border-box;
    min-width: 0;
}

#chat-box {
    flex: 1;
    padding: 30px;
    overflow-y: auto;
    scrollbar-gutter: stable;
    background-color: #ffffff;
    background-image: radial-gradient(#f3f4f6 1px, transparent 1px);
    background-size: 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #e5e7eb;
    flex-shrink: 0;
    background-color: #fff;
}

.avatar.clickable {
    cursor: pointer;
    transition: transform 0.2s;
}

.avatar.clickable:hover {
    transform: scale(1.1);
    border-color: #6366f1;
}

.message-row {
    display: flex;
    gap: 12px;
    max-width: 80%;
    align-items: flex-start;
}

.user-row {
    align-self: flex-end;
    flex-direction: row-reverse;
}

.bot-row {
    align-self: flex-start;
    flex-direction: row;
}

.message {
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease-out;
}

.message .content {
    padding: 14px 20px;
    border-radius: 18px;
    font-size: 1rem;
    line-height: 1.6;
    position: relative;
    word-wrap: break-word;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    overflow: visible;
}

.user-message .content {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: white;
}

.user-message .content::after {
    content: '';
    position: absolute;
    right: -10px;
    top: 15px;
    border-width: 10px 0 10px 12px;
    border-style: solid;
    border-color: transparent transparent transparent #4f46e5;
}

.bot-message .content {
    background-color: #374151;
    color: #ffffff;
    border: 1px solid #1f2937;
}

/* Bot Tail Border */
.bot-message .content::before {
    content: '';
    position: absolute;
    left: -12px;
    top: 15px;
    border-width: 10px 12px 10px 0;
    border-style: solid;
    border-color: transparent #1f2937 transparent transparent;
    z-index: 0;
}

/* Bot Tail Fill */
.bot-message .content::after {
    content: '';
    position: absolute;
    left: -11px;
    top: 15px;
    border-width: 10px 12px 10px 0;
    border-style: solid;
    border-color: transparent #374151 transparent transparent;
    z-index: 1;
}

#input-area {
    padding: 24px;
    background-color: #ffffff;
    border-top: 1px solid #f0f0f0;
    display: flex;
    gap: 16px;
    align-items: center;
}

#chat-input {
    flex-grow: 1;
    padding: 16px;
    border: 2px solid #e5e7eb;
    border-radius: 14px;
    font-size: 1rem;
    outline: none;
    transition: all 0.2s ease;
    background-color: #f9fafb;
    color: #1f2937;
}

#chat-input:focus {
    border-color: #6366f1;
    background-color: #ffffff;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

#send-button {
    padding: 16px 28px;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: white;
    border: none;
    border-radius: 14px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

#send-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
}

#send-button:active {
    transform: translateY(0);
}

#send-button:disabled {
    background: #d1d5db;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

#upload-button {
    padding: 12px;
    background-color: #f3f4f6;
    color: #4b5563;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    cursor: pointer;
    font-size: 1.2rem;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

#upload-button:hover {
    background-color: #e5e7eb;
    color: #1f2937;
}

#image-preview-container {
    display: none;
    padding: 10px 20px 0;
    background-color: #fff;
    align-items: center;
    gap: 10px;
}

#image-preview {
    max-height: 80px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

#clear-image {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 4px;
    border-radius: 50%;
    transition: background-color 0.2s;
}

#clear-image:hover {
    background-color: #fee2e2;
}
</style>
