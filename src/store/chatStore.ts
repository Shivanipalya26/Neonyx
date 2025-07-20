import { ChatState, ChatStore, ChatSession, Message } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const initialState: ChatState = {
    messages: [],
    isLoading: false,
    sessions: [],
    error: null,
    currentSessionId: null,
}

export const useChatStore = create<ChatStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            addMessage: (message: Omit<Message, 'id' | 'timestamp'>) =>
                set((state) => {
                    const newMessage = {
                        ...message,
                        id: crypto.randomUUID(),
                        timestamp: Date.now(),
                    };

                    const currentSessionId = state.currentSessionId;
                    const sessions = [...state.sessions];

                    if (currentSessionId) {
                        const sessionIndex = sessions.findIndex(s => s.id === currentSessionId);
                        if (sessionIndex !== -1) {
                            sessions[sessionIndex] = {
                                ...sessions[sessionIndex],
                                messages: [...sessions[sessionIndex].messages, newMessage],
                                lastUpdatedAt: Date.now(),
                            };
                        }
                    }

                    return {
                        messages: [...state.messages, newMessage],
                        sessions,
                        error: null,
                    };
                }),

            setLoading: (loading: boolean) => set({ isLoading: loading }),

            createSession: () => {
                const state = get();
                const newSession: ChatSession = {
                    id: crypto.randomUUID(),
                    name: state.sessions.length === 0 ? 'default' : `Chat ${new Date().toLocaleDateString()}`,
                    messages: [],
                    createdAt: Date.now(),
                    lastUpdatedAt: Date.now(),
                };

                set((state) => ({
                    sessions: [newSession, ...state.sessions],
                    currentSessionId: newSession.id,
                    messages: [],
                }));

                return newSession.id;
            },

            loadSession: (sessionId: string) => {
                const state = get();
                if (sessionId === null) {
                    set({
                        currentSessionId: null,
                        messages: [],
                    });
                    return;
                }

                const session = state.sessions.find(s => s.id === sessionId);
                if (session) {
                    set({
                        currentSessionId: sessionId,
                        messages: session.messages,
                    });
                }
            },

            deleteSession: (sessionId: string) =>
                set((state) => {
                    const updatedSessions = state.sessions.filter(s => s.id !== sessionId);
                    const isCurrentSession = state.currentSessionId === sessionId;
                    const needNewSession = updatedSessions.length === 0 || isCurrentSession;

                    if (needNewSession) {
                        const newSession: ChatSession = {
                            id: crypto.randomUUID(),
                            name: 'New Chat',
                            messages: [],
                            createdAt: Date.now(),
                            lastUpdatedAt: Date.now(),
                        };

                        return {
                            sessions: [newSession, ...updatedSessions],
                            currentSessionId: newSession.id,
                            messages: [],
                        };
                    }

                    return {
                        sessions: updatedSessions,
                        ...(isCurrentSession ? {
                            currentSessionId: updatedSessions[0]?.id || null,
                            messages: updatedSessions[0]?.messages || [],
                        } : {}),
                    };
                }),

            deleteAllSessions: () => {
                const newSession: ChatSession = {
                    id: crypto.randomUUID(),
                    name: 'New Chat',
                    messages: [],
                    createdAt: Date.now(),
                    lastUpdatedAt: Date.now(),
                };

                set({
                    sessions: [newSession],
                    currentSessionId: newSession.id,
                    messages: [],
                });
            },

            renameSession: (sessionId: string, newName: string) =>
                set((state) => ({
                    sessions: state.sessions.map(s => s.id === sessionId ? { ...s, name: newName } : s),
                })),

            getCurrentSession: () => {
                const state = get();
                return state.sessions.find(s => s.id === state.currentSessionId);
            },

            setError: (error: string | null) => set({ error }),

            clearMessages: () => set({ messages: [] }),
        }),
        {
            name: 'chat-storage',
            version: 1,
        }
    )
);