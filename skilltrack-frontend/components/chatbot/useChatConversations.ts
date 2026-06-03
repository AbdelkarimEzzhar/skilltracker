import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChatMode } from '../../lib/api';
import {
    ChatMessage,
    ChatStorageState,
    createConversation,
    deriveConversationTitle,
    loadChatStorage,
    saveChatStorage,
} from '../../lib/chatStorage';

const MODE_STORAGE_KEY = 'skilltrack-chatbot-mode';

const loadStoredMode = (): ChatMode => {
    if (typeof window === 'undefined') return 'basic';
    return window.localStorage.getItem(MODE_STORAGE_KEY) === 'groq' ? 'groq' : 'basic';
};

export const useChatConversations = (userId: string | undefined) => {
    const [chatStorage, setChatStorage] = useState<ChatStorageState>(() =>
        loadChatStorage(userId)
    );
    const [mode, setMode] = useState<ChatMode>('basic');

    const activeConversation = useMemo(
        () =>
            chatStorage.conversations.find((c) => c.id === chatStorage.activeConversationId) ||
            chatStorage.conversations[0],
        [chatStorage]
    );

    const messages = activeConversation?.messages ?? [];

    useEffect(() => {
        const storage = loadChatStorage(userId);
        setChatStorage(storage);
        const active = storage.conversations.find((c) => c.id === storage.activeConversationId);
        setMode(active?.mode ?? loadStoredMode());
    }, [userId]);

    useEffect(() => {
        saveChatStorage(userId, chatStorage);
    }, [chatStorage, userId]);

    useEffect(() => {
        window.localStorage.setItem(MODE_STORAGE_KEY, mode);
    }, [mode]);

    useEffect(() => {
        if (!activeConversation) return;
        setChatStorage((prev) => ({
            ...prev,
            conversations: prev.conversations.map((conversation) =>
                conversation.id === activeConversation.id
                    ? { ...conversation, mode }
                    : conversation
            ),
        }));
    }, [mode, activeConversation?.id]);

    const createNewConversation = useCallback(() => {
        const conversation = createConversation(mode);
        setChatStorage((prev) => ({
            activeConversationId: conversation.id,
            conversations: [conversation, ...prev.conversations],
        }));
        return conversation.id;
    }, [mode]);

    const selectConversation = useCallback((conversationId: string) => {
        setChatStorage((prev) => ({ ...prev, activeConversationId: conversationId }));
    }, []);

    const deleteConversation = useCallback(
        (conversationId: string) => {
            setChatStorage((prev) => {
                const remaining = prev.conversations.filter((c) => c.id !== conversationId);
                if (remaining.length === 0) {
                    const fresh = createConversation(mode);
                    return { activeConversationId: fresh.id, conversations: [fresh] };
                }
                return {
                    activeConversationId:
                        prev.activeConversationId === conversationId
                            ? remaining[0].id
                            : prev.activeConversationId,
                    conversations: remaining,
                };
            });
        },
        [mode]
    );

    const appendMessage = useCallback(
        (conversationId: string, message: ChatMessage) => {
            setChatStorage((prev) => ({
                ...prev,
                conversations: prev.conversations.map((conversation) => {
                    if (conversation.id !== conversationId) return conversation;
                    const nextMessages = [...conversation.messages, message];
                    return {
                        ...conversation,
                        messages: nextMessages,
                        title: deriveConversationTitle(nextMessages),
                        updatedAt: new Date().toISOString(),
                    };
                }),
            }));
        },
        []
    );

    return {
        chatStorage,
        activeConversation,
        messages,
        mode,
        setMode,
        createNewConversation,
        selectConversation,
        deleteConversation,
        appendMessage,
    };
};
