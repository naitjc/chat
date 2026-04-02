import { defineStore } from "pinia";
import { sendMessageStream } from "../api/chat";

export const useChatStore = defineStore("chat", {
  state: () => ({
    userAvatar: "/avatars/用户默认头像.png",

    // 单角色模式
    characterSettings: {
      basicInfo: { name: "", age: "", gender: "", userNickname: "" },
      corePersonality: [],
      speechStyle: { tone: "", habits: [], avoid: [] },
      behaviorRules: [],
      background: {
        identity: "",
        residence: "",
        familyMembers: [],
        history: "",
      },
      preferences: { likes: [], dislikes: [] },
      relationshipState: null,
      memory: null,
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Robot",
    },

    // 群聊模式
    isGroupMode: false,
    groupCharacters: [], // Array<characterConfig>
    groupStates: {}, // { [characterId]: relationshipState }
    groupApiHistories: {}, // { [characterId]: apiHistory[] }
    activeGroupCharId: null, // 当前聚焦展示的角色 ID

    chatBackground: null,
    conversationHistory: [], // 显示用（含时间戳/书签/群聊角色信息）
    apiHistory: [], // 单角色 API 历史

    modelParams: { temperature: 0.5, top_p: 0.7 },

    isSending: false,
    streamingContent: "",
    stateChangeNotice: null,

    // 书签与搜索
    bookmarkedIndices: [],
    searchQuery: "",
    showSearch: false,

    // 各角色的对话缓存（内存，关页面自动清空）
    // { [characterId]: { conversationHistory, apiHistory, relationshipState, memory } }
    characterHistories: {},

    // 当前角色的初始状态快照（用于清空对话时恢复）
    _characterDefaults: { relationshipState: null, memory: null },

    // 自定义角色（wizard 创建，localStorage 持久）
    customCharacters: JSON.parse(
      localStorage.getItem("customCharacters") || "[]",
    ),

    // 主题
    currentTheme: localStorage.getItem("theme") || "default",
  }),

  getters: {
    filteredHistory(state) {
      if (!state.searchQuery.trim()) return state.conversationHistory;
      const q = state.searchQuery.toLowerCase();
      return state.conversationHistory.filter((m) =>
        (m.content || "").toLowerCase().includes(q),
      );
    },
  },

  actions: {
    // ---- 头像 ----
    setUserAvatar(avatar) {
      this.userAvatar = avatar;
    },
    setBotAvatar(avatar) {
      this.characterSettings.avatar = avatar;
    },

    // ---- 单角色 ----
    setCharacter(character) {
      // 先把当前角色的对话记录存进内存缓存
      const currentId =
        this.characterSettings?.id || this.characterSettings?.basicInfo?.name;
      if (currentId) {
        this.characterHistories[currentId] = {
          conversationHistory: JSON.parse(
            JSON.stringify(this.conversationHistory),
          ),
          apiHistory: JSON.parse(JSON.stringify(this.apiHistory)),
          relationshipState: this.characterSettings.relationshipState
            ? { ...this.characterSettings.relationshipState }
            : null,
          memory: this.characterSettings.memory
            ? { ...this.characterSettings.memory }
            : null,
        };
      }

      if (character) {
        const newId = character.id || character.basicInfo?.name;
        const cached = newId ? this.characterHistories[newId] : null;

        // 保存角色初始状态快照（清空对话时用于恢复）
        this._characterDefaults = {
          relationshipState: character.relationshipState
            ? JSON.parse(JSON.stringify(character.relationshipState))
            : null,
          memory: character.memory
            ? JSON.parse(JSON.stringify(character.memory))
            : null,
        };

        this.characterSettings = {
          id: character.id,
          basicInfo: { ...(character.basicInfo || {}) },
          corePersonality: [...(character.corePersonality || [])],
          speechStyle: {
            ...(character.speechStyle || { habits: [], avoid: [] }),
          },
          behaviorRules: [...(character.behaviorRules || [])],
          background: { ...(character.background || { familyMembers: [] }) },
          preferences: {
            ...(character.preferences || { likes: [], dislikes: [] }),
          },
          relationshipState:
            cached?.relationshipState ??
            (character.relationshipState
              ? { ...character.relationshipState }
              : null),
          memory:
            cached?.memory ??
            (character.memory ? { ...character.memory } : null),
          avatar:
            character.avatar ||
            "https://api.dicebear.com/7.x/bottts/svg?seed=Robot",
        };

        // 恢复该角色的缓存对话，若无则清空开始新对话
        if (cached) {
          this.conversationHistory = cached.conversationHistory;
          this.apiHistory = cached.apiHistory;
          this.bookmarkedIndices = [];
          this.searchQuery = "";
          this.streamingContent = "";
        } else {
          this.clearHistory();
        }
      } else {
        this.resetCharacter();
        this.clearHistory();
      }
    },

    resetCharacter() {
      this.characterSettings = {
        basicInfo: { name: "", age: "", gender: "", userNickname: "" },
        corePersonality: [],
        speechStyle: { tone: "", habits: [], avoid: [] },
        behaviorRules: [],
        background: {
          identity: "",
          residence: "",
          familyMembers: [],
          history: "",
        },
        preferences: { likes: [], dislikes: [] },
        relationshipState: null,
        memory: null,
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Robot",
      };
      this.clearHistory();
    },

    updateCharacterSettings(s) {
      this.characterSettings = { ...s };
    },
    setChatBackground(bg) {
      this.chatBackground = bg;
    },
    setModelParams(p) {
      this.modelParams = { ...this.modelParams, ...p };
    },

    // ---- 群聊模式 ----
    toggleGroupMode() {
      this.isGroupMode = !this.isGroupMode;
      if (this.isGroupMode) {
        // 把当前单角色带入群聊
        if (
          this.characterSettings.basicInfo.name &&
          this.groupCharacters.length === 0
        ) {
          this.addGroupCharacter(this.characterSettings);
        }
      }
    },

    addGroupCharacter(character) {
      if (!character?.basicInfo?.name) return;
      const id = character.id || character.basicInfo.name;
      if (this.groupCharacters.find((c) => (c.id || c.basicInfo.name) === id))
        return;
      this.groupCharacters.push({ ...character, id });
      this.groupStates[id] = character.relationshipState
        ? { ...character.relationshipState }
        : null;
      this.groupApiHistories[id] = [];
      if (!this.activeGroupCharId) this.activeGroupCharId = id;
    },

    removeGroupCharacter(charId) {
      this.groupCharacters = this.groupCharacters.filter(
        (c) => (c.id || c.basicInfo.name) !== charId,
      );
      delete this.groupStates[charId];
      delete this.groupApiHistories[charId];
      if (this.activeGroupCharId === charId) {
        this.activeGroupCharId = this.groupCharacters[0]?.id || null;
      }
    },

    setActiveGroupChar(charId) {
      this.activeGroupCharId = charId;
    },

    // ---- 历史 ----
    clearHistory() {
      // 同时清除当前角色在内存缓存中的记录
      const currentId =
        this.characterSettings?.id || this.characterSettings?.basicInfo?.name;
      if (currentId) delete this.characterHistories[currentId];

      this.conversationHistory = [];
      this.apiHistory = [];
      this.streamingContent = "";
      this.bookmarkedIndices = [];
      this.searchQuery = "";

      // 恢复角色初始状态（清空对话同时重置情绪、好感度、记忆）
      this.characterSettings.relationshipState = this._characterDefaults
        .relationshipState
        ? JSON.parse(JSON.stringify(this._characterDefaults.relationshipState))
        : null;
      this.characterSettings.memory = this._characterDefaults.memory
        ? JSON.parse(JSON.stringify(this._characterDefaults.memory))
        : null;

      // 群聊模式下重置每个角色的状态和 API 历史
      if (this.isGroupMode) {
        this.groupCharacters.forEach((character) => {
          const charId = character.id || character.basicInfo.name;
          this.groupStates[charId] = character.relationshipState
            ? JSON.parse(JSON.stringify(character.relationshipState))
            : null;
          this.groupApiHistories[charId] = [];
        });
      }
    },

    _makeTimestamp() {
      return new Date().toISOString();
    },

    addMessage(role, content, extra = {}) {
      this.conversationHistory.push({
        role: role === "user" ? "user" : "assistant",
        displayRole: role,
        content,
        timestamp: this._makeTimestamp(),
        bookmarked: false,
        ...extra,
      });
    },

    // ---- 书签 ----
    toggleBookmark(index) {
      if (this.conversationHistory[index]) {
        this.conversationHistory[index].bookmarked =
          !this.conversationHistory[index].bookmarked;
      }
    },

    // ---- 搜索 ----
    setSearch(q) {
      this.searchQuery = q;
    },
    toggleSearch() {
      this.showSearch = !this.showSearch;
      if (!this.showSearch) this.searchQuery = "";
    },

    // ---- 主题 ----
    setTheme(theme) {
      this.currentTheme = theme;
      localStorage.setItem("theme", theme);
      document.documentElement.setAttribute("data-theme", theme);
    },

    // ---- 自定义角色 ----
    saveCustomCharacter(character) {
      const existing = this.customCharacters.findIndex(
        (c) => c.id === character.id,
      );
      if (existing >= 0) {
        this.customCharacters[existing] = character;
      } else {
        this.customCharacters.push(character);
      }
      localStorage.setItem(
        "customCharacters",
        JSON.stringify(this.customCharacters),
      );
    },

    deleteCustomCharacter(charId) {
      this.customCharacters = this.customCharacters.filter(
        (c) => c.id !== charId,
      );
      localStorage.setItem(
        "customCharacters",
        JSON.stringify(this.customCharacters),
      );
    },

    // ---- 发送消息（单角色）----
    async sendMessage(question) {
      if (!question.trim() || this.isSending) return;

      if (this.isGroupMode) {
        return this._sendGroupMessage(question);
      }

      this.addMessage("user", question);
      this.isSending = true;
      this.streamingContent = "";
      this.stateChangeNotice = null;

      const placeholderIdx = this.conversationHistory.length;
      this.conversationHistory.push({
        role: "assistant",
        displayRole: "bot",
        content: "",
        streaming: true,
        timestamp: this._makeTimestamp(),
        bookmarked: false,
      });

      const payload = {
        question,
        history: this.apiHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        characterSettings: JSON.parse(JSON.stringify(this.characterSettings)),
        temperature: parseFloat(this.modelParams.temperature.toFixed(2)),
        top_p: parseFloat(this.modelParams.top_p.toFixed(2)),
      };

      try {
        await sendMessageStream(payload, {
          onChunk: (text) => {
            this.streamingContent += text;
            this.conversationHistory[placeholderIdx] = {
              ...this.conversationHistory[placeholderIdx],
              content: this.streamingContent,
            };
          },
          onState: ({ relationshipState, stateChange }) => {
            if (relationshipState)
              this.characterSettings.relationshipState = relationshipState;
            if (stateChange) {
              this.stateChangeNotice = stateChange;
              setTimeout(() => {
                this.stateChangeNotice = null;
              }, 5000);
            }
          },
          onDone: ({ history, memory }) => {
            this.conversationHistory[placeholderIdx] = {
              ...this.conversationHistory[placeholderIdx],
              content: this.streamingContent,
              streaming: false,
            };
            if (history) this.apiHistory = history;
            if (memory) this.characterSettings.memory = memory;
          },
          onError: (msg) => {
            this.conversationHistory[placeholderIdx] = {
              ...this.conversationHistory[placeholderIdx],
              content: `出错了：${msg}`,
              streaming: false,
            };
          },
        });
      } catch (error) {
        let errMsg = "网络似乎出了点问题，请稍后再试。";
        if (error.message?.includes("timeout")) errMsg = "回复超时了，请重试。";
        this.conversationHistory[placeholderIdx] = {
          ...this.conversationHistory[placeholderIdx],
          content: errMsg,
          streaming: false,
        };
      } finally {
        this.isSending = false;
        this.streamingContent = "";
      }
    },

    // ---- 发送消息（群聊）----
    async _sendGroupMessage(question) {
      if (!this.groupCharacters.length) return;
      this.addMessage("user", question);
      this.isSending = true;

      for (const character of this.groupCharacters) {
        const charId = character.id || character.basicInfo.name;
        const charState =
          this.groupStates[charId] || character.relationshipState;
        const charSettings = {
          ...character,
          id: charId,
          relationshipState: charState,
        };

        const placeholderIdx = this.conversationHistory.length;
        this.conversationHistory.push({
          role: "assistant",
          displayRole: "bot",
          content: "",
          streaming: true,
          timestamp: this._makeTimestamp(),
          bookmarked: false,
          characterId: charId,
          characterName: character.basicInfo.name,
          characterAvatar: character.avatar,
        });

        let streamContent = "";
        const apiHist = this.groupApiHistories[charId] || [];

        try {
          await sendMessageStream(
            {
              question,
              history: apiHist.map((m) => ({
                role: m.role,
                content: m.content,
              })),
              characterSettings: JSON.parse(JSON.stringify(charSettings)),
              temperature: parseFloat(this.modelParams.temperature.toFixed(2)),
              top_p: parseFloat(this.modelParams.top_p.toFixed(2)),
            },
            {
              onChunk: (text) => {
                streamContent += text;
                this.conversationHistory[placeholderIdx] = {
                  ...this.conversationHistory[placeholderIdx],
                  content: streamContent,
                };
              },
              onState: ({ relationshipState }) => {
                if (relationshipState)
                  this.groupStates[charId] = relationshipState;
              },
              onDone: ({ history }) => {
                this.conversationHistory[placeholderIdx].streaming = false;
                if (history) this.groupApiHistories[charId] = history;
              },
              onError: (msg) => {
                this.conversationHistory[placeholderIdx] = {
                  ...this.conversationHistory[placeholderIdx],
                  content: `[${character.basicInfo.name}] 出错：${msg}`,
                  streaming: false,
                };
              },
            },
          );
        } catch (err) {
          this.conversationHistory[placeholderIdx] = {
            ...this.conversationHistory[placeholderIdx],
            content: `出错：${err.message}`,
            streaming: false,
          };
        }
      }

      this.isSending = false;
      this.streamingContent = "";
    },
  },
});
