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

const selectedMode = computed({
  get: () => chatStore.selectedMode,
  set: (val) => chatStore.setModelMode(val)
})
</script>

<template>
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
      :disabled="chatStore.isSending"
    />
    <el-button 
      type="primary" 
      @click="sendMessage" 
      :disabled="!canSend"
      :loading="chatStore.isSending"
    >
      发送
    </el-button>
  </div>
</template>
