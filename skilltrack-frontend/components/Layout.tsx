'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { authApi, studentApi } from '@/lib/api';
import Chatbot from './chatbot/Chatbot';
import ChatbotIcon from './chatbot/ChatbotIcon';
import { ChatPreferences, loadChatPreferences, saveChatPreferences } from '../lib/chatPreferences';
import '../styles/Chatbot.css';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [activityMeta, setActivityMeta] = React.useState({ xp: 0, level: 1 });
    const isAdmin = user?.role === 'ADMIN';

    React.useEffect(() => {
        const fetchMeta = async () => {
            if (!user || user.role === 'ADMIN') return;

            try {
                const response = await studentApi.getDashboard();
                const profile = response.data?.data?.profile;

                setActivityMeta({
                    xp: Math.max(0, Number(profile?.experiencePoints || 0)),
                    level: Math.max(1, Number(profile?.level || 1)),
                });
            } catch (error) {
                setActivityMeta({ xp: 0, level: 1 });
            }
        };

        fetchMeta();
    }, [user]);

    const handleLogout = async () => {
        try {
            await authApi.logout();
            logout();
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const menuGroups = isAdmin
        ? [
            {
                title: 'Administration',
                items: [
                    { label: 'Dashboard', href: '/admin/dashboard', icon: 'dashboard' },
                    { label: 'Utilisateurs', href: '/admin/users', icon: 'user' },
                    { label: 'Compétences', href: '/admin/skills', icon: 'skills' },
                ],
            },
        ]
        : [
            {
                title: 'Principal',
                items: [
                    { label: 'Tableau de bord', href: '/student/dashboard', icon: 'dashboard' },
                    { label: 'Mes compétences', href: '/student/skills', icon: 'skills' },
                    { label: 'Parcours académique', href: '/student/academic', icon: 'academic' },
                    { label: 'Roadmap carrière', href: '/student/roadmap', icon: 'roadmap' },
                ],
            },
            {
                title: 'Apprentissage',
                items: [
                    { label: 'Recommandations IA', href: '/student/recommendations', icon: 'spark' },
                    { label: 'Mes formations', href: '/student/formations', icon: 'book' },
                ],
            },
            {
                title: 'Profil',
                items: [
                    { label: 'Mon portfolio', href: '/student/portfolio', icon: 'portfolio' },
                    { label: 'Mon profil', href: '/student/profile', icon: 'user' },
                    { label: 'Paramètres', href: '/student/settings', icon: 'settings' },
                ],
            },
        ];

    const icon = (name: string) => {
        const className = 'h-4 w-4 text-[#111827]';

        switch (name) {
            case 'dashboard':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                        <rect x="14" y="14" width="7" height="7" rx="1.5" />
                    </svg>
                );
            case 'skills':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
                        <circle cx="12" cy="8" r="4" />
                        <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                    </svg>
                );
            case 'academic':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
                        <path d="M3 6h18v12H3z" />
                        <path d="M8 6v12" />
                    </svg>
                );
            case 'roadmap':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
                        <circle cx="6" cy="18" r="2" />
                        <circle cx="18" cy="6" r="2" />
                        <path d="M8 16l8-8" />
                    </svg>
                );
            case 'spark':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
                        <path d="M12 3l1.8 4.7L18 9.5l-4.2 1.8L12 16l-1.8-4.7L6 9.5l4.2-1.8L12 3z" />
                        <path d="M19 15l.8 2 .2.2 2 .8-2 .8-.2.2-.8 2-.8-2-.2-.2-2-.8 2-.8.2-.2.8-2z" />
                    </svg>
                );
            case 'book':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
                        <path d="M4 5.5A2.5 2.5 0 016.5 3H20v16H6.5A2.5 2.5 0 004 21V5.5z" />
                        <path d="M8 7h8" />
                    </svg>
                );
            case 'portfolio':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
                        <path d="M3 7h18v12H3z" />
                        <path d="M9 7V5h6v2" />
                    </svg>
                );
            case 'settings':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1 1 0 00.2 1.1l.1.1a2 2 0 010 2.8l-.1.1a2 2 0 01-2.8 0l-.1-.1a1 1 0 00-1.1-.2 1 1 0 00-.6.9V20a2 2 0 01-2 2h-.2a2 2 0 01-2-2v-.2a1 1 0 00-.6-.9 1 1 0 00-1.1.2l-.1.1a2 2 0 01-2.8 0l-.1-.1a2 2 0 010-2.8l.1-.1a1 1 0 00.2-1.1 1 1 0 00-.9-.6H4a2 2 0 01-2-2v-.2a2 2 0 012-2h.2a1 1 0 00.9-.6 1 1 0 00-.2-1.1l-.1-.1a2 2 0 010-2.8l.1-.1a2 2 0 012.8 0l.1.1a1 1 0 001.1.2H9a1 1 0 00.6-.9V4a2 2 0 012-2h.2a2 2 0 012 2v.2a1 1 0 00.6.9 1 1 0 001.1-.2l.1-.1a2 2 0 012.8 0l.1.1a2 2 0 010 2.8l-.1.1a1 1 0 00-.2 1.1V9c0 .4.2.7.6.9H20a2 2 0 012 2v.2a2 2 0 01-2 2h-.2a1 1 0 00-.9.6z" />
                    </svg>
                );
            default:
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
                        <circle cx="12" cy="12" r="9" />
                    </svg>
                );
        }
    };

    const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

    const sidebarContent = (
        <div className="h-full w-[240px] bg-[#f8f9fb] border-r border-[#e6e8ee] flex flex-col">
            <div className="px-6 py-6 border-b border-[#e6e8ee] flex items-center justify-between">
                <h1 className="text-3xl leading-none font-bold text-black">SkillTrack</h1>
                <button className="h-8 w-8 rounded-lg border border-[#d8dce5] text-[#111827] text-sm">▢</button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
                {menuGroups.map((group) => (
                    <div key={group.title} className="mb-6">
                        <p className="px-3 mb-2 text-sm text-[#6b7280]">{group.title}</p>
                        <div className="space-y-1">
                            {group.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onClose}
                                    className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition ${isActive(item.href)
                                        ? 'bg-[#eff1f5] text-black font-semibold'
                                        : 'text-[#111827] hover:bg-[#f1f3f8]'
                                        }`}
                                >
                                    {icon(item.icon)}
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="border-t border-[#e6e8ee] p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-[#1f2937] text-white flex items-center justify-center text-lg">
                        {(user?.firstName?.[0] || 'U').toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-[#111827]">{user?.firstName || 'User'}</p>
                        <p className="text-sm text-[#6b7280]">{activityMeta.xp} XP · Niveau {activityMeta.level}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full rounded-xl border border-[#d7dbe4] bg-white text-[#111827] py-2 text-sm font-medium hover:bg-[#f3f4f6]"
                >
                    Déconnexion
                </button>
            </div>
        </div>
    );

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}
            <aside
                className={`fixed left-0 top-0 h-screen z-50 transform transition-transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {sidebarContent}
            </aside>
        </>
    );
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
    const [isSidebarOpen, setSidebarOpen] = React.useState(false);
    const [isChatOpen, setChatOpen] = React.useState(false);
    const [chatPreferences, setChatPreferences] = React.useState<ChatPreferences>(() =>
        loadChatPreferences()
    );

    React.useEffect(() => {
        saveChatPreferences(chatPreferences);
    }, [chatPreferences]);

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    const toggleChat = () => {
        setChatOpen(!isChatOpen);
    };

    return (
        <div className="min-h-screen bg-[#f5f6f8]">
            <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
            <div className="min-h-screen lg:ml-[240px] px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
                <button
                    type="button"
                    className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8dce5] bg-white text-[#111827] lg:hidden"
                    onClick={toggleSidebar}
                    aria-label="Open navigation sidebar"
                >
                    ☰
                </button>
                {children}
            </div>
            <ChatbotIcon onClick={toggleChat} preferences={chatPreferences} />
            <Chatbot
                isOpen={isChatOpen}
                onClose={toggleChat}
                preferences={chatPreferences}
                onPreferencesChange={setChatPreferences}
            />
        </div>
    );
};
