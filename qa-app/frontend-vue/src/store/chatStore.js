import { defineStore } from 'pinia'
import { sendMessageStream } from '../api/chat'

export const useChatStore = defineStore('chat', {
  state: () => ({
    userAvatar: '/avatars/用户默认头像.png',

    characterSettings: {
      basicInfo: { name: '', age: '', gender: '', userNickname: '' },
      corePersonality: [],
      speechStyle: { tone: '', habits: [], avoid: [] },
      behaviorRules: [],
      background: { identity: '', residence: '', familyMembers: [], history: '' },
      preferences: { likes: [], dislikes: [] },
      relationshipState: null,
      memory: null,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Robot'
    },

    chatBackground: null,
    conversationHistory: [],
    apiHistory: [],

    modelParams: {
      temperature: 0.5,
      top_p: 0.7,
      stream: false
    },

    isSending: false,
    streamingContent: '',  // 实时流式内容
    stateChangeNotice: null  // 状态变化提示（如"好感度 +5"）
  }),

  actions: {
    setUserAvatar(avatar) { this.userAvatar = avatar },
    setBotAvatar(avatar) { this.characterSettings.avatar = avatar },

    setCharacter(character) {
      if (character) {
        this.characterSettings = {
          id: character.id,
          basicInfo: { ...(character.basicInfo || {}) },
          corePersonality: [...(character.corePersonality || [])],
          speechStyle: { ...(character.speechStyle || { habits: [], avoid: [] }) },
          behaviorRules: [...(character.behaviorRules || [])],
          background: { ...(character.background || { familyMembers: [] }) },
          preferences: { ...(character.preferences || { likes: [], dislikes: [] }) },
          relationshipState: character.relationshipState ? { ...character.relationshipState } : null,
          memory: character.memory ? { ...character.memory } : null,
          avatar: character.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Robot'
        }
      } else {
        this.resetCharacter()
      }
      this.clearHistory()
    },

    resetCharacter() {
      this.characterSettings = {
        basicInfo: { name: '', age: '', gender: '', userNickname: '' },
        corePersonality: [],
        speechStyle: { tone: '', habits: [], avoid: [] },
        behaviorRules: [],
        background: { identity: '', residence: '', familyMembers: [], history: '' },
        preferences: { likes: [], dislikes: [] },
        relationshipState: null,
        memory: null,
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Robot'
      }
      this.clearHistory()
    },

    updateCharacterSettings(newSettings) {
      this.characterSettings = { ...newSettings }
    },

    setChatBackground(bg) { this.chatBackground = bg },
    setModelParams(params) { this.modelParams = { ...this.modelParams, ...params } },

    clearHistory() {
      this.conversationHistory = []
      this.apiHistory = []
      this.streamingContent = ''
    },

    addMessage(role, content) {
      this.conversationHistory.push({
        role: role === 'user' ? 'user' : 'assistant',
        displayRole: role,
        content: content
      })
    },

    async sendMessage(question) {
      if (!question.trim() || this.isSending) return

      this.addMessage('user', question)
      this.isSending = true
      this.streamingContent = ''
      this.stateChangeNotice = null

      // 添加流式占位消息
      this.conversationHistory.push({
        role: 'assistant',
        displayRole: 'bot',
        content: '',
        streaming: true
      })
      const streamingIndex = this.conversationHistory.length - 1

      const payload = {
        question,
        history: this.apiHistory.map(m => ({ role: m.role, content: m.content })),
        characterSettings: JSON.parse(JSON.stringify(this.characterSettings)),
        temperature: parseFloat(this.modelParams.temperature.toFixed(2)),
        top_p: parseFloat(this.modelParams.top_p.toFixed(2))
      }

      try {
        await sendMessageStream(payload, {
          onChunk: (text) => {
            this.streamingContent += text
            this.conversationHistory[streamingIndex] = {
              ...this.conversationHistory[streamingIndex],
              content: this.streamingContent
            }
          },
          onState: ({ relationshipState, stateChange }) => {
            if (relationshipState) {
              this.characterSettings.relationshipState = relationshipState
            }
            if (stateChange) {
              this.stateChangeNotice = stateChange
              // 5 秒后自动清除提示
              setTimeout(() => { this.stateChangeNotice = null }, 5000)
            }
          },
          onDone: ({ history, memory }) => {
            // 完成：标记为非流式
            this.conversationHistory[streamingIndex] = {
              ...this.conversationHistory[streamingIndex],
              content: this.streamingContent,
              streaming: false
            }
            if (history) this.apiHistory = history
            if (memory) this.characterSettings.memory = memory
          },
          onError: (msg) => {
            this.conversationHistory[streamingIndex] = {
              ...this.conversationHistory[streamingIndex],
              content: `出错了：${msg}`,
              streaming: false
            }
          }
        })
      } catch (error) {
        console.error('发送消息失败:', error)
        let errMsg = '网络似乎出了点问题，请稍后再试。'
        if (error.message?.includes('timeout') || error.code === 'ECONNABORTED') {
          errMsg = '回复超时了，可能是网络较慢，请重试。'
        }
        this.conversationHistory[streamingIndex] = {
          ...this.conversationHistory[streamingIndex],
          content: errMsg,
          streaming: false
        }
      } finally {
        this.isSending = false
        this.streamingContent = ''
      }
    }
  }
})
