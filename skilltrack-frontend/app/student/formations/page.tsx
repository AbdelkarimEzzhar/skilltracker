'use client';

import React from 'react';
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
import { studentApi } from '@/lib/api';

interface Recommendation {
    _id: string;
    title: string;
    description: string;
    reason: string;
    type: 'Course' | 'Certification' | 'Book' | 'Project' | 'CareerPath';
    status: 'Active' | 'Completed' | 'Ignored';
    priority: 'High' | 'Medium' | 'Low';
    estimatedHours: number;
    progressPercent: number;
    link?: string;
}

const formationTypes = new Set(['Course', 'Certification', 'Book']);

export default function StudentFormationsPage() {
    const [loading, setLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);
    const [recommendations, setRecommendations] = React.useState<Recommendation[]>([]);
    const [studyHours, setStudyHours] = React.useState(0);

    const fetchData = React.useCallback(async () => {
        try {
            const [recommendationsRes, dashboardRes] = await Promise.all([
                studentApi.getRecommendations({ limit: 200 }),
                studentApi.getDashboard(),
            ]);

            setRecommendations(recommendationsRes.data?.data?.recommendations || []);
            setStudyHours(Number(dashboardRes.data?.data?.profile?.totalHours || 0));
        } catch (error) {
            setRecommendations([]);
            setStudyHours(0);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefreshFormations = async () => {
        setRefreshing(true);
        try {
            await studentApi.generateRecommendations();
            await fetchData();
        } finally {
            setRefreshing(false);
        }
    };

    const formations = recommendations.filter((item) => formationTypes.has(item.type));
    const active = formations.filter((item) => item.status === 'Active');
    const completed = formations.filter((item) => item.status === 'Completed');
    const ignored = formations.filter((item) => item.status === 'Ignored');
    const completionRate = formations.length ? Math.round((completed.length / formations.length) * 100) : 0;
    const avgProgress = active.length
        ? Math.round(active.reduce((sum, item) => sum + Number(item.progressPercent || 0), 0) / active.length)
        : 0;

    const donutCompleted = formations.length ? (completed.length / formations.length) * 360 : 0;
    const donutActive = formations.length ? (active.length / formations.length) * 360 : 0;
    const donutIgnored = 360 - donutCompleted - donutActive;

    const donutStyle = {
        background: `conic-gradient(#111827 0deg ${donutCompleted}deg, #1d4ed8 ${donutCompleted}deg ${donutCompleted + donutActive}deg, #e5e7eb ${donutCompleted + donutActive}deg ${donutCompleted + donutActive + donutIgnored}deg)`,
    };

    const colorForType = (type: Recommendation['type']) => {
        if (type === 'Course') return 'from-[#0e7490] to-[#0ea5e9]';
        if (type === 'Certification') return 'from-[#059669] to-[#14b8a6]';
        return 'from-[#475569] to-[#64748b]';
    };

    return (
        <ProtectedRoute requiredRole="STUDENT">
            <Layout>
                <div className="max-w-[1600px] mx-auto space-y-6">
                    <SectionTitle
                        title="Mes formations"
                        subtitle="Suivez vos cours et formations en cours"
                        actions={
                            <>
                                <ActionButton icon={<span>⌕</span>}>Filtrer</ActionButton>
                                <ActionButton variant="primary" icon={<span>＋</span>} onClick={handleRefreshFormations} disabled={refreshing}>
                                    {refreshing ? 'Actualisation...' : 'Actualiser les formations'}
                                </ActionButton>
                            </>
                        }
                    />

                    {loading ? (
                        <SurfaceCard className="p-6">
                            <p className="text-[#4b5563] text-lg">Chargement des formations...</p>
                        </SurfaceCard>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                                <MiniStatCard
                                    icon="▭"
                                    iconClassName="bg-[#e0e7ff] text-[#1d4ed8]"
                                    value={String(active.length)}
                                    label="formations actives"
                                />
                                <MiniStatCard
                                    icon="◔"
                                    iconClassName="bg-[#dcfce7] text-[#16a34a]"
                                    value={`${studyHours}h`}
                                    label="heures d'apprentissage"
                                />
                                <MiniStatCard
                                    icon="◉"
                                    iconClassName="bg-[#fef3c7] text-[#d97706]"
                                    value={String(completed.length)}
                                    label="formations terminees"
                                />
                                <MiniStatCard
                                    icon="◎"
                                    iconClassName="bg-[#f3e8ff] text-[#9333ea]"
                                    value={`${avgProgress}%`}
                                    label="progression moyenne"
                                />
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                                <SurfaceCard className="p-6 xl:col-span-3">
                                    <h2 className="text-lg font-bold text-black">Formations en cours</h2>
                                    <p className="mt-1 text-lg text-[#6b7280]">Continuez la ou vous vous etes arrete</p>

                                    <div className="mt-5 space-y-4">
                                        {active.map((course) => (
                                            <SurfaceCard key={course._id} className="p-4 border-[#e8ebf2]">
                                                <div className="flex flex-col lg:flex-row gap-4">
                                                    <div className={`w-full lg:w-40 h-32 rounded-2xl bg-gradient-to-br ${colorForType(course.type)} text-white p-3 flex items-end`}>
                                                        <p className="text-lg font-bold uppercase tracking-wide">{course.type}</p>
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <h3 className="text-lg font-bold text-black">{course.title}</h3>
                                                                <p className="text-lg text-[#6b7280] mt-1">{course.description}</p>
                                                                <p className="text-lg text-[#4b5563] mt-2">{course.reason}</p>
                                                            </div>
                                                            <Pill className="bg-[#f3f4f6] text-[#111827]">{course.progressPercent || 0}%</Pill>
                                                        </div>

                                                        <ProgressBar value={course.progressPercent || 0} className="mt-3" />
                                                        <div className="mt-2 flex items-center justify-between text-xl text-[#6b7280]">
                                                            <span>{course.estimatedHours}h estimees</span>
                                                            <span>Priorite {course.priority}</span>
                                                        </div>

                                                        <ActionButton
                                                            variant="primary"
                                                            className="mt-3"
                                                            icon={<span>▻</span>}
                                                            onClick={() => course.link && window.open(course.link, '_blank', 'noopener,noreferrer')}
                                                            disabled={!course.link}
                                                        >
                                                            Continuer
                                                        </ActionButton>
                                                    </div>
                                                </div>
                                            </SurfaceCard>
                                        ))}

                                        {active.length === 0 ? (
                                            <SurfaceCard className="p-5">
                                                <p className="text-[#6b7280] text-lg">Aucune formation active.</p>
                                            </SurfaceCard>
                                        ) : null}
                                    </div>
                                </SurfaceCard>

                                <SurfaceCard className="p-6 xl:col-span-2 h-fit">
                                    <h3 className="text-lg font-bold text-black">Apercu global</h3>
                                    <p className="mt-1 text-lg text-[#6b7280]">Repartition de vos formations</p>

                                    <div className="mt-6 flex justify-center">
                                        <div className="h-48 w-48 rounded-full" style={donutStyle}>
                                            <div className="h-full w-full scale-[0.72] rounded-full bg-white" />
                                        </div>
                                    </div>

                                    <div className="mt-5 space-y-2 text-lg text-[#111827]">
                                        <div className="flex justify-between"><span>Completees</span><span>{completed.length}</span></div>
                                        <div className="flex justify-between"><span>En cours</span><span>{active.length}</span></div>
                                        <div className="flex justify-between"><span>Ignorees</span><span>{ignored.length}</span></div>
                                    </div>

                                    <div className="mt-5 pt-5 border-t border-[#e6e8ee] text-center">
                                        <p className="text-lg font-bold text-black">{completionRate}%</p>
                                        <p className="text-lg text-[#6b7280]">Taux de completion</p>
                                    </div>
                                </SurfaceCard>
                            </div>
                        </>
                    )}
                </div>
            </Layout>
        </ProtectedRoute>
    );
}
