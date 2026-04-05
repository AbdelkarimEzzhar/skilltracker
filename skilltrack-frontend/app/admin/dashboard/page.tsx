'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import {
    ActionButton,
    MiniStatCard,
    SectionTitle,
    SurfaceCard,
} from '@/components/student/DesignSystem';
import { adminApi } from '@/lib/api';

interface DashboardStats {
    totalUsers: number;
    totalAdmins: number;
    totalStudents: number;
    activeStudents: number;
    totalCompetences: number;
    totalGoals: number;
    totalFormations: number;
    totalAchievements: number;
    totalSpecialties: number;
    totalStudentSkills: number;
}

const emptyStats: DashboardStats = {
    totalUsers: 0,
    totalAdmins: 0,
    totalStudents: 0,
    activeStudents: 0,
    totalCompetences: 0,
    totalGoals: 0,
    totalFormations: 0,
    totalAchievements: 0,
    totalSpecialties: 0,
    totalStudentSkills: 0,
};

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = React.useState<DashboardStats>(emptyStats);
    const [loading, setLoading] = React.useState(true);

    const fetchData = React.useCallback(async () => {
        try {
            const response = await adminApi.getStats();
            setStats({ ...emptyStats, ...(response.data?.data || {}) });
        } catch (error) {
            setStats(emptyStats);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const activeRate = stats.totalStudents
        ? Math.round((stats.activeStudents / stats.totalStudents) * 100)
        : 0;

    return (
        <ProtectedRoute requiredRole="ADMIN">
            <Layout>
                <div className="max-w-[1600px] mx-auto space-y-6">
                    <SectionTitle
                        title="Dashboard admin"
                        subtitle="Vue globale des utilisateurs, competences et activites"
                        actions={
                            <ActionButton onClick={fetchData}>Actualiser</ActionButton>
                        }
                    />

                    {loading ? (
                        <SurfaceCard className="p-6">
                            <p className="text-[#4b5563] text-base">Chargement des statistiques...</p>
                        </SurfaceCard>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
                                <MiniStatCard
                                    icon="👥"
                                    iconClassName="bg-[#e0e7ff] text-[#1d4ed8]"
                                    value={String(stats.totalUsers)}
                                    label="Utilisateurs"
                                />
                                <MiniStatCard
                                    icon="🎓"
                                    iconClassName="bg-[#dcfce7] text-[#16a34a]"
                                    value={String(stats.totalStudents)}
                                    label="Etudiants"
                                />
                                <MiniStatCard
                                    icon="🔐"
                                    iconClassName="bg-[#fef3c7] text-[#d97706]"
                                    value={String(stats.totalAdmins)}
                                    label="Admins"
                                />
                                <MiniStatCard
                                    icon="🎯"
                                    iconClassName="bg-[#f3e8ff] text-[#9333ea]"
                                    value={String(stats.totalCompetences)}
                                    label="Competences"
                                />
                                <MiniStatCard
                                    icon="📚"
                                    iconClassName="bg-[#dbeafe] text-[#1d4ed8]"
                                    value={String(stats.totalFormations)}
                                    label="Formations"
                                />
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                                <SurfaceCard className="p-6 xl:col-span-3">
                                    <h2 className="text-lg font-bold text-black">Indicateurs plateforme</h2>
                                    <p className="mt-1 text-base text-[#6b7280]">Mesures en temps reel depuis la base de donnees</p>

                                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                        <div className="rounded-xl border border-[#e6e8ee] p-4">
                                            <p className="text-[#6b7280]">Taux etudiants actifs</p>
                                            <p className="text-lg font-bold text-black mt-1">{activeRate}%</p>
                                        </div>
                                        <div className="rounded-xl border border-[#e6e8ee] p-4">
                                            <p className="text-[#6b7280]">Objectifs definis</p>
                                            <p className="text-lg font-bold text-black mt-1">{stats.totalGoals}</p>
                                        </div>
                                        <div className="rounded-xl border border-[#e6e8ee] p-4">
                                            <p className="text-[#6b7280]">Achievements</p>
                                            <p className="text-lg font-bold text-black mt-1">{stats.totalAchievements}</p>
                                        </div>
                                        <div className="rounded-xl border border-[#e6e8ee] p-4">
                                            <p className="text-[#6b7280]">Evaluations competences</p>
                                            <p className="text-lg font-bold text-black mt-1">{stats.totalStudentSkills}</p>
                                        </div>
                                    </div>
                                </SurfaceCard>

                                <SurfaceCard className="p-6 xl:col-span-2">
                                    <h3 className="text-lg font-bold text-black">Actions rapides</h3>
                                    <div className="mt-5 space-y-3">
                                        <ActionButton className="w-full justify-start" onClick={() => router.push('/admin/users')}>
                                            Gerer les utilisateurs
                                        </ActionButton>
                                        <ActionButton className="w-full justify-start" onClick={() => router.push('/admin/skills')}>
                                            Gerer les competences
                                        </ActionButton>
                                        <ActionButton className="w-full justify-start" onClick={fetchData}>
                                            Recharger les donnees
                                        </ActionButton>
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
