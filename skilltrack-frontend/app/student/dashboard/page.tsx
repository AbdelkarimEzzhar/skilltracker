'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import {
    ActionButton,
    MiniStatCard,
    Pill,
    ProgressBar,
    SectionTitle,
    SurfaceCard,
} from '@/components/student/DesignSystem';
import { useAuthStore } from '@/lib/store';
import { studentApi } from '@/lib/api';

interface DashboardPayload {
    profile: {
        level?: number;
        experiencePoints?: number;
        currentStreakDays?: number;
        totalHours?: number;
        activityHistory?: Array<{ date: string; pointsEarned?: number }>;
    } | null;
    skills: {
        total: number;
        mastered: number;
        inProgress: number;
    };
    goals: {
        active: number;
        completed: number;
    };
}

interface StudentSkill {
    _id: string;
    competenceId: {
        domain?: string;
        name?: string;
    };
    progressPercentage?: number;
    confidenceScore?: number;
}

const defaultDashboard: DashboardPayload = {
    profile: null,
    skills: { total: 0, mastered: 0, inProgress: 0 },
    goals: { active: 0, completed: 0 },
};

export default function StudentDashboardPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [loading, setLoading] = React.useState(true);
    const [dashboard, setDashboard] = React.useState<DashboardPayload>(defaultDashboard);
    const [skills, setSkills] = React.useState<StudentSkill[]>([]);
    const [activeRecommendations, setActiveRecommendations] = React.useState(0);
    const [progressView, setProgressView] = React.useState<'weekly' | 'domain'>('weekly');

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [dashboardRes, recommendationsRes, skillsRes] = await Promise.all([
                    studentApi.getDashboard(),
                    studentApi.getRecommendations({ status: 'Active', limit: 100 }),
                    studentApi.getSkills({ limit: 300 }),
                ]);

                setDashboard(dashboardRes.data?.data || defaultDashboard);
                setSkills(skillsRes.data?.data?.skills || []);
                const recs = recommendationsRes.data?.data?.recommendations || [];
                setActiveRecommendations(recs.length);
            } catch (error) {
                setDashboard(defaultDashboard);
                setSkills([]);
                setActiveRecommendations(0);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const displayName = user?.firstName || 'User';
    const profile = dashboard.profile;
    const level = Math.max(1, Number(profile?.level || 1));
    const experiencePoints = Math.max(0, Number(profile?.experiencePoints || 0));
    const streakDays = Math.max(0, Number(profile?.currentStreakDays || 0));
    const totalHours = Math.max(0, Number(profile?.totalHours || 0));

    const xpForCurrentLevel = (level - 1) * 100;
    const xpForNextLevel = level * 100;
    const xpInLevel = Math.max(0, experiencePoints - xpForCurrentLevel);
    const xpRange = Math.max(1, xpForNextLevel - xpForCurrentLevel);
    const xpProgress = Math.min(100, Math.round((xpInLevel / xpRange) * 100));
    const xpRemaining = Math.max(0, xpForNextLevel - experiencePoints);

    const goalsTotal = dashboard.goals.active + dashboard.goals.completed;
    const globalProgress = dashboard.skills.total
        ? Math.round((dashboard.skills.mastered / dashboard.skills.total) * 100)
        : 0;

    const weeklyPoints = React.useMemo(() => {
        const history = profile?.activityHistory || [];
        const map = new Map<string, number>();

        history.forEach((item) => {
            const key = new Date(item.date).toISOString().slice(0, 10);
            map.set(key, (map.get(key) || 0) + Number(item.pointsEarned || 0));
        });

        const days: number[] = [];
        for (let i = 6; i >= 0; i -= 1) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const key = date.toISOString().slice(0, 10);
            days.push(map.get(key) || 0);
        }

        return days;
    }, [profile?.activityHistory]);

    const weeklyActiveDays = weeklyPoints.filter((point) => point > 0).length;
    const maxPoints = Math.max(1, ...weeklyPoints);

    const chartDots = weeklyPoints.map((point, index) => ({
        left: `${8 + index * 12}%`,
        bottom: `${14 + Math.round((point / maxPoints) * 68)}%`,
    }));

    const domainProgress = React.useMemo(() => {
        const map = new Map<string, { total: number; count: number }>();

        skills.forEach((skill) => {
            const domain = (skill.competenceId?.domain || 'Autres').trim() || 'Autres';
            const progress = Math.max(0, Math.min(100, Number(skill.progressPercentage ?? skill.confidenceScore ?? 0)));
            const current = map.get(domain) || { total: 0, count: 0 };
            map.set(domain, { total: current.total + progress, count: current.count + 1 });
        });

        return [...map.entries()]
            .map(([domain, values]) => ({
                domain,
                average: values.count ? Math.round(values.total / values.count) : 0,
                count: values.count,
            }))
            .sort((a, b) => b.average - a.average)
            .slice(0, 6);
    }, [skills]);

    return (
        <ProtectedRoute requiredRole="STUDENT">
            <Layout>
                <div className="max-w-[1600px] mx-auto space-y-6">
                    <SectionTitle
                        title={`Bonjour, ${displayName}`}
                        subtitle="Voici un apercu de votre progression aujourd'hui"
                        actions={
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="h-11 w-full sm:w-[320px] rounded-2xl border border-[#d7dbe4] bg-white px-4 flex items-center gap-3 text-sm text-[#6b7280]">
                                    <span aria-hidden>⌕</span>
                                    <span>Rechercher...</span>
                                </div>
                                <button className="relative h-11 w-11 rounded-2xl border border-[#d7dbe4] bg-white text-[#111827] text-base">
                                    ⌁
                                    <span className="absolute -right-1 -top-1 h-5 min-w-5 px-1 rounded-full bg-[#1d4ed8] text-white text-[11px] font-semibold leading-5">
                                        {activeRecommendations}
                                    </span>
                                </button>
                            </div>
                        }
                    />

                    {loading ? (
                        <SurfaceCard className="p-6">
                            <p className="text-[#4b5563] text-base">Chargement des donnees...</p>
                        </SurfaceCard>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                                <SurfaceCard className="p-6 xl:col-span-3">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-11 w-11 rounded-full bg-[#e0e7ff] text-[#1d4ed8] text-lg flex items-center justify-center">
                                                🏆
                                            </div>
                                            <div>
                                                <p className="text-xl font-bold text-black">Niveau {level}</p>
                                                <p className="text-sm text-[#6b7280]">Progression de niveau</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-black">{experiencePoints} XP</p>
                                            <p className="text-sm text-[#6b7280]">{xpRemaining} pour niveau {level + 1}</p>
                                        </div>
                                    </div>

                                    <div className="mt-5">
                                        <ProgressBar value={xpProgress} className="h-3.5" />
                                    </div>
                                </SurfaceCard>

                                <SurfaceCard className="p-6 xl:col-span-2 bg-[#faf4e7] border-[#eee1cb]">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="h-11 w-11 rounded-full bg-[#fde9bf] text-[#d97706] text-lg flex items-center justify-center">
                                            🔥
                                        </div>
                                        <div>
                                            <p className="text-lg leading-none font-bold text-black">{streakDays}</p>
                                            <p className="text-base text-[#4b5563]">jours de serie</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-7 gap-1.5">
                                        {weeklyPoints.map((point, index) => (
                                            <div
                                                key={index}
                                                className={`h-2.5 rounded-full ${point > 0 ? 'bg-[#ea8c00]' : 'bg-[#f4e6c4]'}`}
                                            />
                                        ))}
                                    </div>
                                    <p className="mt-3 text-sm text-[#6b7280]">Cette semaine: {weeklyActiveDays}/7 jours</p>
                                </SurfaceCard>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                                <MiniStatCard
                                    icon="◉"
                                    iconClassName="bg-[#e0e7ff] text-[#1d4ed8]"
                                    value={String(dashboard.skills.mastered)}
                                    label="Competences acquises"
                                    badge={<Pill className="bg-[#eef2ff] text-[#1d4ed8]">{dashboard.skills.inProgress} en cours</Pill>}
                                />
                                <MiniStatCard
                                    icon="↗"
                                    iconClassName="bg-[#dcfce7] text-[#16a34a]"
                                    value={`${globalProgress}%`}
                                    label="Progression globale"
                                    badge={<Pill className="bg-[#d1fae5] text-[#059669]">{dashboard.skills.total} au total</Pill>}
                                />
                                <MiniStatCard
                                    icon="◎"
                                    iconClassName="bg-[#fef3c7] text-[#d97706]"
                                    value={`${dashboard.goals.completed}/${goalsTotal}`}
                                    label="Objectifs atteints"
                                    badge={<Pill className="bg-[#eef2ff] text-[#6b7280]">{dashboard.goals.active} actifs</Pill>}
                                />
                                <MiniStatCard
                                    icon="⚡"
                                    iconClassName="bg-[#f3e8ff] text-[#9333ea]"
                                    value={`${totalHours}h`}
                                    label="Heures d'apprentissage"
                                    badge={<Pill className="bg-[#eef2ff] text-[#6b7280]">Temps cumule</Pill>}
                                />
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                                <SurfaceCard className="p-6 xl:col-span-3">
                                    <h2 className="text-lg font-bold text-black">Apercu de votre progression</h2>
                                    <p className="mt-1 text-base text-[#6b7280]">Visualisez votre evolution cette semaine</p>

                                    <div className="mt-6 rounded-2xl bg-[#eceff4] p-1 grid grid-cols-2 text-center text-sm font-semibold text-[#111827]">
                                        <button
                                            onClick={() => setProgressView('weekly')}
                                            className={`rounded-xl py-2 transition ${progressView === 'weekly' ? 'bg-white shadow-sm' : ''}`}
                                        >
                                            Activite hebdomadaire
                                        </button>
                                        <button
                                            onClick={() => setProgressView('domain')}
                                            className={`rounded-xl py-2 transition ${progressView === 'domain' ? 'bg-white shadow-sm' : ''}`}
                                        >
                                            Competences par domaine
                                        </button>
                                    </div>

                                    {progressView === 'weekly' ? (
                                        <div className="mt-6 h-[320px] rounded-2xl border border-[#eef0f5] bg-white relative overflow-hidden">
                                            {[2, 4, 6, 8].map((tick, i) => (
                                                <div key={tick} className="absolute left-0 right-0 border-t border-[#f2f4f8]" style={{ top: `${(i + 1) * 20}%` }}>
                                                    <span className="absolute -left-1 -translate-x-full -translate-y-1/2 text-xs text-[#9ca3af]">
                                                        {10 - tick}
                                                    </span>
                                                </div>
                                            ))}
                                            {chartDots.map((dot, index) => (
                                                <span
                                                    key={index}
                                                    className="absolute h-3 w-3 rounded-full bg-black"
                                                    style={{ left: dot.left, bottom: dot.bottom }}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-6 rounded-2xl border border-[#eef0f5] bg-white p-5 space-y-4 min-h-[320px]">
                                            {domainProgress.map((item) => (
                                                <div key={item.domain}>
                                                    <div className="flex items-center justify-between text-sm mb-1.5">
                                                        <p className="font-medium text-black">{item.domain}</p>
                                                        <p className="text-[#6b7280]">{item.average}% ({item.count})</p>
                                                    </div>
                                                    <ProgressBar value={item.average} />
                                                </div>
                                            ))}
                                            {domainProgress.length === 0 ? (
                                                <p className="text-sm text-[#6b7280]">Aucune donnee de domaine disponible.</p>
                                            ) : null}
                                        </div>
                                    )}
                                </SurfaceCard>

                                <div className="xl:col-span-2 space-y-5">
                                    <SurfaceCard className="p-6">
                                        <h3 className="text-lg font-bold text-black">Actions rapides</h3>
                                        <div className="mt-5 space-y-3">
                                            <ActionButton className="w-full justify-start" onClick={() => router.push('/student/skills')}>
                                                ◌ Ajouter une competence
                                            </ActionButton>
                                            <ActionButton className="w-full justify-start" onClick={() => router.push('/student/roadmap')}>
                                                ◎ Definir un objectif
                                            </ActionButton>
                                            <ActionButton className="w-full justify-start" onClick={() => router.push('/student/formations')}>
                                                ▭ Explorer les formations
                                            </ActionButton>
                                        </div>
                                    </SurfaceCard>

                                    <SurfaceCard className="p-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-bold text-black">Defis quotidiens</h3>
                                            <Pill className="bg-[#eef2ff] text-[#374151]">Mis a jour en direct</Pill>
                                        </div>
                                        <p className="mt-2 text-base text-[#6b7280]">Synthese basee sur vos vraies donnees</p>

                                        <div className="mt-5 space-y-3 text-sm">
                                            <div className="flex items-center justify-between rounded-2xl border border-[#e6e8ee] px-4 py-3">
                                                <span className="text-[#111827]">Objectifs actifs</span>
                                                <Pill className="bg-[#dbeafe] text-[#1d4ed8]">{dashboard.goals.active}</Pill>
                                            </div>
                                            <div className="flex items-center justify-between rounded-2xl border border-[#e6e8ee] px-4 py-3">
                                                <span className="text-[#111827]">Competences en progression</span>
                                                <Pill className="bg-[#fef3c7] text-[#b45309]">{dashboard.skills.inProgress}</Pill>
                                            </div>
                                            <div className="flex items-center justify-between rounded-2xl border border-[#e6e8ee] px-4 py-3">
                                                <span className="text-[#111827]">Recommandations actives</span>
                                                <Pill className="bg-[#d1fae5] text-[#059669]">{activeRecommendations}</Pill>
                                            </div>
                                        </div>
                                    </SurfaceCard>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </Layout>
        </ProtectedRoute>
    );
}
