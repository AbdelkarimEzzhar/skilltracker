'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import {
    ActionButton,
    MiniStatCard,
    Pill,
    SectionTitle,
    SurfaceCard,
} from '@/components/student/DesignSystem';
import { studentApi } from '@/lib/api';
import { downloadPortfolioJson } from '@/lib/portfolioExport';

interface Recommendation {
    _id: string;
    type: 'Course' | 'Certification' | 'Book' | 'Project' | 'CareerPath';
    title: string;
    description: string;
    reason: string;
    link?: string;
    status: 'Active' | 'Completed' | 'Ignored';
    priority: 'High' | 'Medium' | 'Low';
    createdAt: string;
    estimatedHours?: number;
    progressPercent?: number;
}

interface SkillItem {
    _id: string;
    status: string;
    progressPercentage?: number;
    confidenceScore?: number;
    competenceId?: { name?: string; code?: string };
}

interface AchievementItem {
    _id: string;
    title: string;
    description?: string;
    category?: string;
    rarity?: string;
    points?: number;
    unlockedAt?: string;
}

const skillProgress = (skill: SkillItem) =>
    Math.max(0, Math.min(100, Number(skill.progressPercentage ?? skill.confidenceScore ?? 0)));

export default function StudentPortfolioPage() {
    const [loading, setLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);
    const [recommendations, setRecommendations] = React.useState<Recommendation[]>([]);
    const [skills, setSkills] = React.useState<SkillItem[]>([]);
    const [achievements, setAchievements] = React.useState<AchievementItem[]>([]);

    const fetchData = React.useCallback(async () => {
        try {
            const [recommendationsRes, skillsRes, achievementsRes] = await Promise.all([
                studentApi.getRecommendations({ limit: 300, status: 'Completed' }),
                studentApi.getSkills({ limit: 300 }),
                studentApi.getAchievements({ limit: 200 }),
            ]);

            setRecommendations(recommendationsRes.data?.data?.recommendations || []);
            setSkills(skillsRes.data?.data?.skills || []);
            setAchievements(achievementsRes.data?.data?.achievements || []);
        } catch {
            setRecommendations([]);
            setSkills([]);
            setAchievements([]);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = async () => {
        setRefreshing(true);
        setLoading(true);
        try {
            await fetchData();
        } finally {
            setRefreshing(false);
        }
    };

    const handleExport = () => {
        const completedProjects = recommendations.filter(
            (item) => item.status === 'Completed' && (item.type === 'Project' || item.type === 'CareerPath')
        );
        const completedCertifications = recommendations.filter(
            (item) => item.status === 'Completed' && item.type === 'Certification'
        );
        const payload = {
            exportedAt: new Date().toISOString(),
            projects: completedProjects,
            certifications: completedCertifications,
            skills: skills.map((s) => ({
                name: s.competenceId?.name,
                code: s.competenceId?.code,
                status: s.status,
                progress: skillProgress(s),
            })),
            achievements,
        };
        downloadPortfolioJson(`skilltrack-portfolio-${new Date().toISOString().slice(0, 10)}.json`, payload);
    };

    const completedProjects = recommendations.filter(
        (item) => item.status === 'Completed' && (item.type === 'Project' || item.type === 'CareerPath')
    );
    const completedCertifications = recommendations.filter(
        (item) => item.status === 'Completed' && item.type === 'Certification'
    );
    const masteredSkills = skills.filter((skill) => skillProgress(skill) >= 80).length;
    const averageProgress = skills.length
        ? Math.round(skills.reduce((sum, skill) => sum + skillProgress(skill), 0) / skills.length)
        : 0;
    const portfolioScore = skills.length ? (averageProgress / 20).toFixed(1) : '0.0';

    return (
        <ProtectedRoute requiredRole="STUDENT">
            <Layout>
                <div className="max-w-[1600px] mx-auto space-y-6">
                    <SectionTitle
                        title="Mon portfolio"
                        subtitle="Vos realisations validees (projets et certifications termines)"
                        actions={
                            <>
                                <ActionButton icon={<span>⇩</span>} onClick={handleExport} disabled={loading}>
                                    Exporter
                                </ActionButton>
                                <ActionButton
                                    variant="primary"
                                    icon={<span>↻</span>}
                                    onClick={handleRefresh}
                                    disabled={refreshing || loading}
                                >
                                    {refreshing ? 'Actualisation...' : 'Actualiser'}
                                </ActionButton>
                            </>
                        }
                    />

                    {loading ? (
                        <SurfaceCard className="p-6">
                            <p className="text-[#4b5563] text-lg">Chargement du portfolio...</p>
                        </SurfaceCard>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                                <MiniStatCard
                                    icon="▣"
                                    iconClassName="bg-[#e0e7ff] text-[#1d4ed8]"
                                    value={String(completedProjects.length)}
                                    label="projets termines"
                                />
                                <MiniStatCard
                                    icon="◉"
                                    iconClassName="bg-[#dcfce7] text-[#16a34a]"
                                    value={String(completedCertifications.length)}
                                    label="certifications obtenues"
                                />
                                <MiniStatCard
                                    icon="⌛"
                                    iconClassName="bg-[#fef3c7] text-[#d97706]"
                                    value={String(achievements.length)}
                                    label="badges"
                                />
                                <MiniStatCard
                                    icon="☆"
                                    iconClassName="bg-[#f3e8ff] text-[#9333ea]"
                                    value={`${portfolioScore}/5`}
                                    label="score competences"
                                />
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                                <SurfaceCard className="p-6 xl:col-span-3">
                                    <h2 className="text-lg font-bold text-black">Mes projets</h2>
                                    <p className="mt-1 text-lg text-[#6b7280]">
                                        Uniquement les projets que vous avez termines
                                    </p>

                                    <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {completedProjects.map((project) => (
                                            <SurfaceCard key={project._id} className="overflow-hidden border-[#e8ebf2]">
                                                <div className="h-24 bg-[#eceff4] px-4 py-3 flex items-start justify-between">
                                                    <p className="text-lg font-semibold text-black line-clamp-2">
                                                        {project.title}
                                                    </p>
                                                    <Pill className="bg-[#d1fae5] text-[#059669]">Termine</Pill>
                                                </div>

                                                <div className="p-4">
                                                    <p className="text-lg text-[#4b5563] leading-relaxed line-clamp-3">
                                                        {project.description}
                                                    </p>

                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <Pill className="bg-[#f3f4f6] text-[#111827]">{project.type}</Pill>
                                                        <Pill className="bg-[#eef2ff] text-[#1d4ed8]">{project.priority}</Pill>
                                                        <Pill className="bg-[#f3f4f6] text-[#111827]">
                                                            {project.estimatedHours || 0}h
                                                        </Pill>
                                                    </div>

                                                    <div className="mt-4 pt-4 border-t border-[#e6e8ee] flex items-center justify-between text-lg text-[#6b7280]">
                                                        <span>{new Date(project.createdAt).toLocaleDateString('fr-FR')}</span>
                                                        {project.link ? (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    window.open(project.link, '_blank', 'noopener,noreferrer')
                                                                }
                                                                className="h-10 px-3 rounded-xl border border-[#d7dbe4] text-sm font-semibold"
                                                            >
                                                                Voir le projet
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </SurfaceCard>
                                        ))}

                                        {completedProjects.length === 0 ? (
                                            <SurfaceCard className="p-5 lg:col-span-2">
                                                <p className="text-[#6b7280] text-lg">
                                                    Aucun projet termine. Validez une recommandation de type projet dans
                                                    Recommandations IA pour l&apos;ajouter ici.
                                                </p>
                                            </SurfaceCard>
                                        ) : null}
                                    </div>
                                </SurfaceCard>

                                <SurfaceCard className="p-6 xl:col-span-2 h-fit">
                                    <h3 className="text-lg font-bold text-black">Certifications</h3>
                                    <p className="mt-1 text-lg text-[#6b7280]">Certifications terminees uniquement</p>

                                    <div className="mt-5 space-y-3">
                                        {completedCertifications.map((cert) => (
                                            <div key={cert._id} className="rounded-2xl border border-[#e6e8ee] p-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="text-lg font-bold text-black">{cert.title}</p>
                                                        <p className="mt-1 text-lg text-[#6b7280] line-clamp-2">
                                                            {cert.description}
                                                        </p>
                                                    </div>
                                                    <Pill className="bg-[#d1fae5] text-[#059669]">Termine</Pill>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-[#e6e8ee] flex items-center justify-between text-lg text-[#6b7280]">
                                                    <span>{new Date(cert.createdAt).toLocaleDateString('fr-FR')}</span>
                                                    <span>{cert.priority}</span>
                                                </div>
                                            </div>
                                        ))}

                                        {completedCertifications.length === 0 ? (
                                            <p className="text-[#6b7280] text-lg">
                                                Aucune certification terminee. Marquez une formation comme terminee dans
                                                Recommandations IA.
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="mt-6 pt-5 border-t border-[#e6e8ee] space-y-2 text-lg">
                                        <div className="flex justify-between text-[#111827]">
                                            <span>Competences suivies</span>
                                            <span>{skills.length}</span>
                                        </div>
                                        <div className="flex justify-between text-[#111827]">
                                            <span>Competences maitrisees (&ge;80%)</span>
                                            <span>{masteredSkills}</span>
                                        </div>
                                        <div className="flex justify-between text-[#111827]">
                                            <span>Progression moyenne</span>
                                            <span>{averageProgress}%</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-5 border-t border-[#e6e8ee]">
                                        <h4 className="text-lg font-bold text-black">Badges recents</h4>
                                        <div className="mt-3 space-y-2">
                                            {achievements.slice(0, 4).map((achievement) => (
                                                <div key={achievement._id} className="rounded-xl border border-[#e6e8ee] px-3 py-2">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="text-lg font-semibold text-black">{achievement.title}</p>
                                                        <Pill className="bg-[#fef3c7] text-[#b45309]">
                                                            {achievement.rarity || 'Badge'}
                                                        </Pill>
                                                    </div>
                                                    <p className="mt-1 text-xl text-[#6b7280]">
                                                        {achievement.category || 'Categorie libre'}
                                                    </p>
                                                </div>
                                            ))}

                                            {achievements.length === 0 ? (
                                                <p className="text-[#6b7280] text-lg">Aucun badge debloque pour le moment.</p>
                                            ) : null}
                                        </div>
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
