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
    type: 'Course' | 'Certification' | 'Book' | 'Project' | 'CareerPath';
    title: string;
    description: string;
    link?: string;
    priority: 'High' | 'Medium' | 'Low';
    estimatedHours: number;
    reason: string;
    status: 'Active' | 'Completed' | 'Ignored';
    progressPercent: number;
    createdAt: string;
    aiProbability?: number;
}

const priorityClass = (priority: Recommendation['priority']) => {
    if (priority === 'High') return 'bg-[#fee2e2] text-[#b91c1c]';
    if (priority === 'Medium') return 'bg-[#fef3c7] text-[#b45309]';
    return 'bg-[#d1fae5] text-[#059669]';
};

const sourceColor = (type: Recommendation['type']) => {
    if (type === 'Course') return 'from-[#0e7490] to-[#0ea5e9]';
    if (type === 'Certification') return 'from-[#059669] to-[#14b8a6]';
    if (type === 'Project') return 'from-[#1d4ed8] to-[#2563eb]';
    if (type === 'CareerPath') return 'from-[#7c3aed] to-[#9333ea]';
    return 'from-[#64748b] to-[#94a3b8]';
};

const extractKeywords = (items: Recommendation[]) => {
    const stop = new Set(['and', 'for', 'with', 'the', 'des', 'les', 'pour', 'sur', 'dans', 'your', 'vous']);
    const map = new Map<string, number>();

    items.forEach((item) => {
        const text = `${item.title} ${item.reason}`.toLowerCase();
        text
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter((word) => word.length > 3 && !stop.has(word))
            .forEach((word) => map.set(word, (map.get(word) || 0) + 1));
    });

    return [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
};

export default function RecommendationsPage() {
    const [loading, setLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);
    const [recommendations, setRecommendations] = React.useState<Recommendation[]>([]);

    const fetchRecommendations = React.useCallback(async () => {
        try {
            const response = await studentApi.getRecommendations({ limit: 80, sort: 'priority' });
            setRecommendations(response.data?.data?.recommendations || []);
        } catch (error) {
            setRecommendations([]);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchRecommendations();
    }, [fetchRecommendations]);

    const handleGenerate = async () => {
        setRefreshing(true);
        try {
            await studentApi.trainRecommendationModel();
            await studentApi.generateRecommendations();
            await fetchRecommendations();
        } finally {
            setRefreshing(false);
        }
    };

    const handleComplete = async (id: string) => {
        try {
            await studentApi.completeRecommendation(id);
            await fetchRecommendations();
        } catch (error) {
            // Keep UI stable on API error.
        }
    };

    const handleIgnore = async (id: string) => {
        try {
            await studentApi.ignoreRecommendation(id);
            await fetchRecommendations();
        } catch (error) {
            // Keep UI stable on API error.
        }
    };

    const active = recommendations.filter((item) => item.status === 'Active');
    const completed = recommendations.filter((item) => item.status === 'Completed');
    const urgent = active.filter((item) => item.priority === 'High');
    const courseLike = active.filter((item) => item.type === 'Course' || item.type === 'Certification');
    const trends = extractKeywords(active);
    const suggestedPath = active.slice(0, 3);

    return (
        <ProtectedRoute requiredRole="STUDENT">
            <Layout>
                <div className="max-w-[1600px] mx-auto space-y-6">
                    <SectionTitle
                        title="Recommandations IA"
                        subtitle="Formations et contenus adaptes a votre profil et vos objectifs professionnels"
                        actions={
                            <>
                                <Pill className="bg-[#1d4ed8] text-white">✧ Personnalise</Pill>
                                <ActionButton icon={<span>↻</span>} onClick={handleGenerate} disabled={refreshing}>
                                    {refreshing ? 'Actualisation...' : 'Actualiser'}
                                </ActionButton>
                            </>
                        }
                    />

                    {loading ? (
                        <SurfaceCard className="p-6">
                            <p className="text-[#4b5563] text-lg">Chargement des recommandations...</p>
                        </SurfaceCard>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                                <MiniStatCard
                                    icon="✧"
                                    iconClassName="bg-[#e0e7ff] text-[#1d4ed8]"
                                    value={`${active.length}`}
                                    label="recommandations actives"
                                    note="en cours de suivi"
                                />
                                <MiniStatCard
                                    icon="↗"
                                    iconClassName="bg-[#dcfce7] text-[#16a34a]"
                                    value={`${urgent.length}`}
                                    label="opportunites prioritaires"
                                    note="priorite haute"
                                />
                                <MiniStatCard
                                    icon="◎"
                                    iconClassName="bg-[#fef3c7] text-[#d97706]"
                                    value={`${courseLike.length}`}
                                    label="formations conseillees"
                                    note="cours et certifications"
                                />
                                <MiniStatCard
                                    icon="⚡"
                                    iconClassName="bg-[#f3e8ff] text-[#9333ea]"
                                    value={`${completed.length}`}
                                    label="recommandations completees"
                                    note="historique valide"
                                />
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                                <SurfaceCard className="p-6 xl:col-span-3">
                                    <h2 className="text-lg font-bold text-black">Formations recommandees pour vous</h2>
                                    <p className="mt-1 text-lg text-[#6b7280]">Formations et cours proposes pour atteindre vos objectifs</p>

                                    <div className="mt-5 space-y-4">
                                        {active.slice(0, 8).map((item) => (
                                            <SurfaceCard key={item._id} className="p-4 border-[#e8ebf2]">
                                                <div className="flex flex-col lg:flex-row gap-4">
                                                    <div className={`w-full lg:w-48 h-40 rounded-2xl bg-gradient-to-br ${sourceColor(item.type)} text-white p-3 flex flex-col justify-between`}>
                                                        <Pill className={`self-start ${priorityClass(item.priority)}`}>{item.priority}</Pill>
                                                        <p className="text-lg font-bold uppercase tracking-wide">{item.type}</p>
                                                    </div>

                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-black">{item.title}</h3>
                                                        <p className="mt-1 text-lg text-[#6b7280]">{item.description}</p>

                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            <Pill className="bg-[#f3f4f6] text-[#111827]">{item.estimatedHours}h estimees</Pill>
                                                            <Pill className="bg-[#eef2ff] text-[#1d4ed8]">{item.status}</Pill>
                                                            {typeof item.aiProbability === 'number' ? (
                                                                <Pill className="bg-[#d1fae5] text-[#059669]">AI {(item.aiProbability * 100).toFixed(0)}%</Pill>
                                                            ) : null}
                                                        </div>

                                                        <p className="mt-3 text-lg text-[#4b5563]">Raison: {item.reason}</p>
                                                        <ProgressBar value={item.progressPercent || 0} className="mt-3" />

                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            <ActionButton
                                                                variant="primary"
                                                                onClick={() => item.link && window.open(item.link, '_blank', 'noopener,noreferrer')}
                                                                disabled={!item.link}
                                                            >
                                                                Commencer
                                                            </ActionButton>
                                                            <ActionButton onClick={() => handleComplete(item._id)}>Completer</ActionButton>
                                                            <ActionButton onClick={() => handleIgnore(item._id)}>Ignorer</ActionButton>
                                                        </div>
                                                    </div>
                                                </div>
                                            </SurfaceCard>
                                        ))}

                                        {active.length === 0 ? (
                                            <SurfaceCard className="p-5">
                                                <p className="text-[#6b7280] text-lg">Aucune recommandation active pour le moment.</p>
                                            </SurfaceCard>
                                        ) : null}
                                    </div>
                                </SurfaceCard>

                                <div className="xl:col-span-2 space-y-5">
                                    <SurfaceCard className="p-6">
                                        <h3 className="text-lg font-bold text-black">Competences tendances</h3>
                                        <p className="mt-1 text-lg text-[#6b7280]">Themes les plus presents dans vos recommandations</p>

                                        <div className="mt-5 space-y-5">
                                            {trends.map((trend) => (
                                                <div key={trend.name} className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-lg font-semibold text-black">{trend.name}</p>
                                                        <p className="text-lg text-[#6b7280]">Occurrences dans vos recommandations</p>
                                                    </div>
                                                    <Pill className="bg-[#d1fae5] text-[#059669]">{trend.count} mentions</Pill>
                                                </div>
                                            ))}

                                            {trends.length === 0 ? (
                                                <p className="text-[#6b7280] text-lg">Pas assez de donnees pour extraire une tendance.</p>
                                            ) : null}
                                        </div>
                                    </SurfaceCard>

                                    <SurfaceCard className="p-6">
                                        <h3 className="text-lg font-bold text-black">Parcours conseille</h3>
                                        <p className="mt-1 text-lg text-[#6b7280]">Ordre de cours pour avancer vers vos objectifs</p>

                                        <div className="mt-5 space-y-3">
                                            {suggestedPath.map((item, index) => (
                                                <div key={item._id} className="rounded-2xl border border-[#e6e8ee] px-4 py-3">
                                                    <p className="text-sm text-[#6b7280]">Etape {index + 1}</p>
                                                    <p className="text-lg font-semibold text-black">{item.title}</p>
                                                    <p className="mt-1 text-sm text-[#6b7280]">{item.type} · {item.estimatedHours}h</p>
                                                    <ProgressBar value={item.progressPercent || 0} className="mt-3" />
                                                    <p className="mt-1 text-sm text-[#059669] font-semibold">{item.status}</p>
                                                </div>
                                            ))}

                                            {suggestedPath.length === 0 ? (
                                                <p className="text-[#6b7280] text-lg">Aucun parcours recommande actuellement.</p>
                                            ) : null}
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
