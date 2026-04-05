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
}

interface SkillItem {
    _id: string;
    status: string;
    progressPercentage?: number;
    confidenceScore?: number;
}

interface AchievementItem {
    _id: string;
    title: string;
    description?: string;
    category?: string;
    rarity?: string;
    points?: number;
    unlockedAt?: string;
    icon?: string;
}

const skillProgress = (skill: SkillItem) => Math.max(0, Math.min(100, Number(skill.progressPercentage ?? skill.confidenceScore ?? 0)));

export default function StudentPortfolioPage() {
    const [loading, setLoading] = React.useState(true);
    const [recommendations, setRecommendations] = React.useState<Recommendation[]>([]);
    const [skills, setSkills] = React.useState<SkillItem[]>([]);
    const [achievements, setAchievements] = React.useState<AchievementItem[]>([]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [recommendationsRes, skillsRes, achievementsRes] = await Promise.all([
                    studentApi.getRecommendations({ limit: 300 }),
                    studentApi.getSkills({ limit: 300 }),
                    studentApi.getAchievements({ limit: 200 }),
                ]);

                setRecommendations(recommendationsRes.data?.data?.recommendations || []);
                setSkills(skillsRes.data?.data?.skills || []);
                setAchievements(achievementsRes.data?.data?.achievements || []);
            } catch (error) {
                setRecommendations([]);
                setSkills([]);
                setAchievements([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const projects = recommendations.filter((item) => item.type === 'Project' || item.type === 'CareerPath');
    const certifications = recommendations.filter((item) => item.type === 'Certification');
    const completedRecommendations = recommendations.filter((item) => item.status === 'Completed');
    const verifiedCertifications = certifications.filter((item) => item.status === 'Completed').length;
    const masteredSkills = skills.filter((skill) => (skill.status || '').toLowerCase().includes('master')).length;
    const averageProgress = skills.length
        ? Math.round(skills.reduce((sum, skill) => sum + skillProgress(skill), 0) / skills.length)
        : 0;
    const portfolioScore = (averageProgress / 20).toFixed(1);

    return (
        <ProtectedRoute requiredRole="STUDENT">
            <Layout>
                <div className="max-w-[1600px] mx-auto space-y-6">
                    <SectionTitle
                        title="Mon portfolio"
                        subtitle="Presentez vos projets, certifications et realisations"
                        actions={
                            <>
                                <ActionButton icon={<span>⇩</span>}>Exporter</ActionButton>
                                <ActionButton variant="primary" icon={<span>＋</span>} onClick={() => studentApi.generateRecommendations()}>
                                    Actualiser
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
                                    value={String(projects.length)}
                                    label="projets identifies"
                                />
                                <MiniStatCard
                                    icon="◉"
                                    iconClassName="bg-[#dcfce7] text-[#16a34a]"
                                    value={String(certifications.length)}
                                    label="certifications"
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
                                    label="score portfolio"
                                />
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                                <SurfaceCard className="p-6 xl:col-span-3">
                                    <h2 className="text-lg font-bold text-black">Mes projets</h2>
                                    <p className="mt-1 text-lg text-[#6b7280]">Projets issus de vos recommandations et parcours</p>

                                    <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {projects.map((project) => (
                                            <SurfaceCard key={project._id} className="overflow-hidden border-[#e8ebf2]">
                                                <div className="h-40 bg-[#eceff4] px-4 py-3 flex items-start justify-between">
                                                    <p className="text-lg font-semibold text-black">{project.title}</p>
                                                    <Pill className={project.status === 'Completed' ? 'bg-[#d1fae5] text-[#059669]' : 'bg-[#1d4ed8] text-white'}>
                                                        {project.status}
                                                    </Pill>
                                                </div>

                                                <div className="p-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <h3 className="text-lg font-bold text-black">{project.title}</h3>
                                                        <button className="text-lg">⋮</button>
                                                    </div>
                                                    <p className="mt-2 text-lg text-[#4b5563] leading-relaxed">{project.description}</p>

                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <Pill className="bg-[#f3f4f6] text-[#111827]">{project.type}</Pill>
                                                        <Pill className="bg-[#eef2ff] text-[#1d4ed8]">{project.priority}</Pill>
                                                        <Pill className="bg-[#f3f4f6] text-[#111827]">{project.estimatedHours || 0}h</Pill>
                                                    </div>

                                                    <div className="mt-4 pt-4 border-t border-[#e6e8ee] flex items-center justify-between text-lg text-[#6b7280]">
                                                        <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => project.link && window.open(project.link, '_blank', 'noopener,noreferrer')}
                                                                className="h-10 w-10 rounded-xl border border-[#d7dbe4]"
                                                                disabled={!project.link}
                                                            >
                                                                ↗
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </SurfaceCard>
                                        ))}

                                        {projects.length === 0 ? (
                                            <SurfaceCard className="p-5 lg:col-span-2">
                                                <p className="text-[#6b7280] text-lg">Aucun projet disponible actuellement.</p>
                                            </SurfaceCard>
                                        ) : null}
                                    </div>
                                </SurfaceCard>

                                <SurfaceCard className="p-6 xl:col-span-2 h-fit">
                                    <h3 className="text-lg font-bold text-black">Certifications</h3>
                                    <p className="mt-1 text-lg text-[#6b7280]">Vos certifications basees sur les recommandations</p>

                                    <div className="mt-5 space-y-3">
                                        {certifications.map((cert) => (
                                            <div key={cert._id} className="rounded-2xl border border-[#e6e8ee] p-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="text-lg font-bold text-black">{cert.title}</p>
                                                        <p className="mt-1 text-lg text-[#6b7280]">{cert.description}</p>
                                                    </div>
                                                    <Pill className={cert.status === 'Completed' ? 'bg-[#d1fae5] text-[#059669]' : 'bg-[#fef3c7] text-[#b45309]'}>
                                                        {cert.status}
                                                    </Pill>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-[#e6e8ee] flex items-center justify-between text-lg text-[#6b7280]">
                                                    <span>{new Date(cert.createdAt).toLocaleDateString()}</span>
                                                    <span>{cert.priority}</span>
                                                </div>
                                            </div>
                                        ))}

                                        {certifications.length === 0 ? (
                                            <p className="text-[#6b7280] text-lg">Aucune certification disponible.</p>
                                        ) : null}
                                    </div>

                                    <div className="mt-6 pt-5 border-t border-[#e6e8ee] space-y-2 text-lg">
                                        <div className="flex justify-between text-[#111827]"><span>Recommandations completees</span><span>{completedRecommendations.length}</span></div>
                                        <div className="flex justify-between text-[#111827]"><span>Certifications verifiees</span><span>{verifiedCertifications}</span></div>
                                        <div className="flex justify-between text-[#111827]"><span>Competences maitrisees</span><span>{masteredSkills}</span></div>
                                    </div>

                                    <div className="mt-6 pt-5 border-t border-[#e6e8ee]">
                                        <h4 className="text-lg font-bold text-black">Badges recents</h4>
                                        <div className="mt-3 space-y-2">
                                            {achievements.slice(0, 4).map((achievement) => (
                                                <div key={achievement._id} className="rounded-xl border border-[#e6e8ee] px-3 py-2">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="text-lg font-semibold text-black">{achievement.title}</p>
                                                        <Pill className="bg-[#fef3c7] text-[#b45309]">{achievement.rarity || 'Badge'}</Pill>
                                                    </div>
                                                    <p className="mt-1 text-xl text-[#6b7280]">{achievement.category || 'Categorie libre'}</p>
                                                </div>
                                            ))}

                                            {achievements.length === 0 ? (
                                                <p className="text-[#6b7280] text-lg">Aucun badge disponible.</p>
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
