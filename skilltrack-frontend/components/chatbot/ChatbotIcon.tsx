import React from 'react';
import { ChatPreferences, getIconPositionStyle } from '../../lib/chatPreferences';
import '../../styles/Chatbot.css';

interface ChatbotIconProps {
    onClick: () => void;
    preferences: ChatPreferences;
}

const ChatbotIcon: React.FC<ChatbotIconProps> = ({ onClick, preferences }) => {
    return (
        <button
            type="button"
            className="chatbot-icon"
            style={getIconPositionStyle(preferences)}
            onClick={onClick}
            aria-label="Open chatbot"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        </button>
    );
};

export default ChatbotIcon;
