import React from 'react';
import {
    ChatFontSize,
    ChatPosition,
    ChatPreferences,
    ChatSizePreset,
    ChatTheme,
    DEFAULT_PREFERENCES,
    SIZE_PRESETS,
} from '../../lib/chatPreferences';

interface ChatbotSettingsProps {
    preferences: ChatPreferences;
    onChange: (next: ChatPreferences) => void;
    onClose: () => void;
}

const ChatbotSettings: React.FC<ChatbotSettingsProps> = ({ preferences, onChange, onClose }) => {
    const applyPreset = (preset: Exclude<ChatSizePreset, 'custom'>) => {
        const size = SIZE_PRESETS[preset];
        onChange({
            ...preferences,
            sizePreset: preset,
            width: size.width,
            height: size.height,
        });
    };

    return (
        <div className="chatbot-settings-panel" role="dialog" aria-label="Chat settings">
            <div className="chatbot-settings-header">
                <strong>Chat settings</strong>
                <button type="button" className="chatbot-settings-close" onClick={onClose} aria-label="Close settings">
                    ×
                </button>
            </div>

            <label className="chatbot-settings-field">
                <span>Position</span>
                <select
                    value={preferences.position === 'custom' ? 'bottom-right' : preferences.position}
                    onChange={(e) =>
                        onChange({
                            ...preferences,
                            position: e.target.value as ChatPosition,
                            customX: null,
                            customY: null,
                        })
                    }
                >
                    <option value="bottom-right">Bottom right</option>
                    <option value="bottom-left">Bottom left</option>
                    <option value="top-right">Top right</option>
                    <option value="top-left">Top left</option>
                </select>
            </label>

            <div className="chatbot-settings-field">
                <span>Window size</span>
                <div className="chatbot-settings-presets">
                    {(['compact', 'default', 'large'] as const).map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            className={preferences.sizePreset === preset ? 'active' : ''}
                            onClick={() => applyPreset(preset)}
                            aria-pressed={preferences.sizePreset === preset}
                        >
                            {preset.charAt(0).toUpperCase() + preset.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <label className="chatbot-settings-field">
                <span>
                    Width: {preferences.width}px
                </span>
                <input
                    type="range"
                    min={280}
                    max={900}
                    value={preferences.width}
                    onChange={(e) =>
                        onChange({
                            ...preferences,
                            width: Number(e.target.value),
                            sizePreset: 'custom',
                        })
                    }
                />
            </label>

            <label className="chatbot-settings-field">
                <span>Height: {preferences.height}px</span>
                <input
                    type="range"
                    min={320}
                    max={920}
                    value={preferences.height}
                    onChange={(e) =>
                        onChange({
                            ...preferences,
                            height: Number(e.target.value),
                            sizePreset: 'custom',
                        })
                    }
                />
            </label>

            <label className="chatbot-settings-field">
                <span>Text size</span>
                <select
                    value={preferences.fontSize}
                    onChange={(e) =>
                        onChange({
                            ...preferences,
                            fontSize: e.target.value as ChatFontSize,
                        })
                    }
                >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                </select>
            </label>

            <label className="chatbot-settings-field">
                <span>Theme</span>
                <select
                    value={preferences.theme}
                    onChange={(e) =>
                        onChange({
                            ...preferences,
                            theme: e.target.value as ChatTheme,
                        })
                    }
                >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                </select>
            </label>

            <p className="chatbot-settings-hint">
                Drag the header to move the window. Drag edges or the corner to resize.
            </p>

            <button
                type="button"
                className="chatbot-settings-reset"
                onClick={() => onChange({ ...DEFAULT_PREFERENCES })}
            >
                Reset to defaults
            </button>
        </div>
    );
};

export default ChatbotSettings;
