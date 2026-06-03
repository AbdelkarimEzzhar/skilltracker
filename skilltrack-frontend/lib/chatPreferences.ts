import type { CSSProperties } from 'react';

export type ChatPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'custom';
export type ChatFontSize = 'small' | 'medium' | 'large';
export type ChatTheme = 'light' | 'dark';
export type ChatSizePreset = 'compact' | 'default' | 'large' | 'custom';

export interface ChatPreferences {
    position: ChatPosition;
    customX: number | null;
    customY: number | null;
    width: number;
    height: number;
    fontSize: ChatFontSize;
    theme: ChatTheme;
    sizePreset: ChatSizePreset;
}

const STORAGE_KEY = 'skilltrack-chatbot-preferences';

export const CHAT_SIZE_LIMITS = {
    minWidth: 280,
    maxWidth: 900,
    minHeight: 320,
    maxHeight: 920,
};

export const SIZE_PRESETS: Record<Exclude<ChatSizePreset, 'custom'>, { width: number; height: number }> = {
    compact: { width: 320, height: 420 },
    default: { width: 380, height: 520 },
    large: { width: 480, height: 640 },
};

export const DEFAULT_PREFERENCES: ChatPreferences = {
    position: 'bottom-right',
    customX: null,
    customY: null,
    width: SIZE_PRESETS.default.width,
    height: SIZE_PRESETS.default.height,
    fontSize: 'medium',
    theme: 'light',
    sizePreset: 'default',
};

export const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

export const clampSize = (width: number, height: number) => ({
    width: clamp(width, CHAT_SIZE_LIMITS.minWidth, CHAT_SIZE_LIMITS.maxWidth),
    height: clamp(height, CHAT_SIZE_LIMITS.minHeight, CHAT_SIZE_LIMITS.maxHeight),
});

export const loadChatPreferences = (): ChatPreferences => {
    if (typeof window === 'undefined') return { ...DEFAULT_PREFERENCES };

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_PREFERENCES };

        const parsed = JSON.parse(raw) as Partial<ChatPreferences>;
        const size = clampSize(
            parsed.width ?? DEFAULT_PREFERENCES.width,
            parsed.height ?? DEFAULT_PREFERENCES.height
        );

        return {
            position: parsed.position ?? DEFAULT_PREFERENCES.position,
            customX: typeof parsed.customX === 'number' ? parsed.customX : null,
            customY: typeof parsed.customY === 'number' ? parsed.customY : null,
            width: size.width,
            height: size.height,
            fontSize: parsed.fontSize ?? DEFAULT_PREFERENCES.fontSize,
            theme: parsed.theme ?? DEFAULT_PREFERENCES.theme,
            sizePreset: parsed.sizePreset ?? 'custom',
        };
    } catch {
        return { ...DEFAULT_PREFERENCES };
    }
};

export const saveChatPreferences = (preferences: ChatPreferences) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
};

export const getPositionStyle = (
    preferences: ChatPreferences
): CSSProperties => {
    const margin = 20;
    const iconGap = 80;

    if (
        preferences.position === 'custom' &&
        preferences.customX !== null &&
        preferences.customY !== null
    ) {
        return {
            left: preferences.customX,
            top: preferences.customY,
            right: 'auto',
            bottom: 'auto',
        };
    }

    switch (preferences.position) {
        case 'bottom-left':
            return { left: margin, bottom: iconGap, right: 'auto', top: 'auto' };
        case 'top-right':
            return { right: margin, top: margin, left: 'auto', bottom: 'auto' };
        case 'top-left':
            return { left: margin, top: margin, right: 'auto', bottom: 'auto' };
        case 'bottom-right':
        default:
            return { right: margin, bottom: iconGap, left: 'auto', top: 'auto' };
    }
};

export const getIconPositionStyle = (preferences: ChatPreferences): CSSProperties => {
    const margin = 20;

    if (
        preferences.position === 'custom' &&
        preferences.customX !== null &&
        preferences.customY !== null
    ) {
        const windowBottom = preferences.customY + preferences.height;
        const windowRight = preferences.customX + preferences.width;
        return {
            left: Math.max(margin, windowRight - 60),
            top: Math.min(window.innerHeight - 80, windowBottom + 12),
            right: 'auto',
            bottom: 'auto',
        };
    }

    switch (preferences.position) {
        case 'bottom-left':
            return { left: margin, bottom: margin, right: 'auto', top: 'auto' };
        case 'top-right':
            return { right: margin, top: margin, left: 'auto', bottom: 'auto' };
        case 'top-left':
            return { left: margin, top: margin, right: 'auto', bottom: 'auto' };
        case 'bottom-right':
        default:
            return { right: margin, bottom: margin, left: 'auto', top: 'auto' };
    }
};
