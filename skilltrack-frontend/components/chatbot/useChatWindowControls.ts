import { useCallback, useEffect, useRef } from 'react';
import {
    ChatPreferences,
    clamp,
    clampSize,
} from '../../lib/chatPreferences';

type ResizeEdge = 'se' | 'e' | 's' | 'w' | 'n';

interface UseChatWindowControlsOptions {
    windowRef: React.RefObject<HTMLDivElement | null>;
    preferences: ChatPreferences;
    onPreferencesChange: (preferences: ChatPreferences) => void;
}

export const useChatWindowControls = ({
    windowRef,
    preferences,
    onPreferencesChange,
}: UseChatWindowControlsOptions) => {
    const dragRef = useRef<{
        startX: number;
        startY: number;
        startLeft: number;
        startTop: number;
    } | null>(null);

    const resizeRef = useRef<{
        edge: ResizeEdge;
        startX: number;
        startY: number;
        startLeft: number;
        startTop: number;
        startW: number;
        startH: number;
    } | null>(null);

    const updatePreferences = useCallback(
        (updater: (current: ChatPreferences) => ChatPreferences) => {
            onPreferencesChange(updater(preferences));
        },
        [onPreferencesChange, preferences]
    );

    const getRect = () => windowRef.current?.getBoundingClientRect();

    const handleDragMove = useCallback(
        (e: MouseEvent) => {
            if (!dragRef.current) return;
            const { startX, startY, startLeft, startTop } = dragRef.current;
            const maxX = Math.max(0, window.innerWidth - preferences.width - 8);
            const maxY = Math.max(0, window.innerHeight - preferences.height - 8);

            updatePreferences((current) => ({
                ...current,
                position: 'custom',
                customX: clamp(startLeft + (e.clientX - startX), 8, maxX),
                customY: clamp(startTop + (e.clientY - startY), 8, maxY),
            }));
        },
        [preferences.width, preferences.height, updatePreferences]
    );

    const handleDragEnd = useCallback(() => {
        dragRef.current = null;
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, [handleDragMove]);

    const handleDragStart = useCallback(
        (e: React.MouseEvent) => {
            const rect = getRect();
            if (!rect) return;
            e.preventDefault();
            dragRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                startLeft: rect.left,
                startTop: rect.top,
            };
            document.body.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);
        },
        [handleDragMove, handleDragEnd]
    );

    const handleResizeMove = useCallback(
        (e: MouseEvent) => {
            if (!resizeRef.current) return;
            const { edge, startX, startY, startLeft, startTop, startW, startH } = resizeRef.current;

            let nextLeft = startLeft;
            let nextTop = startTop;
            let nextW = startW;
            let nextH = startH;

            if (edge === 'e' || edge === 'se') {
                nextW = startW + (e.clientX - startX);
            }
            if (edge === 'w') {
                const delta = e.clientX - startX;
                nextW = startW - delta;
                nextLeft = startLeft + delta;
            }
            if (edge === 's' || edge === 'se') {
                nextH = startH + (e.clientY - startY);
            }
            if (edge === 'n') {
                const delta = e.clientY - startY;
                nextH = startH - delta;
                nextTop = startTop + delta;
            }

            const clamped = clampSize(nextW, nextH);
            const maxLeft = window.innerWidth - clamped.width - 8;
            const maxTop = window.innerHeight - clamped.height - 8;

            updatePreferences((current) => ({
                ...current,
                position: 'custom',
                customX: clamp(nextLeft, 8, maxLeft),
                customY: clamp(nextTop, 8, maxTop),
                width: clamped.width,
                height: clamped.height,
                sizePreset: 'custom',
            }));
        },
        [updatePreferences]
    );

    const handleResizeEnd = useCallback(() => {
        resizeRef.current = null;
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, [handleResizeMove]);

    const handleResizeStart = useCallback(
        (edge: ResizeEdge) => (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const rect = getRect();
            if (!rect) return;

            resizeRef.current = {
                edge,
                startX: e.clientX,
                startY: e.clientY,
                startLeft: rect.left,
                startTop: rect.top,
                startW: rect.width,
                startH: rect.height,
            };
            document.body.style.userSelect = 'none';
            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeEnd);
        },
        [handleResizeMove, handleResizeEnd]
    );

    useEffect(
        () => () => {
            handleDragEnd();
            handleResizeEnd();
        },
        [handleDragEnd, handleResizeEnd]
    );

    return { handleDragStart, handleResizeStart };
};
