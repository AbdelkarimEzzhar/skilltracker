'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { ActionButton, Pill, ProgressBar, SectionTitle, SurfaceCard } from '@/components/student/DesignSystem';
import { filieresApi, studentApi } from '@/lib/api';

interface Profile {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    bio?: string;
    niveau?: string;
    filiereId?: string;
    location?: string;
    phone?: string;
    linkedinUrl?: string;
    githubUrl?: string;
}

interface GoalItem {
    _id: string;
    title: string;
    description?: string;
    type?: string;
    status?: string;
    deadline: string;
    createdAt?: string;
}

interface SkillItem {
    _id: string;
    competenceId: { name: string; domain?: string };
    progressPercentage?: number;
    confidenceScore?: number;
}

interface Filiere {
    _id: string;
    titre: string;
}

const getSkillProgress = (skill: SkillItem) => Math.max(0, Math.min(100, Number(skill.progressPercentage ?? skill.confidenceScore ?? 0)));

export default function StudentProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(true);
    const [downloading, setDownloading] = React.useState(false);
    const [profile, setProfile] = React.useState<Profile | null>(null);
    const [goals, setGoals] = React.useState<GoalItem[]>([]);
    const [skills, setSkills] = React.useState<SkillItem[]>([]);
    const [filieres, setFilieres] = React.useState<Filiere[]>([]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, goalsRes, skillsRes, filieresRes] = await Promise.all([
                    studentApi.getProfile(),
                    studentApi.getGoals({ limit: 200 }),
                    studentApi.getSkills({ limit: 300 }),
                    filieresApi.getAll({ limit: 200 }),
                ]);

                setProfile(profileRes.data?.data || null);
                setGoals(goalsRes.data?.data?.goals || []);
                setSkills(skillsRes.data?.data?.skills || []);
                setFilieres(filieresRes.data?.data?.filieres || []);
            } catch (error) {
                setProfile(null);
                setGoals([]);
                setSkills([]);
                setFilieres([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filiereName = React.useMemo(() => {
        if (!profile?.filiereId) return 'Non renseigne';
        const filiere = filieres.find((item) => item._id === profile.filiereId);
        return filiere?.titre || 'Non renseigne';
    }, [profile?.filiereId, filieres]);

    const professionalItems = goals.filter((goal) => {
        const type = (goal.type || '').toLowerCase();
        return type.includes('career') || type.includes('project');
    });

    const academicItems = goals.filter((goal) => {
        const type = (goal.type || '').toLowerCase();
        return type.includes('learning') || type.includes('certification');
    });

    const topSkills = [...skills]
        .sort((a, b) => getSkillProgress(b) - getSkillProgress(a))
        .slice(0, 5);

    const handleExportCv = async () => {
        if (!profile) return;
        setDownloading(true);

        try {
            const content = [
                `${profile.firstName} ${profile.lastName}`,
                profile.email,
                profile.bio || '',
                `Niveau: ${profile.niveau || 'Non renseigne'}`,
                `Filiere: ${filiereName}`,
                '',
                'Competences:',
                ...skills.map((skill, index) => `${index + 1}. ${skill.competenceId?.name || 'Competence'} - ${getSkillProgress(skill)}%`),
                '',
                'Objectifs:',
                ...goals.map((goal, index) => `${index + 1}. ${goal.title} - ${goal.status || 'Not Started'}`),
            ].join('\n');

            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${profile.firstName}_${profile.lastName}_CV.txt`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <ProtectedRoute requiredRole="STUDENT">
            <Layout>
                <div className="max-w-[1600px] mx-auto space-y-6">
                    <SectionTitle
                        title="Mon profil"
                        subtitle="Gerez vos informations personnelles et professionnelles"
                        actions={
                            <>
                                <ActionButton icon={<span>↗</span>} onClick={() => profile && navigator.clipboard.writeText(profile.email)}>
                                    Partager
                                </ActionButton>
                                <ActionButton icon={<span>⇩</span>} onClick={handleExportCv} disabled={downloading}>
                                    {downloading ? 'Export...' : 'Export CV'}
                                </ActionButton>
                            </>
                        }
                    />

                    {loading ? (
                        <SurfaceCard className="p-6">
                            <p className="text-[#4b5563] text-lg">Chargement du profil...</p>
                        </SurfaceCard>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                                <SurfaceCard className="p-6 xl:col-span-3">
                                    <div className="flex items-start justify-between">
                                        <h2 className="text-lg font-bold text-black">A propos</h2>
                                        <button className="text-lg text-[#6b7280]" onClick={() => router.push('/student/settings')}>✎</button>
                                    </div>
                                    <p className="mt-4 text-lg text-[#4b5563] leading-relaxed">
                                        {profile?.bio || 'Aucune biographie renseignee pour le moment.'}
                                    </p>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Pill className="bg-[#f3f4f6] text-[#111827]">Niveau {profile?.niveau || 'Non renseigne'}</Pill>
                                        <Pill className="bg-[#f3f4f6] text-[#111827]">{filiereName}</Pill>
                                        <Pill className="bg-[#f3f4f6] text-[#111827]">{goals.length} objectifs</Pill>
                                        <Pill className="bg-[#f3f4f6] text-[#111827]">{skills.length} competences</Pill>
                                    </div>
                                </SurfaceCard>

                                <SurfaceCard className="p-6 xl:col-span-2">
                                    <div className="flex items-start justify-between">
                                        <h3 className="text-lg font-bold text-black">Informations</h3>
                                        <button className="text-lg text-[#6b7280]" onClick={() => router.push('/student/settings')}>✎</button>
                                    </div>

                                    <div className="mt-6 text-center">
                                        <div className="h-24 w-24 rounded-full bg-[#e5e7eb] mx-auto flex items-center justify-center text-lg font-bold text-[#111827]">
                                            {(profile?.firstName?.[0] || 'U').toUpperCase()}
                                        </div>
                                        <p className="mt-3 text-lg font-bold text-black">{profile?.firstName || 'User'} {profile?.lastName || ''}</p>
                                        <p className="text-lg text-[#6b7280]">{profile?.niveau ? `Etudiant niveau ${profile.niveau}` : 'Profil etudiant'}</p>
                                        <Pill className="mt-2 bg-[#1d4ed8] text-white">Profil public</Pill>
                                    </div>

                                    <div className="mt-5 pt-5 border-t border-[#e6e8ee] space-y-2 text-lg text-[#111827]">
                                        <p>{profile?.location || 'Localisation non renseignee'}</p>
                                        <p>{profile?.email || 'Email indisponible'}</p>
                                        <p>{profile?.phone || 'Telephone non renseigne'}</p>
                                    </div>

                                    <div className="mt-5 pt-5 border-t border-[#e6e8ee] space-y-2 text-lg text-[#111827]">
                                        <p>{profile?.linkedinUrl || 'Lien LinkedIn non renseigne'}</p>
                                        <p>{profile?.githubUrl || 'Lien GitHub non renseigne'}</p>
                                    </div>

                                    <div className="mt-5 pt-5 border-t border-[#e6e8ee] space-y-2 text-lg text-[#111827]">
                                        <p>Niveau: {profile?.niveau || 'Non renseigne'}</p>
                                        <p>Filiere: {filiereName}</p>
                                        <p>Objectifs actifs: {goals.filter((goal) => (goal.status || '').toLowerCase().includes('progress')).length}</p>
                                    </div>
                                </SurfaceCard>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                                <div className="xl:col-span-3 space-y-5">
                                    <SurfaceCard className="p-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-bold text-black">Experience professionnelle</h3>
                                            <button className="text-lg text-[#111827]" onClick={() => router.push('/student/academic')}>+</button>
                                        </div>

                                        <div className="mt-5 space-y-5">
                                            {professionalItems.map((item) => (
                                                <div key={item._id} className="pb-5 border-b border-[#e6e8ee] last:border-b-0 last:pb-0">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <p className="text-lg font-bold text-black">{item.title}</p>
                                                            <p className="text-lg text-[#6b7280]">{item.type || 'Career'}</p>
                                                            <p className="mt-2 text-lg text-[#4b5563]">Echeance: {new Date(item.deadline).toLocaleDateString()}</p>
                                                        </div>
                                                        <button className="text-lg text-[#6b7280]">✎</button>
                                                    </div>
                                                    <p className="mt-3 text-lg text-[#4b5563] leading-relaxed">{item.description || 'Aucune description'}</p>
                                                </div>
                                            ))}

                                            {professionalItems.length === 0 ? (
                                                <p className="text-[#6b7280] text-lg">Aucune experience/projection professionnelle disponible.</p>
                                            ) : null}
                                        </div>
                                    </SurfaceCard>

                                    <SurfaceCard className="p-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-bold text-black">Formation academique</h3>
                                            <button className="text-lg text-[#111827]" onClick={() => router.push('/student/academic')}>+</button>
                                        </div>

                                        <div className="mt-5 space-y-4">
                                            {academicItems.map((item) => {
                                                const status = item.status || 'Not Started';
                                                const isActive = status.toLowerCase().includes('progress');

                                                return (
                                                    <div key={item._id} className="rounded-2xl border border-[#e6e8ee] p-4">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <p className="text-lg font-bold text-black">{item.title}</p>
                                                                <p className="text-lg text-[#6b7280]">{item.type || 'Learning'}</p>
                                                                <p className="mt-2 text-lg text-[#4b5563]">Echeance: {new Date(item.deadline).toLocaleDateString()}</p>
                                                            </div>
                                                            <Pill className={isActive ? 'bg-[#1d4ed8] text-white' : 'bg-[#d1fae5] text-[#059669]'}>
                                                                {status}
                                                            </Pill>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {academicItems.length === 0 ? (
                                                <p className="text-[#6b7280] text-lg">Aucune formation academique enregistree.</p>
                                            ) : null}
                                        </div>
                                    </SurfaceCard>
                                </div>

                                <SurfaceCard className="p-6 xl:col-span-2 h-fit">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-black">Top competences</h3>
                                        <button className="text-lg text-[#111827]" onClick={() => router.push('/student/skills')}>Voir tout →</button>
                                    </div>

                                    <div className="mt-5 space-y-4">
                                        {topSkills.map((skill) => {
                                            const value = getSkillProgress(skill);
                                            return (
                                                <div key={skill._id}>
                                                    <div className="flex items-center justify-between text-lg">
                                                        <p className="font-semibold text-black">{skill.competenceId?.name || 'Competence'}</p>
                                                        <p className="text-[#6b7280]">{value}%</p>
                                                    </div>
                                                    <ProgressBar value={value} className="mt-2" />
                                                </div>
                                            );
                                        })}

                                        {topSkills.length === 0 ? (
                                            <p className="text-[#6b7280] text-lg">Aucune competence disponible.</p>
                                        ) : null}
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
