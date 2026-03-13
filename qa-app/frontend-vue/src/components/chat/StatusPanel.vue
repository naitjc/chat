<script setup>
import { computed } from 'vue'
import { useChatStore } from '../../store/chatStore'

const chatStore = useChatStore()
const state = computed(() => chatStore.characterSettings.relationshipState)

// 心情文本描述
const moodText = computed(() => {
  if (!state.value) return '未知'
  const m = state.value.mood
  if (m > 30) return '非常开心'
  if (m > 10) return '心情不错'
  if (m < -30) return '极度低落'
  if (m < -10) return '有些沉郁'
  return '平静'
})

// 阶段翻译
const stageMap = {
  'stranger': '素昧平生',
  'familiar': '泛泛之交',
  'close': '志同道合',
  'intimate': '亲密无间',
  'life_partner': '相濡以沫'
}

const stageText = computed(() => stageMap[state.value?.relationshipStage] || '未知')
</script>

<template>
  <div v-if="state" class="status-panel">
    <div class="status-header">
      <span class="stage-tag">{{ stageText }}</span>
      <span class="mood-tag" :class="state.mood < 0 ? 'bad' : 'good'">
        {{ moodText }}
      </span>
    </div>

    <div class="status-items">
      <div class="status-item">
        <div class="item-label">
           <span>好感度</span>
           <span class="val">{{ state.affection }}%</span>
        </div>
        <el-progress :percentage="state.affection" :show-text="false" color="#f56c6c" />
      </div>

      <div class="status-item">
        <div class="item-label">
           <span>信任度</span>
           <span class="val">{{ state.trust }}%</span>
        </div>
        <el-progress :percentage="state.trust" :show-text="false" color="#409EFF" />
      </div>

      <div class="status-item" v-if="state.jealousy > 0">
        <div class="item-label">
           <span>当前醋意</span>
           <span class="val">{{ state.jealousy }}%</span>
        </div>
        <el-progress :percentage="state.jealousy" :show-text="false" color="#909399" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-panel {
  padding: 15px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(8px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.status-header {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
}

.stage-tag {
  background: #fdf6ec;
  color: #e6a23c;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.mood-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.mood-tag.good { background: #f0f9eb; color: #67c23a; }
.mood-tag.bad { background: #fef0f0; color: #f56c6c; }

.status-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

.val {
  font-family: monospace;
  font-weight: bold;
}

:deep(.el-progress-bar__outer) {
  background: rgba(0,0,0,0.05) !important;
}
</style>
