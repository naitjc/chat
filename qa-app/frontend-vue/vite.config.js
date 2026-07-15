import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue', 'pinia'],
          element: ['element-plus', '@element-plus/icons-vue'],
          markdown: ['marked', 'dompurify'],
        },
      },
    },
  },
})
