import { create } from "zustand";
import { useTogetherStore } from "./togetherStore";
import { siteConfig } from "@/config/site";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  seen?: boolean;
}

interface TogetherChatState {
  messages: ChatMessage[];
  isChatOpen: boolean;
  unreadCount: number;
  draftMessage: string;
  isPartnerTyping: boolean;
  typingParticipantName: string | null;
  toastNotification: ChatMessage | null;

  // Actions
  addMessage: (message: ChatMessage) => void;
  sendMessage: (text: string) => void;
  clearMessages: () => void;
  setChatOpen: (isOpen: boolean) => void;
  toggleChatOpen: () => void;
  markMessagesRead: () => void;
  setDraftMessage: (text: string) => void;
  setPartnerTyping: (isTyping: boolean, name?: string | null) => void;
  clearPartnerTyping: () => void;
  markMessageSeen: (messageId: string) => void;
  setToastNotification: (notification: ChatMessage | null) => void;
  dismissToast: () => void;
}

export const useTogetherChatStore = create<TogetherChatState>((set, get) => ({
  messages: [],
  isChatOpen: false,
  unreadCount: 0,
  draftMessage: "",
  isPartnerTyping: false,
  typingParticipantName: null,
  toastNotification: null,

  addMessage: (message: ChatMessage) => {
    // Validate text & fields
    if (!message || !message.id || !message.text || typeof message.text !== "string") {
      return;
    }

    const trimmedText = message.text.trim();
    if (!trimmedText || trimmedText.length > 500) {
      return;
    }

    set((state) => {
      // Message Deduplication Protection
      if (state.messages.some((m) => m.id === message.id)) {
        return state;
      }

      const cleanMessage: ChatMessage = {
        ...message,
        text: trimmedText,
      };

      const currentParticipantId = useTogetherStore.getState().participantId;
      const isLocalUser = message.senderId === currentParticipantId;

      // If message is from remote partner and chat panel is CLOSED:
      // 1. Increment unread count
      // 2. Trigger toast popup notification
      const isClosedRemoteMessage = !state.isChatOpen && !isLocalUser;

      return {
        messages: [...state.messages, cleanMessage],
        unreadCount: isClosedRemoteMessage ? state.unreadCount + 1 : state.unreadCount,
        toastNotification: isClosedRemoteMessage ? cleanMessage : state.toastNotification,
      };
    });
  },

  sendMessage: async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 500) return;

    const togetherStore = useTogetherStore.getState();
    const isHost = togetherStore.isHost;
    const senderName = isHost
      ? siteConfig.hostName || "Heet"
      : siteConfig.partnerName || "Aaru";
    const senderId = togetherStore.participantId;
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = Date.now();

    const chatMessage: ChatMessage = {
      id: messageId,
      senderId,
      senderName,
      text: trimmed,
      timestamp,
      seen: false,
    };

    // 1. Add locally immediately
    get().addMessage(chatMessage);

    // 2. Clear draft & keep chat open
    set({ draftMessage: "", isChatOpen: true, toastNotification: null });

    // 3. Broadcast to partner through togetherRoom
    try {
      const { sendChatMessage } = await import("@/lib/togetherRoom");
      sendChatMessage(chatMessage);
    } catch (err) {
      console.warn("[TogetherChat] Failed to broadcast chat message:", err);
    }
  },

  clearMessages: () => {
    set({
      messages: [],
      unreadCount: 0,
      draftMessage: "",
      isPartnerTyping: false,
      typingParticipantName: null,
      toastNotification: null,
    });
  },

  setChatOpen: (isOpen: boolean) => {
    set((state) => ({
      isChatOpen: isOpen,
      unreadCount: isOpen ? 0 : state.unreadCount,
      toastNotification: isOpen ? null : state.toastNotification,
    }));
  },

  toggleChatOpen: () => {
    set((state) => {
      const nextState = !state.isChatOpen;
      return {
        isChatOpen: nextState,
        unreadCount: nextState ? 0 : state.unreadCount,
        toastNotification: nextState ? null : state.toastNotification,
      };
    });
  },

  markMessagesRead: () => {
    set({ unreadCount: 0 });
  },

  setDraftMessage: (draftMessage: string) => {
    set({ draftMessage });
  },

  setPartnerTyping: (isTyping: boolean, name?: string | null) => {
    set({
      isPartnerTyping: isTyping,
      typingParticipantName: isTyping ? name || "Partner" : null,
    });
  },

  clearPartnerTyping: () => {
    set({
      isPartnerTyping: false,
      typingParticipantName: null,
    });
  },

  markMessageSeen: (messageId: string) => {
    if (!messageId) return;
    set((state) => {
      const target = state.messages.find((m) => m.id === messageId);
      if (!target || target.seen) return state;

      return {
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, seen: true } : m
        ),
      };
    });
  },

  setToastNotification: (toastNotification: ChatMessage | null) => {
    set({ toastNotification });
  },

  dismissToast: () => {
    set({ toastNotification: null });
  },
}));
