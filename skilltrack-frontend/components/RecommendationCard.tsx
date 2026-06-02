'use client';

import React from 'react';
import { ActionButton, Pill, ProgressBar, SurfaceCard, cx } from '@/components/student/DesignSystem';

export type RecommendationType = 'Course' | 'Certification' | 'Book' | 'Project' | 'CareerPath';
export type RecommendationPriority = 'High' | 'Medium' | 'Low';

export interface RecommendationItem {
    _id: string;
    type: RecommendationType;
    title: string;
    description: string;
    link?: string;
    priority: RecommendationPriority;
    estimatedHours: number;
    reason: string;
    status: 'Active' | 'Completed' | 'Ignored';
    progressPercent: number;
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    targetCompetences?: Array<{ _id: string; name: string; domain?: string }>;
}

interface RecommendationCardProps {
    item: RecommendationItem;
    onStart: (item: RecommendationItem) => void;
    onComplete: (item: RecommendationItem) => void;
    onIgnore: (item: RecommendationItem) => void;
    disabled?: boolean;
}

const typeLabel = (type: RecommendationType) => {
    switch (type) {
        case 'Course':
            return '🎓 Cours';
        case 'Certification':
            return '🏅 Certif';
        case 'Book':
            return '📚 Livre';
        case 'Project':
            return '🛠 Projet';
        case 'CareerPath':
            return '🧭 Profil';
        default:
            return type;
    }
};

const priorityClasses = (priority: RecommendationPriority) => {
    if (priority === 'High') return 'bg-[#fee2e2] text-[#b91c1c]';
    if (priority === 'Medium') return 'bg-[#fef3c7] text-[#b45309]';
    return 'bg-[#d1fae5] text-[#059669]';
};

const difficultyPill = (difficulty?: RecommendationItem['difficulty']) => {
    if (!difficulty) return null;
    if (difficulty === 'Advanced') return 'bg-[#fee2e2] text-[#b91c1c]';
    if (difficulty === 'Beginner') return 'bg-[#e0e7ff] text-[#1d4ed8]';
    return 'bg-[#ecfdf3] text-[#047857]';
};

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
    item,
    onStart,
    onComplete,
    onIgnore,
    disabled,
}) => {
    const isCompleted = item.status === 'Completed';
    const isIgnored = item.status === 'Ignored';
    const buttonDisabled = disabled || isCompleted || isIgnored;
    const targetNames = (item.targetCompetences || [])
        .map((comp) => comp?.name)
        .filter(Boolean)
        .slice(0, 3) as string[];

    return (
        <SurfaceCard className="p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <Pill className={cx('mb-2', priorityClasses(item.priority))}>{item.priority}</Pill>
                    <h3 className="text-lg font-bold text-black">{item.title}</h3>
                    <p className="mt-1 text-sm text-[#6b7280]">{item.description}</p>
                </div>
                <Pill className="bg-[#f3f4f6] text-[#111827]">{typeLabel(item.type)}</Pill>
            </div>

            <div className="flex flex-wrap gap-2">
                <Pill className="bg-[#eef2ff] text-[#1d4ed8]">⏱ {item.estimatedHours}h</Pill>
                <Pill className="bg-[#f9fafb] text-[#4b5563]">{item.status}</Pill>
                {difficultyPill(item.difficulty) ? (
                    <Pill className={difficultyPill(item.difficulty)!}>{item.difficulty}</Pill>
                ) : null}
            </div>

            <p className="text-sm text-[#4b5563]">💡 {item.reason}</p>

            {targetNames.length ? (
                <p className="text-xs text-[#6b7280]">Competences cibles: {targetNames.join(', ')}</p>
            ) : null}

            <div>
                <ProgressBar value={item.progressPercent || 0} />
                <p className="mt-2 text-xs text-[#6b7280]">{item.progressPercent || 0}% complete</p>
            </div>

            <div className="flex flex-wrap gap-2">
                <ActionButton
                    variant="primary"
                    onClick={() => onStart(item)}
                    disabled={buttonDisabled}
                >
                    ▶ Commencer
                </ActionButton>
                <ActionButton
                    onClick={() => onComplete(item)}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    disabled={buttonDisabled}
                >
                    ✅ Termine
                </ActionButton>
                <ActionButton
                    onClick={() => onIgnore(item)}
                    className="border-rose-200 text-rose-600 hover:bg-rose-50"
                    disabled={buttonDisabled}
                >
                    🗑 Ignorer
                </ActionButton>
            </div>
        </SurfaceCard>
    );
};
