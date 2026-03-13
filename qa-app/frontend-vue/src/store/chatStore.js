import { defineStore } from 'pinia'
import { sendMessageToApi } from '../api/chat'

export const useChatStore = defineStore('chat', {
  state: () => ({
    // Current avatar for user
    userAvatar: '/avatars/用户默认头像.png',
    
    // Role settings
    characterSettings: {
      basicInfo: {
        name: '',
        age: '',
        gender: '',
        userNickname: ''
      },
      corePersonality: [],
      speechStyle: {
        tone: '',
        habits: [],
        avoid: []
      },
      behaviorRules: [],
      background: {
        identity: '',
        residence: '',
        familyMembers: [],
        history: ''
      },
      preferences: {
        likes: [],
        dislikes: []
      },
      relationshipState: null, // 添加初始字段
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Robot'
    },
    chatBackground: null,
    
    // Conversation data
    conversationHistory: [], // Only contains local display history
    apiHistory: [],          // Contains full API history including summaries
    
    // Model Config
    modelParams: {
      temperature: 0.5,
      top_p: 0.7,
      stream: false
    },
    isSending: false
  }),
  
  actions: {
    setUserAvatar(avatar) {
      this.userAvatar = avatar
    },
    setBotAvatar(avatar) {
      this.characterSettings.avatar = avatar
    },
    setCharacter(character) {
      if (character) {
        // Deep copy character objects if they exist
        this.characterSettings = {
          basicInfo: { ...(character.basicInfo || {}) },
          corePersonality: [...(character.corePersonality || [])],
          speechStyle: { ...(character.speechStyle || { habits: [], avoid: [] }) },
          behaviorRules: [...(character.behaviorRules || [])],
          background: { ...(character.background || { familyMembers: [] }) },
          preferences: { ...(character.preferences || { likes: [], dislikes: [] }) },
          relationshipState: character.relationshipState ? { ...character.relationshipState } : null,
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
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Robot'
      }
      this.clearHistory()
    },
    updateCharacterSettings(newSettings) {
      this.characterSettings = { ...newSettings }
    },
    setChatBackground(bg) {
      this.chatBackground = bg
    },
    setModelParams(params) {
      this.modelParams = { ...this.modelParams, ...params }
    },
    clearHistory() {
      this.conversationHistory = []
      this.apiHistory = []
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

      const payload = {
        question: question,
        history: this.apiHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        // Send the entire structured settings
        characterSettings: JSON.parse(JSON.stringify(this.characterSettings)), 
        temperature: parseFloat(this.modelParams.temperature.toFixed(2)),
        top_p: parseFloat(this.modelParams.top_p.toFixed(2)),
        stream: false
      }

      try {
        const data = await sendMessageToApi(payload)
        const answer = data.answer

        // 更新关系状态 (如果后端返回了)
        if (data.relationshipState) {
          console.log('[Store] 收到新的关系状态:', data.relationshipState)
          this.characterSettings.relationshipState = data.relationshipState
        }

        // 更新长期记忆 (Memory System)
        if (data.memory) {
          console.log('[Store] 收到新的记忆片段:', data.memory)
          this.characterSettings.memory = data.memory
        }

        this.addMessage('bot', answer)

        if (data.history) {
          this.apiHistory = [...data.history]
        } else {
          this.apiHistory.push({ role: 'assistant', content: answer })
        }
      } catch (error) {
        console.error('发送消息失败:', error)
        let errMsg = '网络似乎出了点问题，请稍后再试。'
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          errMsg = '回复超时了，可能是网络较慢，请重试。'
        } else if (error.response?.status >= 500) {
          errMsg = '服务暂时出了状况，请稍等片刻再试。'
        }
        this.addMessage('bot', errMsg)
      } finally {
        this.isSending = false
      }
    }
  }
})
