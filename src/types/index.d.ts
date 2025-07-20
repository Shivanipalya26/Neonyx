export type Role = 'user' | 'assistant' | 'system';

export interface Message {
    id: string;
    content: string;
    role: Role;
    timestamp: number;
    model?: string;
}

export interface ChatSession {
    id: string;
    name: string;
    messages: Message[];
    createdAt: number;
    lastUpdatedAt: number;
}

export interface ChatState {
    messages: Message[];
    isLoading: boolean;
    sessions: ChatSession[];
    error: string | null;
    currentSessionId: string | null;
}

export interface ChatStore extends ChatState {
    addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
    setLoading: (loading: boolean) => void;
    createSession: () => string;
    loadSession: (sessionId: string) => void;
    deleteSession: (sessionId: string) => void;
    deleteAllSessions: () => void;
    renameSession: (sessionId: string, newName: string) => void;
    getCurrentSession: () => ChatSession | undefined;
    setError: (error: string | null) => void;
    clearMessages: () => void;
}