import { ChatMode } from './api';

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'assistant';
    createdAt: string;
}

export interface Conversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    mode: ChatMode;
    createdAt: string;
    updatedAt: string;
}

export interface ChatStorageState {
    activeConversationId: string | null;
    conversations: Conversation[];
}

const STORAGE_PREFIX = 'skilltrack-chatbot-conversations';
const MAX_CONVERSATIONS = 30;

export const WELCOME_MESSAGE =
    'Hello! How can I help you with your career goals today?';

const createId = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const storageKey = (userId: string) => `${STORAGE_PREFIX}:${userId}`;

const createWelcomeMessage = (): ChatMessage => ({
    id: createId(),
    text: WELCOME_MESSAGE,
    sender: 'assistant',
    createdAt: new Date().toISOString(),
});

export const createConversation = (mode: ChatMode = 'basic'): Conversation => {
    const now = new Date().toISOString();
    return {
        id: createId(),
        title: 'New conversation',
        messages: [createWelcomeMessage()],
        mode,
        createdAt: now,
        updatedAt: now,
    };
};

export const deriveConversationTitle = (messages: ChatMessage[]): string => {
    const firstUser = messages.find((m) => m.sender === 'user');
    if (!firstUser) return 'New conversation';
    const trimmed = firstUser.text.trim();
    if (!trimmed) return 'New conversation';
    return trimmed.length > 42 ? `${trimmed.slice(0, 42)}…` : trimmed;
};

export const loadChatStorage = (userId: string | undefined): ChatStorageState => {
    if (!userId || typeof window === 'undefined') {
        const conversation = createConversation();
        return {
            activeConversationId: conversation.id,
            conversations: [conversation],
        };
    }

    try {
        const raw = window.localStorage.getItem(storageKey(userId));
        if (!raw) {
            const conversation = createConversation();
            return {
                activeConversationId: conversation.id,
                conversations: [conversation],
            };
        }

        const parsed = JSON.parse(raw) as ChatStorageState;
        if (!parsed.conversations?.length) {
            const conversation = createConversation();
            return {
                activeConversationId: conversation.id,
                conversations: [conversation],
            };
        }

        return {
            activeConversationId:
                parsed.activeConversationId &&
                parsed.conversations.some((c) => c.id === parsed.activeConversationId)
                    ? parsed.activeConversationId
                    : parsed.conversations[0].id,
            conversations: parsed.conversations,
        };
    } catch {
        const conversation = createConversation();
        return {
            activeConversationId: conversation.id,
            conversations: [conversation],
        };
    }
};

export const saveChatStorage = (userId: string | undefined, state: ChatStorageState) => {
    if (!userId || typeof window === 'undefined') return;

    const trimmed: ChatStorageState = {
        ...state,
        conversations: state.conversations
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, MAX_CONVERSATIONS),
    };

    window.localStorage.setItem(storageKey(userId), JSON.stringify(trimmed));
};

export const toApiHistory = (messages: ChatMessage[]) =>
    messages
        .filter((m) => m.text !== WELCOME_MESSAGE || m.sender === 'user')
        .map((m) => ({
            role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
            content: m.text,
        }));
