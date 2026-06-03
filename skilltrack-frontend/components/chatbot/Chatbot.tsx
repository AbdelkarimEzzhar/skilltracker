import React, { useEffect, useRef, useState } from 'react';
import { chatApi } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { toApiHistory } from '../../lib/chatStorage';
import {
    ChatPreferences,
    clampSize,
    getPositionStyle,
} from '../../lib/chatPreferences';
import ChatbotSettings from './ChatbotSettings';
import { useChatConversations } from './useChatConversations';
import { useChatWindowControls } from './useChatWindowControls';
import '../../styles/Chatbot.css';

interface ChatbotProps {
    isOpen: boolean;
    onClose: () => void;
    preferences: ChatPreferences;
    onPreferencesChange: (preferences: ChatPreferences) => void;
}

const createId = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const formatConversationDate = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const Chatbot: React.FC<ChatbotProps> = ({
    isOpen,
    onClose,
    preferences,
    onPreferencesChange,
}) => {
    const { user } = useAuthStore();
    const userId = user?._id || user?.id;
    const windowRef = useRef<HTMLDivElement>(null);

    const [showHistory, setShowHistory] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const {
        chatStorage,
        activeConversation,
        messages,
        mode,
        setMode,
        createNewConversation,
        selectConversation,
        deleteConversation,
        appendMessage,
    } = useChatConversations(userId);

    const { handleDragStart, handleResizeStart } = useChatWindowControls({
        windowRef,
        preferences,
        onPreferencesChange,
    });

    useEffect(() => {
        if (!isOpen) return;
        const el = windowRef.current?.querySelector('.chatbot-messages');
        el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, [messages, isOpen]);

    if (!isOpen || !activeConversation) {
        return null;
    }

    const openNewConversation = () => {
        createNewConversation();
        setShowHistory(false);
        setInputValue('');
    };

    const handleSendMessage = async () => {
        const trimmedInput = inputValue.trim();
        if (!trimmedInput || isLoading) return;

        const history = toApiHistory(messages);
        appendMessage(activeConversation.id, {
            id: createId(),
            text: trimmedInput,
            sender: 'user',
            createdAt: new Date().toISOString(),
        });
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await chatApi.sendMessage(trimmedInput, mode, history);
            appendMessage(activeConversation.id, {
                id: createId(),
                text: response.data.reply,
                sender: 'assistant',
                createdAt: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Failed to send message:', error);
            appendMessage(activeConversation.id, {
                id: createId(),
                text: 'Sorry, something went wrong. Please try again.',
                sender: 'assistant',
                createdAt: new Date().toISOString(),
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div
            ref={windowRef}
            className={`chatbot-window chatbot-theme-${preferences.theme} chatbot-font-${preferences.fontSize}`}
            style={{
                ...getPositionStyle(preferences),
                width: preferences.width,
                height: preferences.height,
            }}
        >
            <div className="chatbot-header">
                <div
                    className="chatbot-header-title chatbot-drag-handle"
                    onMouseDown={handleDragStart}
                    title="Drag to move"
                >
                    <h2>SkillTrack AI</h2>
                    <span className={`chatbot-mode-badge mode-${mode}`}>
                        {mode === 'groq' ? 'Groq' : 'Basic'}
                    </span>
                </div>
                <div className="chatbot-header-actions">
                    <button
                        type="button"
                        className="chatbot-icon-btn"
                        onClick={openNewConversation}
                        disabled={isLoading}
                        title="New conversation"
                        aria-label="New conversation"
                    >
                        +
                    </button>
                    <button
                        type="button"
                        className={`chatbot-icon-btn ${showHistory ? 'active' : ''}`}
                        onClick={() => {
                            setShowSettings(false);
                            setShowHistory((prev) => !prev);
                        }}
                        title="Conversation history"
                        aria-label="Conversation history"
                    >
                        ☰
                    </button>
                    <button
                        type="button"
                        className={`chatbot-icon-btn ${showSettings ? 'active' : ''}`}
                        onClick={() => {
                            setShowHistory(false);
                            setShowSettings((prev) => !prev);
                        }}
                        title="Chat settings"
                        aria-label="Chat settings"
                    >
                        ⚙
                    </button>
                    <div className="chatbot-mode-toggle" role="group" aria-label="Chat mode">
                        <button
                            type="button"
                            className={mode === 'basic' ? 'active' : ''}
                            onClick={() => setMode('basic')}
                            disabled={isLoading}
                        >
                            Basic
                        </button>
                        <button
                            type="button"
                            className={mode === 'groq' ? 'active' : ''}
                            onClick={() => setMode('groq')}
                            disabled={isLoading}
                        >
                            Groq
                        </button>
                    </div>
                    <button type="button" onClick={onClose} className="close-btn" aria-label="Close">
                        &times;
                    </button>
                </div>
            </div>

            <div className="chatbot-body">
                {showSettings && (
                    <ChatbotSettings
                        preferences={preferences}
                        onChange={(next) => onPreferencesChange({ ...next, ...clampSize(next.width, next.height) })}
                        onClose={() => setShowSettings(false)}
                    />
                )}

                {showHistory && !showSettings && (
                    <aside className="chatbot-history-panel" aria-label="Past conversations">
                        <div className="chatbot-history-header">
                            <span>Conversations</span>
                            <button type="button" className="chatbot-history-new" onClick={openNewConversation}>
                                New
                            </button>
                        </div>
                        <ul className="chatbot-history-list">
                            {chatStorage.conversations.map((conversation) => (
                                <li key={conversation.id}>
                                    <button
                                        type="button"
                                        className={
                                            conversation.id === activeConversation.id ? 'active' : ''
                                        }
                                        onClick={() => {
                                            if (conversation.mode !== mode) {
                                                setMode(conversation.mode);
                                            }
                                            selectConversation(conversation.id);
                                            setShowHistory(false);
                                        }}
                                    >
                                        <span className="chatbot-history-title">{conversation.title}</span>
                                        <span className="chatbot-history-meta">
                                            {formatConversationDate(conversation.updatedAt)}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        className="chatbot-history-delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteConversation(conversation.id);
                                        }}
                                        aria-label={`Delete ${conversation.title}`}
                                    >
                                        ×
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </aside>
                )}

                <div className="chatbot-main">
                    <div className="chatbot-messages">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`message ${msg.sender}`}>
                                {msg.text}
                            </div>
                        ))}
                        {isLoading && <div className="message assistant">...</div>}
                    </div>
                    <div className="chatbot-input">
                        <textarea
                            rows={2}
                            placeholder={
                                mode === 'groq'
                                    ? 'Ask with Groq AI... (Enter to send, Shift+Enter for new line)'
                                    : 'Ask me anything... (Enter to send)'
                            }
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={handleSendMessage}
                            disabled={isLoading || !inputValue.trim()}
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>

            <button
                type="button"
                className="chatbot-resize-handle chatbot-resize-n"
                onMouseDown={handleResizeStart('n')}
                aria-label="Resize top"
            />
            <button
                type="button"
                className="chatbot-resize-handle chatbot-resize-e"
                onMouseDown={handleResizeStart('e')}
                aria-label="Resize right"
            />
            <button
                type="button"
                className="chatbot-resize-handle chatbot-resize-s"
                onMouseDown={handleResizeStart('s')}
                aria-label="Resize bottom"
            />
            <button
                type="button"
                className="chatbot-resize-handle chatbot-resize-w"
                onMouseDown={handleResizeStart('w')}
                aria-label="Resize left"
            />
            <button
                type="button"
                className="chatbot-resize-handle chatbot-resize-se"
                onMouseDown={handleResizeStart('se')}
                aria-label="Resize corner"
                title="Drag to resize"
            />
        </div>
    );
};

export default Chatbot;
