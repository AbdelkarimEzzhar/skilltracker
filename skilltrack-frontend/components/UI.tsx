'use client';

import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        {children}
    </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    ...props
}) => {
    const variantClasses = {
        primary: 'bg-primary text-white hover:bg-primary-dark',
        secondary: 'bg-secondary text-white hover:bg-purple-700',
        danger: 'bg-error text-white hover:bg-red-600',
        success: 'bg-success text-white hover:bg-green-700',
    };

    const sizeClasses = {
        sm: 'px-3 py-1 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    return (
        <button
            className={`rounded-lg font-semibold transition ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => (
    <div className="w-full">
        {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
        <input
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
            {...props}
        />
        {error && <p className="text-error text-sm mt-1">{error}</p>}
    </div>
);

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'primary' | 'success' | 'warning' | 'error';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary' }) => {
    const variantClasses = {
        primary: 'bg-blue-100 text-blue-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        error: 'bg-red-100 text-red-800',
    };

    return (
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${variantClasses[variant]}`}>
            {children}
        </span>
    );
};

interface ProgressBarProps {
    current: number;
    total: number;
    label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, label }) => {
    const percentage = (current / total) * 100;

    return (
        <div className="w-full">
            {label && <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>}
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <p className="text-xs text-gray-500 mt-1">{current} / {total}</p>
        </div>
    );
};

interface TabsProps {
    tabs: { label: string; content: React.ReactNode }[];
}

export const Tabs: React.FC<TabsProps> = ({ tabs }) => {
    const [active, setActive] = React.useState(0);

    return (
        <div>
            <div className="flex border-b border-gray-200">
                {tabs.map((tab, i) => (
                    <button
                        key={i}
                        onClick={() => setActive(i)}
                        className={`px-4 py-2 font-medium ${i === active
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="mt-4">{tabs[active].content}</div>
        </div>
    );
};

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-screen overflow-y-auto">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                    >
                        &times;
                    </button>
                </div>
                <div className="px-6 py-4">
                    {children}
                </div>
                {footer && (
                    <div className="px-6 py-4 border-t border-gray-200 flex gap-2 justify-end">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
