import { defineStore } from "pinia";
import {
  createConversation as createConversationApi,
  deleteConversation as deleteConversationApi,
  getConversation as getConversationApi,
  listConversations as listConversationsApi,
  renameConversation as renameConversationApi,
  sendMessageStream,
  updateConversation as updateConversationApi,
} from "../api/chat";

const cloneValue = (value) =>
  value == null ? value : JSON.parse(JSON.stringify(value));

const DEFAULT_CHARACTER = {
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

let saveTimer = null;
let saveSequence = Promise.resolve();

const withoutSnapshot = ({ snapshot, ...metadata }) => metadata;

export const useChatStore = defineStore("chat", {
  state: () => ({
    userAvatar: "/avatars/用户默认头像.png",
    characterSettings: cloneValue(DEFAULT_CHARACTER),
    chatBackground: null,
    conversationHistory: [],
    apiHistory: [],
    modelParams: { temperature: 0.5, top_p: 0.7 },

    isSending: false,
    streamingContent: "",
    stateChangeNotice: null,

    bookmarkedIndices: [],
    searchQuery: "",
    showSearch: false,

    _characterDefaults: { relationshipState: null, memory: null },

    // 服务端 SQLite 会话元数据；完整快照仅在切换时读取。
    conversations: [],
    activeConversationId: null,
    isConversationLoading: false,
    persistenceReady: false,
    persistenceError: "",
    _isHydratingConversation: false,

    customCharacters: JSON.parse(
      localStorage.getItem("customCharacters") || "[]",
    ),
    currentTheme: localStorage.getItem("theme") || "default",
  }),

  getters: {
    activeConversation(state) {
      return state.conversations.find(
        (conversation) => conversation.id === state.activeConversationId,
      );
    },
    filteredHistory(state) {
      if (!state.searchQuery.trim()) return state.conversationHistory;
      const query = state.searchQuery.toLowerCase();
      return state.conversationHistory.filter((message) =>
        (message.content || "").toLowerCase().includes(query),
      );
    },
  },

  actions: {
    _makeTimestamp() {
      return new Date().toISOString();
    },

    _buildSnapshot() {
      return {
        schemaVersion: 1,
        userAvatar: this.userAvatar,
        characterSettings: cloneValue(this.characterSettings),
        conversationHistory: cloneValue(this.conversationHistory).map(
          (message) => ({ ...message, streaming: false }),
        ),
        apiHistory: cloneValue(this.apiHistory),
        chatBackground: this.chatBackground,
        modelParams: cloneValue(this.modelParams),
        bookmarkedIndices: [...this.bookmarkedIndices],
        searchQuery: this.searchQuery,
        showSearch: this.showSearch,
        characterDefaults: cloneValue(this._characterDefaults),
      };
    },

    _getAutoTitle() {
      const firstUserMessage = this.conversationHistory.find(
        (message) => message.role === "user" && message.content?.trim(),
      );
      if (firstUserMessage) {
        const title = firstUserMessage.content.trim().replace(/\s+/g, " ");
        return title.length > 28 ? `${title.slice(0, 28)}…` : title;
      }
      const characterName = this.characterSettings.basicInfo?.name;
      return characterName ? `与${characterName}的对话` : "新对话";
    },

    _buildPersistencePayload() {
      const active = this.activeConversation;
      const lastMessage = [...this.conversationHistory]
        .reverse()
        .find((message) => message.content?.trim());
      const preview = lastMessage?.content?.trim().replace(/\s+/g, " ") || "";
      return {
        title: active?.titleCustomized ? active.title : this._getAutoTitle(),
        titleCustomized: Boolean(active?.titleCustomized),
        characterName: this.characterSettings.basicInfo?.name || "",
        preview: preview.slice(0, 100),
        snapshot: this._buildSnapshot(),
      };
    },

    _upsertConversationMetadata(conversation) {
      const metadata = withoutSnapshot(conversation);
      const index = this.conversations.findIndex(
        (item) => item.id === metadata.id,
      );
      if (index >= 0) this.conversations[index] = metadata;
      else this.conversations.push(metadata);
      this.conversations.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
      );
    },

    _resetSessionState() {
      this.userAvatar = "/avatars/用户默认头像.png";
      this.characterSettings = cloneValue(DEFAULT_CHARACTER);
      this.chatBackground = null;
      this.conversationHistory = [];
      this.apiHistory = [];
      this.modelParams = { temperature: 0.5, top_p: 0.7 };
      this.bookmarkedIndices = [];
      this.searchQuery = "";
      this.showSearch = false;
      this.streamingContent = "";
      this.stateChangeNotice = null;
      this._characterDefaults = { relationshipState: null, memory: null };
    },

    _applyCharacterTemplate(character) {
      if (!character) {
        this.characterSettings = cloneValue(DEFAULT_CHARACTER);
        this._characterDefaults = { relationshipState: null, memory: null };
        return;
      }

      this.characterSettings = {
        id: character.id,
        basicInfo: {
          ...DEFAULT_CHARACTER.basicInfo,
          ...(cloneValue(character.basicInfo) || {}),
        },
        corePersonality: cloneValue(character.corePersonality || []),
        speechStyle: {
          ...cloneValue(DEFAULT_CHARACTER.speechStyle),
          ...(cloneValue(character.speechStyle) || {}),
        },
        behaviorRules: cloneValue(character.behaviorRules || []),
        background: {
          ...cloneValue(DEFAULT_CHARACTER.background),
          ...(cloneValue(character.background) || {}),
        },
        preferences: {
          ...cloneValue(DEFAULT_CHARACTER.preferences),
          ...(cloneValue(character.preferences) || {}),
        },
        relationshipState: cloneValue(character.relationshipState),
        memory: cloneValue(character.memory),
        avatar: character.avatar || DEFAULT_CHARACTER.avatar,
      };
      this._characterDefaults = {
        relationshipState: cloneValue(character.relationshipState),
        memory: cloneValue(character.memory),
      };
    },

    _applyConversation(conversation) {
      const snapshot = conversation.snapshot || {};
      this._isHydratingConversation = true;
      this.activeConversationId = conversation.id;
      this.userAvatar =
        snapshot.userAvatar || "/avatars/用户默认头像.png";
      this.characterSettings = {
        ...cloneValue(DEFAULT_CHARACTER),
        ...(cloneValue(snapshot.characterSettings) || {}),
      };
      this.conversationHistory = cloneValue(
        snapshot.conversationHistory || [],
      );
      this.apiHistory = cloneValue(snapshot.apiHistory || []);
      this.chatBackground = snapshot.chatBackground || null;
      this.modelParams = {
        temperature: 0.5,
        top_p: 0.7,
        ...(cloneValue(snapshot.modelParams) || {}),
      };
      this.bookmarkedIndices = [...(snapshot.bookmarkedIndices || [])];
      this.searchQuery = snapshot.searchQuery || "";
      this.showSearch = Boolean(snapshot.showSearch);
      this._characterDefaults = cloneValue(snapshot.characterDefaults) || {
        relationshipState: cloneValue(
          this.characterSettings.relationshipState,
        ),
        memory: cloneValue(this.characterSettings.memory),
      };
      this.isSending = false;
      this.streamingContent = "";
      this.stateChangeNotice = null;
      this._upsertConversationMetadata(conversation);
      this._isHydratingConversation = false;
    },

    async initializeConversations() {
      if (this.persistenceReady || this.isConversationLoading) return;
      this.isConversationLoading = true;
      this.persistenceError = "";
      try {
        this.conversations = await listConversationsApi();
        if (this.conversations.length) {
          const conversation = await getConversationApi(
            this.conversations[0].id,
          );
          this._applyConversation(conversation);
        } else {
          await this.createConversation();
        }
        this.persistenceReady = true;
      } catch (error) {
        this.persistenceError = `无法加载会话：${error.message}`;
        console.error(this.persistenceError);
      } finally {
        this.isConversationLoading = false;
      }
    },

    async createConversation(character = null) {
      if (this.isSending) return null;
      if (this.activeConversationId && this.persistenceReady) {
        await this.persistActiveConversation({ force: true });
      }

      this._isHydratingConversation = true;
      this._resetSessionState();
      this._applyCharacterTemplate(character);
      this.activeConversationId = null;
      try {
        const conversation = await createConversationApi({
          title: this._getAutoTitle(),
          titleCustomized: false,
          characterName: this.characterSettings.basicInfo?.name || "",
          preview: "",
          snapshot: this._buildSnapshot(),
        });
        this.activeConversationId = conversation.id;
        this._upsertConversationMetadata(conversation);
        this.persistenceReady = true;
        this.persistenceError = "";
        return conversation;
      } catch (error) {
        this.persistenceError = `无法新建会话：${error.message}`;
        console.error(this.persistenceError);
        return null;
      } finally {
        this._isHydratingConversation = false;
      }
    },

    async switchConversation(id) {
      if (
        !id ||
        id === this.activeConversationId ||
        this.isSending ||
        this.isConversationLoading
      ) {
        return;
      }
      if (this.activeConversationId) {
        await this.persistActiveConversation({ force: true });
      }

      this.isConversationLoading = true;
      this.persistenceError = "";
      try {
        const conversation = await getConversationApi(id);
        this._applyConversation(conversation);
      } catch (error) {
        this.persistenceError = `无法切换会话：${error.message}`;
        console.error(this.persistenceError);
      } finally {
        this.isConversationLoading = false;
      }
    },

    scheduleConversationSave() {
      if (
        !this.persistenceReady ||
        !this.activeConversationId ||
        this._isHydratingConversation ||
        this.isSending
      ) {
        return;
      }
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => this.persistActiveConversation(), 650);
    },

    async persistActiveConversation({ force = false } = {}) {
      if (
        !this.activeConversationId ||
        this._isHydratingConversation ||
        (this.isSending && !force)
      ) {
        return null;
      }
      clearTimeout(saveTimer);
      saveTimer = null;

      const conversationId = this.activeConversationId;
      const payload = this._buildPersistencePayload();
      const request = () => updateConversationApi(conversationId, payload);
      saveSequence = saveSequence.catch(() => null).then(request);

      try {
        const conversation = await saveSequence;
        this._upsertConversationMetadata(conversation);
        this.persistenceError = "";
        return conversation;
      } catch (error) {
        this.persistenceError = `保存会话失败：${error.message}`;
        console.error(this.persistenceError);
        return null;
      }
    },

    async renameConversation(id, title) {
      try {
        const conversation = await renameConversationApi(id, title);
        this._upsertConversationMetadata(conversation);
        this.persistenceError = "";
      } catch (error) {
        this.persistenceError = `重命名失败：${error.message}`;
        throw error;
      }
    },

    async deleteConversation(id) {
      if (!id || this.isSending) return;
      try {
        await deleteConversationApi(id);
        this.conversations = this.conversations.filter(
          (conversation) => conversation.id !== id,
        );
        if (this.activeConversationId !== id) return;

        this.activeConversationId = null;
        if (this.conversations.length) {
          const conversation = await getConversationApi(
            this.conversations[0].id,
          );
          this._applyConversation(conversation);
        } else {
          await this.createConversation();
        }
      } catch (error) {
        this.persistenceError = `删除会话失败：${error.message}`;
        throw error;
      }
    },

    setUserAvatar(avatar) {
      this.userAvatar = avatar;
      this.scheduleConversationSave();
    },

    setBotAvatar(avatar) {
      this.characterSettings.avatar = avatar;
      this.scheduleConversationSave();
    },

    async setCharacter(character) {
      if (this.isSending) return;
      if (!this.activeConversationId) {
        await this.createConversation(character);
        return;
      }

      const currentId =
        this.characterSettings?.id || this.characterSettings?.basicInfo?.name;
      const nextId = character?.id || character?.basicInfo?.name;
      if (currentId === nextId) return;

      // 已有消息时切换角色会创建新会话，防止角色上下文混用。
      if (this.conversationHistory.length) {
        await this.createConversation(character);
        return;
      }

      this._applyCharacterTemplate(character);
      await this.persistActiveConversation({ force: true });
    },

    resetCharacter() {
      this._applyCharacterTemplate(null);
      this.scheduleConversationSave();
    },

    updateCharacterSettings(settings) {
      this.characterSettings = cloneValue(settings);
      this.scheduleConversationSave();
    },

    setChatBackground(background) {
      this.chatBackground = background;
      this.scheduleConversationSave();
    },

    setModelParams(params) {
      this.modelParams = { ...this.modelParams, ...params };
      this.scheduleConversationSave();
    },

    clearHistory() {
      this.conversationHistory = [];
      this.apiHistory = [];
      this.streamingContent = "";
      this.bookmarkedIndices = [];
      this.searchQuery = "";
      this.showSearch = false;
      this.stateChangeNotice = null;
      this.characterSettings.relationshipState = cloneValue(
        this._characterDefaults.relationshipState,
      );
      this.characterSettings.memory = cloneValue(
        this._characterDefaults.memory,
      );
      this.scheduleConversationSave();
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

    toggleBookmark(index) {
      if (!this.conversationHistory[index]) return;
      this.conversationHistory[index].bookmarked =
        !this.conversationHistory[index].bookmarked;
      this.scheduleConversationSave();
    },

    setSearch(query) {
      this.searchQuery = query;
      this.scheduleConversationSave();
    },

    toggleSearch() {
      this.showSearch = !this.showSearch;
      if (!this.showSearch) this.searchQuery = "";
      this.scheduleConversationSave();
    },

    setTheme(theme) {
      this.currentTheme = theme;
      localStorage.setItem("theme", theme);
      document.documentElement.setAttribute("data-theme", theme);
    },

    saveCustomCharacter(character) {
      const existing = this.customCharacters.findIndex(
        (item) => item.id === character.id,
      );
      if (existing >= 0) this.customCharacters[existing] = character;
      else this.customCharacters.push(character);
      localStorage.setItem(
        "customCharacters",
        JSON.stringify(this.customCharacters),
      );
    },

    deleteCustomCharacter(characterId) {
      this.customCharacters = this.customCharacters.filter(
        (character) => character.id !== characterId,
      );
      localStorage.setItem(
        "customCharacters",
        JSON.stringify(this.customCharacters),
      );
    },

    async sendMessage(question) {
      if (!question.trim() || this.isSending) return;
      if (!this.activeConversationId) await this.createConversation();

      this.addMessage("user", question);
      this.isSending = true;
      this.streamingContent = "";
      this.stateChangeNotice = null;

      const placeholderIndex = this.conversationHistory.length;
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
        history: this.apiHistory.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        characterSettings: cloneValue(this.characterSettings),
        temperature: parseFloat(this.modelParams.temperature.toFixed(2)),
        top_p: parseFloat(this.modelParams.top_p.toFixed(2)),
      };

      try {
        await sendMessageStream(payload, {
          onChunk: (text) => {
            this.streamingContent += text;
            this.conversationHistory[placeholderIndex] = {
              ...this.conversationHistory[placeholderIndex],
              content: this.streamingContent,
            };
          },
          onState: ({ relationshipState, stateChange }) => {
            if (relationshipState) {
              this.characterSettings.relationshipState = relationshipState;
            }
            if (stateChange) {
              this.stateChangeNotice = stateChange;
              setTimeout(() => {
                this.stateChangeNotice = null;
              }, 5000);
            }
          },
          onDone: ({ history, memory }) => {
            this.conversationHistory[placeholderIndex] = {
              ...this.conversationHistory[placeholderIndex],
              content: this.streamingContent,
              streaming: false,
            };
            if (history) this.apiHistory = history;
            if (memory) this.characterSettings.memory = memory;
          },
          onError: (message) => {
            this.conversationHistory[placeholderIndex] = {
              ...this.conversationHistory[placeholderIndex],
              content: `出错了：${message}`,
              streaming: false,
            };
          },
        });
      } catch (error) {
        let errorMessage = "网络似乎出了点问题，请稍后再试。";
        if (error.message?.includes("timeout")) {
          errorMessage = "回复超时了，请重试。";
        }
        this.conversationHistory[placeholderIndex] = {
          ...this.conversationHistory[placeholderIndex],
          content: errorMessage,
          streaming: false,
        };
      } finally {
        this.isSending = false;
        this.streamingContent = "";
        await this.persistActiveConversation({ force: true });
      }
    },
  },
});
