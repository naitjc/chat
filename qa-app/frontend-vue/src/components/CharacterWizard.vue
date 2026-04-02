<script setup>
import { ref, reactive } from 'vue'

const emit = defineEmits(['save', 'close'])

const step = ref(1)
const isGenerating = ref(false)

const form = reactive({
  basicInfo: { name: '', age: '', gender: '' },
  personalityStr: '', // 临时字符串，后续转数组
  speechStyleTone: '',
  backgroundIdentity: '',
})

const generateCharacter = () => {
  // 简易的角色设定生成逻辑 (模拟)
  // 如果在生产环境，可发请求给 LLM，将 name, personalityStr 扩写为完整的 JSON
  isGenerating.value = true
  setTimeout(() => {
    isGenerating.value = false
    const newChar = {
      id: 'custom_' + Date.now(),
      basicInfo: {
        name: form.basicInfo.name || '未知角色',
        age: form.basicInfo.age,
        gender: form.basicInfo.gender,
        userNickname: '你'
      },
      corePersonality: form.personalityStr.split(/[,，;；]/).map(s => s.trim()).filter(Boolean),
      speechStyle: {
        tone: form.speechStyleTone || '普通',
        habits: [], avoid: []
      },
      behaviorRules: ['遵循设定的性格进行回复', '保持对话的连贯性'],
      background: {
        identity: form.backgroundIdentity,
        residence: '', familyMembers: [], history: ''
      },
      preferences: { likes: [], dislikes: [] },
      relationshipState: {
        affection: 50, mood: 0,
        relationshipStage: 'stranger', distance: 'normal'
      },
      memory: { longTerm: [], relationshipMemory: [] },
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${form.basicInfo.name || 'Robot'}`
    }
    emit('save', newChar)
  }, 1000)
}
</script>

<template>
  <el-dialog
    model-value="true"
    @close="emit('close')"
    width="500px"
    class="wizard-dialog"
    destroy-on-close
  >
    <div class="wizard-container">
      <h2 class="wizard-title">✨ 创建新角色</h2>
      
      <el-steps :active="step" finish-status="success" class="wizard-steps" align-center>
        <el-step title="基础信息" />
        <el-step title="性格特征" />
        <el-step title="背景设定" />
      </el-steps>

      <div class="wizard-content">
        <!-- Step 1 -->
        <div v-show="step === 1" class="step-form">
          <el-form label-position="top">
            <el-form-item label="角色姓名">
              <el-input v-model="form.basicInfo.name" placeholder="请输入姓名"/>
            </el-form-item>
            <div style="display:flex; gap: 10px;">
              <el-form-item label="年龄" style="flex:1">
                <el-input v-model="form.basicInfo.age" placeholder="例如: 25"/>
              </el-form-item>
              <el-form-item label="性别" style="flex:1">
                <el-input v-model="form.basicInfo.gender" placeholder="例如: 男 / 女"/>
              </el-form-item>
            </div>
          </el-form>
        </div>

        <!-- Step 2 -->
        <div v-show="step === 2" class="step-form">
          <el-form label-position="top">
            <el-form-item label="核心性格 (逗号分隔)">
              <el-input 
                v-model="form.personalityStr" 
                type="textarea" :rows="3" 
                placeholder="例如: 傲娇, 毒舌, 嘴硬心软" />
            </el-form-item>
            <el-form-item label="语调描述">
              <el-input v-model="form.speechStyleTone" placeholder="例如: 冰冷但偶尔带有隐忍的温柔"/>
            </el-form-item>
          </el-form>
        </div>

        <!-- Step 3 -->
        <div v-show="step === 3" class="step-form">
          <el-form label-position="top">
            <el-form-item label="身份/职业">
              <el-input v-model="form.backgroundIdentity" placeholder="例如: 血族亲王, 总裁, 学生"/>
            </el-form-item>
            <p class="wizard-hint">
              填写这些要素后，系统将自动帮您补齐剩余的设定骨架。
            </p>
          </el-form>
        </div>
      </div>

      <div class="wizard-footer">
        <el-button v-if="step > 1" @click="step--" plain>上一步</el-button>
        <el-button v-if="step < 3" type="primary" @click="step++">下一步</el-button>
        <el-button v-if="step === 3" type="primary" :loading="isGenerating" @click="generateCharacter">
          生成角色
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<style>
.wizard-dialog .el-dialog {
  border-radius: 20px !important;
  background: var(--bg-glass) !important;
  backdrop-filter: blur(16px) !important;
  border: 1px solid var(--border-glass-strong) !important;
  padding: 0 !important;
}
.wizard-dialog .el-dialog__header { display: none; }
.wizard-dialog .el-dialog__body { padding: 0 !important; }
</style>

<style scoped>
.wizard-container {
  padding: 30px;
}
.wizard-title {
  text-align: center;
  font-size: 20px;
  color: var(--text-primary);
  margin-block-start: 0;
  margin-block-end: 20px;
}
.wizard-steps {
  margin-bottom: 30px;
}
.step-form {
  min-height: 200px;
}
.wizard-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
.wizard-hint {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  background: var(--bg-glass-card);
  padding: 10px;
  border-radius: 8px;
}

:deep(.el-form-item__label) {
  color: var(--text-secondary);
  font-weight: 600;
  padding-bottom: 4px;
}

:deep(.el-input__wrapper), :deep(.el-textarea__inner) {
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 10px;
  box-shadow: none !important;
}
:deep(.el-input__wrapper:hover), :deep(.el-textarea__inner:hover) {
  background: var(--input-bg-focus);
}
:deep(.el-input__wrapper.is-focus), :deep(.el-textarea__inner:focus) {
  background: var(--input-bg-focus);
  border-color: var(--primary);
}
</style>
