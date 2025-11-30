<script setup>
import { ref } from 'vue'

const dialogVisible = ref(true)
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="提示"
    width="500"
    :show-close="true"
    align-center
  >
    <div style="text-align: center;">
      <el-image
        src="/src/assets/OIP-C.webp"
        style="width: 300px; border-radius: 8px; margin-bottom: 20px;"
        fit="contain"
      />
      <p style="font-size: 16px; color: #606266;">
        虽然只是一个聊天机器人，但是也不能做那些不好的事情噢！
      </p>
    </div>
  </el-dialog>
</template>

<style scoped>
:deep(.el-dialog) {
  border-radius: 12px;
}
</style>
