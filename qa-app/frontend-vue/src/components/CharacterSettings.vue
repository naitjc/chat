<script setup>
import { ref, onMounted, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    default: () => ({
      roleName: '',
      behavioralTraits: '',
      identityBackground: '',
      personalityTraits: '',
      languageStyle: ''
    })
  }
});

const emit = defineEmits(['update:modelValue']);

// Local state to bind inputs, sync with props
const localSettings = ref({ ...props.modelValue });

watch(() => props.modelValue, (newValue) => {
  localSettings.value = { ...newValue };
}, { deep: true });

watch(localSettings, (newValue) => {
  emit('update:modelValue', newValue);
}, { deep: true });
</script>

<template>
  <div id="personality-container">
    <h3>角色设定</h3>
    <div class="settings-grid">
      <div class="input-group">
        <label for="role-name">角色名称:</label>
        <input type="text" id="role-name" v-model="localSettings.roleName" placeholder="例如：小鸟游六花">
      </div>

      <div class="input-group">
        <label for="behavioral-traits">行为特征</label>
        <input type="text" id="behavioral-traits" v-model="localSettings.behavioralTraits"
          placeholder="例如：右眼戴着眼罩，左手绑着绷带；携带一把作为“武器”的自动伞；运动神经差，经常摔倒；数学成绩极差（曾考2分），但文科优异。">
      </div>
      <div class="input-group full-width">
        <label for="identity-background">身份背景:</label>
        <input type="text" id="identity-background" v-model="localSettings.identityBackground"
          placeholder="例如：男主角富樫勇太的同班同学兼女友；自称“邪王真眼”的使者；曾组建社团“远东魔法午睡结社之夏”。">
      </div>
      <div class="input-group full-width">
        <label for="personality-traits">性格特征:</label>
        <input type="text" id="personality-traits" v-model="localSettings.personalityTraits"
          placeholder="例如：内向怕生，有很强的妄想症；对依赖的人（勇太）非常黏人；生活自理能力差，不会做饭；本质上是个单纯、不谙世事的女孩。">
      </div>
      <div class="input-group full-width">
        <label for="language-style">语言风格:</label>
        <input type="text" id="language-style" v-model="localSettings.languageStyle"
          placeholder="例如：充满中二病的词汇和设定；句尾有时会带上“DEATH”等特色口癖（注：此口癖更常用于凸守早苗）；会使用一些帅气的“咒文”。">
      </div>
    </div>
  </div>
</template>

<style scoped>
#personality-container {
    width: 25%;
    min-width: 300px;
    /* Percentage based width */
    height: 100%;
    /* Fill parent height */
    background-color: #ffffff;
    border-radius: 20px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    padding: 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    border: 1px solid #f0f0f0;
    box-sizing: border-box;
    flex-shrink: 0;
    /* Prevent shrinking */
}

@media (max-width: 800px) {
    #personality-container {
        width: 100%;
        height: auto;
        max-height: 300px;
        flex-shrink: 1;
    }
}

#personality-container h3 {
    margin-top: 0;
    margin-bottom: 24px;
    color: #111827;
    font-size: 1.25rem;
    font-weight: 700;
    border-bottom: 2px solid #f3f4f6;
    padding-bottom: 16px;
    letter-spacing: -0.025em;
    position: sticky;
    top: 0;
    background-color: #ffffff;
    z-index: 10;
}

.settings-grid {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.input-group label {
    font-size: 0.875rem;
    color: #374151;
    font-weight: 600;
}

.input-group input {
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 0.95rem;
    transition: all 0.2s ease;
    outline: none;
    background-color: #f9fafb;
    color: #1f2937;
}

.input-group input:focus {
    border-color: #6366f1;
    background-color: #ffffff;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.input-group input::placeholder {
    color: #9ca3af;
}
</style>
