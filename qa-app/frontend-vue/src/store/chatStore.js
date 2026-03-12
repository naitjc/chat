import { defineStore } from 'pinia'
import { sendMessageToApi } from '../api/chat'

export const useChatStore = defineStore('chat', {
  state: () => ({
    // Current avatar for user
    userAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=User',
    
    // Role settings
    characterSettings: {
      roleName: '',
      behavioralTraits: '',
      identityBackground: '',
      personalityTraits: '',
      languageStyle: '',
      gender: '',
      likedItems: '',
      dislikedItems: '',
      userNickname: '',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Robot'
    },
    chatBackground: null,
    
    // Conversation data
    conversationHistory: [], // Only contains local display history
    apiHistory: [],          // Contains full API history including summaries
    
    // Model Config
    modelParams: {
      temperature: 0.6,
      top_p: 0.8,
      top_k: 50
    },
    selectedMode: 'balanced', // conservative, balanced, creative
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
        this.characterSettings = {
          roleName: character.roleName,
          behavioralTraits: character.behavioralTraits,
          identityBackground: character.identityBackground,
          personalityTraits: character.personalityTraits,
          languageStyle: character.languageStyle,
          gender: character.gender || '',
          likedItems: character.likedItems || '',
          dislikedItems: character.dislikedItems || '',
          userNickname: character.userNickname || '',
          avatar: character.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Robot'
        }
      } else {
        this.resetCharacter()
      }
      this.clearHistory()
    },
    resetCharacter() {
      this.characterSettings = {
        roleName: '',
        behavioralTraits: '',
        identityBackground: '',
        personalityTraits: '',
        languageStyle: '',
        gender: '',
        likedItems: '',
        dislikedItems: '',
        userNickname: '',
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
    setModelMode(mode) {
      this.selectedMode = mode
      switch (mode) {
        case 'conservative':
          this.modelParams = { temperature: 0.4, top_p: 0.7, top_k: 40 }
          break;
        case 'creative':
          this.modelParams = { temperature: 0.8, top_p: 0.9, top_k: 60 }
          break;
        case 'balanced':
        default:
          this.modelParams = { temperature: 0.6, top_p: 0.8, top_k: 50 }
          break;
      }
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
        roleName: this.characterSettings.roleName,
        behavioralTraits: this.characterSettings.behavioralTraits,
        identityBackground: this.characterSettings.identityBackground,
        personalityTraits: this.characterSettings.personalityTraits,
        languageStyle: this.characterSettings.languageStyle,
        gender: this.characterSettings.gender,
        likedItems: this.characterSettings.likedItems,
        dislikedItems: this.characterSettings.dislikedItems,
        userNickname: this.characterSettings.userNickname,
        temperature: this.modelParams.temperature,
        top_p: this.modelParams.top_p,
        top_k: this.modelParams.top_k
      }

      try {
        const data = await sendMessageToApi(payload)
        const answer = data.answer

        this.addMessage('bot', answer)

        if (data.history) {
          this.apiHistory = [...data.history]
        } else {
          // Fallback if no history returned
          this.apiHistory.push({ role: 'assistant', content: answer })
        }
      } catch (error) {
        console.error('Failed to send message:', error)
        this.addMessage('bot', '抱歉，发生了一个错误。请稍后再试。')
      } finally {
        this.isSending = false
      }
    }
  }
})
