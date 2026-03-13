<script setup>
import { ref, computed } from 'vue'
import { useChatStore } from '../../store/chatStore'
import { InfoFilled } from '@element-plus/icons-vue'

const chatStore = useChatStore()
const chatInput = ref('')

const hasText = computed(() => chatInput.value.trim().length > 0)
const canSend = computed(() => hasText.value && !chatStore.isSending)

const sendMessage = async () => {
  if (!canSend.value) return
  const text = chatInput.value
  chatInput.value = ''
  await chatStore.sendMessage(text)
}

const handleEnter = (event) => {
  if (!event.shiftKey) { // Send message on Enter, new line on Shift+Enter
    sendMessage()
  }
}
</script>

<template>
  <div class="message-input-container">
    <el-popover
      placement="top"
      title="模型参数调节"
      :width="300"
      trigger="click"
      popper-class="parameter-popover"
    >
      <template #reference>
        <el-button :icon="'Setting'" circle class="settings-btn" />
      </template>
      <div style="padding: 10px;">
        <!-- Temperature Slider -->
        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-weight: bold; color: #606266;">
              Temperature (温度)
              <el-tooltip content="控制回复的随机性 [0.00, 1.00]。值越高越有创造力，越低越稳定严谨。" placement="top">
                <el-icon style="margin-left: 4px; vertical-align: middle;"><InfoFilled /></el-icon>
              </el-tooltip>
            </span>
            <span style="color: #409EFF; font-family: monospace;">{{ chatStore.modelParams.temperature.toFixed(2) }}</span>
          </div>
          <el-slider 
            v-model="chatStore.modelParams.temperature" 
            :min="0" 
            :max="1" 
            :step="0.01"
            :show-tooltip="false"
          />
        </div>

        <!-- Top-P Slider -->
        <div style="margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-weight: bold; color: #606266;">
              Top-P (核采样)
              <el-tooltip content="另一种控制随机性的方式 [0.01, 1.00]。通常建议保持在 0.7-0.9 之间。" placement="top">
                <el-icon style="margin-left: 4px; vertical-align: middle;"><InfoFilled /></el-icon>
              </el-tooltip>
            </span>
            <span style="color: #409EFF; font-family: monospace;">{{ chatStore.modelParams.top_p.toFixed(2) }}</span>
          </div>
          <el-slider 
            v-model="chatStore.modelParams.top_p" 
            :min="0.01" 
            :max="1" 
            :step="0.01"
            :show-tooltip="false"
          />
        </div>
      </div>
    </el-popover>
    
    <div class="input-wrapper">
      <el-input
        v-model="chatInput"
        type="textarea"
        :autosize="{ minRows: 1, maxRows: 5 }"
        placeholder="输入消息..."
        @keydown.enter.prevent="handleEnter"
        class="custom-textarea"
        :disabled="chatStore.isSending"
      />
    </div>

    <el-button 
      type="primary" 
      @click="sendMessage" 
      :disabled="!canSend"
      :loading="chatStore.isSending"
      class="send-btn"
    >
      发送
    </el-button>
  </div>
</template>

<style scoped>
.message-input-container {
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  gap: 16px;
  align-items: flex-end;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.input-wrapper {
  flex: 1;
}

:deep(.custom-textarea .el-textarea__inner) {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
  padding: 10px 14px;
  font-size: 15px;
  line-height: 1.5;
  transition: all 0.3s ease;
  resize: none;
}

:deep(.custom-textarea .el-textarea__inner:focus) {
  background: white;
  border-color: #409effb3;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.send-btn {
  height: 40px;
  padding: 0 24px;
  border-radius: 20px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 10px rgba(64, 158, 255, 0.2);
}

.send-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(64, 158, 255, 0.3);
}

.settings-btn {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.6) !important;
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
  transition: all 0.3s ease;
}

.settings-btn:hover {
  background: white !important;
  transform: rotate(45deg);
}
</style>
