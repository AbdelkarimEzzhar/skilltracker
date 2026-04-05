'use client';

import React from 'react';

interface BaseProps {
    children: React.ReactNode;
    className?: string;
}

export const cx = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(' ');

export const SurfaceCard: React.FC<BaseProps> = ({ children, className }) => (
    <div
        className={cx(
            'rounded-[20px] border border-[#e6e8ee] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]',
            className
        )}
    >
        {children}
    </div>
);

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'ghost' | 'primary';
    icon?: React.ReactNode;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
    variant = 'ghost',
    icon,
    className,
    children,
    ...props
}) => {
    const base =
        'h-11 px-4 rounded-2xl border text-sm font-semibold inline-flex items-center gap-2 transition';
    const variants = {
        ghost: 'border-[#d7dbe4] bg-white text-[#111827] hover:bg-[#f3f4f6]',
        primary: 'border-[#1d4ed8] bg-[#1d4ed8] text-white hover:bg-[#1e40af] hover:border-[#1e40af]',
    };

    return (
        <button className={cx(base, variants[variant], className)} {...props}>
            {icon}
            {children}
        </button>
    );
};

interface PillProps {
    children: React.ReactNode;
    className?: string;
}

export const Pill: React.FC<PillProps> = ({ children, className }) => (
    <span
        className={cx(
            'inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold leading-none',
            className
        )}
    >
        {children}
    </span>
);

interface ProgressBarProps {
    value: number;
    max?: number;
    className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, max = 100, className }) => {
    const percent = Math.max(0, Math.min(100, (value / max) * 100));

    return (
        <div className={cx('h-3 rounded-full bg-[#d7def4] overflow-hidden', className)}>
            <div className="h-full bg-[#1d4ed8] rounded-full" style={{ width: `${percent}%` }} />
        </div>
    );
};

interface IconBadgeProps {
    children: React.ReactNode;
    className?: string;
}

export const IconBadge: React.FC<IconBadgeProps> = ({ children, className }) => (
    <div
        className={cx(
            'h-10 w-10 rounded-xl flex items-center justify-center text-base font-semibold',
            className
        )}
    >
        {children}
    </div>
);

interface SectionTitleProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title, subtitle, actions }) => (
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
            <h1 className="text-2xl md:text-3xl leading-tight font-bold text-black">{title}</h1>
            {subtitle ? <p className="mt-1.5 text-sm md:text-base text-[#4b5563]">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
);

interface MiniStatCardProps {
    icon: React.ReactNode;
    iconClassName: string;
    value: string;
    label: string;
    note?: string;
    badge?: React.ReactNode;
}

export const MiniStatCard: React.FC<MiniStatCardProps> = ({
    icon,
    iconClassName,
    value,
    label,
    note,
    badge,
}) => (
    <SurfaceCard className="p-6 min-h-[150px] flex flex-col justify-between">
        <div className="flex items-start justify-between">
            <IconBadge className={iconClassName}>{icon}</IconBadge>
            {badge}
        </div>
        <div>
            <p className="text-xl md:text-2xl leading-tight font-bold text-black">{value}</p>
            <p className="mt-1 text-sm md:text-base text-[#4b5563]">{label}</p>
            {note ? <p className="mt-1 text-sm text-[#6b7280]">{note}</p> : null}
        </div>
    </SurfaceCard>
);
