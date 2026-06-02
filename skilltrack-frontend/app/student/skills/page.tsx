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
import { competenceApi, studentApi } from '@/lib/api';

interface SkillItem {
    _id: string;
    competenceId: {
        _id: string;
        name: string;
        domain?: string;
    };
    status: 'Not Started' | 'In Progress' | 'Mastered' | 'Reviewed' | string;
    confidenceScore?: number;
    progressPercentage?: number;
    updatedAt?: string;
}

interface CompetenceOption {
    _id: string;
    name: string;
    domain?: string;
}

interface RecommendationItem {
    _id: string;
    title: string;
    reason: string;
}

const isSoftDomain = (domain?: string) => {
    const value = (domain || '').toLowerCase();
    return value.includes('soft') || value.includes('transversal') || value.includes('communication') || value.includes('management');
};

const normalizeProgress = (skill: SkillItem) => Math.max(0, Math.min(100, Number(skill.progressPercentage ?? skill.confidenceScore ?? 0)));

export default function StudentSkillsPage() {
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [skills, setSkills] = React.useState<SkillItem[]>([]);
    const [competences, setCompetences] = React.useState<CompetenceOption[]>([]);
    const [recommendations, setRecommendations] = React.useState<RecommendationItem[]>([]);
    const [tab, setTab] = React.useState<'all' | 'hard' | 'soft'>('all');
    const [modalOpen, setModalOpen] = React.useState(false);
    const [formError, setFormError] = React.useState('');
    const [actionError, setActionError] = React.useState('');
    const [deletingId, setDeletingId] = React.useState<string | null>(null);
    const [form, setForm] = React.useState({
        competenceId: '',
        status: 'In Progress',
        confidenceScore: 50,
    });

    const fetchData = React.useCallback(async () => {
        try {
            const [skillsRes, competencesRes, recommendationsRes] = await Promise.all([
                studentApi.getSkills({ limit: 300 }),
                competenceApi.getAll({ limit: 1000 }),
                studentApi.getRecommendations({ status: 'Active', limit: 5 }),
            ]);

            setSkills(skillsRes.data?.data?.skills || []);
            setCompetences(competencesRes.data?.data?.competences || []);
            setRecommendations(recommendationsRes.data?.data?.recommendations || []);
        } catch (error) {
            setSkills([]);
            setCompetences([]);
            setRecommendations([]);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const total = skills.length;
    const hardSkills = skills.filter((skill) => !isSoftDomain(skill.competenceId?.domain)).length;
    const softSkills = skills.filter((skill) => isSoftDomain(skill.competenceId?.domain)).length;
    const thisMonth = skills.filter((skill) => {
        if (!skill.updatedAt) return false;
        const date = new Date(skill.updatedAt);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    const filteredSkills = skills.filter((skill) => {
        if (tab === 'hard') return !isSoftDomain(skill.competenceId?.domain);
        if (tab === 'soft') return isSoftDomain(skill.competenceId?.domain);
        return true;
    });

    const openCreateModal = () => {
        setFormError('');
        setForm({ competenceId: '', status: 'In Progress', confidenceScore: 50 });
        setModalOpen(true);
    };

    const openUpdateModal = (skill: SkillItem) => {
        setFormError('');
        setForm({
            competenceId: skill.competenceId._id,
            status: skill.status,
            confidenceScore: normalizeProgress(skill),
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.competenceId) {
            setFormError('Choisissez une competence.');
            return;
        }

        setSaving(true);
        setFormError('');

        try {
            await studentApi.updateSkill({
                competenceId: form.competenceId,
                status: form.status,
                confidenceScore: Number(form.confidenceScore),
                progressPercentage: Number(form.confidenceScore),
            });

            setModalOpen(false);
            await fetchData();
        } catch (error: any) {
            setFormError(error?.response?.data?.error || 'Impossible de sauvegarder cette competence.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSkill = async (skill: SkillItem) => {
        const skillName = skill.competenceId?.name || 'cette competence';
        const confirmed = window.confirm(`Supprimer ${skillName} de votre portfolio ?`);
        if (!confirmed) return;

        setActionError('');
        setDeletingId(skill._id);

        try {
            await studentApi.deleteSkill(skill._id);
            await fetchData();
        } catch (error: any) {
            setActionError(error?.response?.data?.error || 'Impossible de supprimer cette competence.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <ProtectedRoute requiredRole="STUDENT">
            <Layout>
                <div className="max-w-[1600px] mx-auto space-y-6">
                    <SectionTitle
                        title="Mes competences"
                        subtitle="Gerez et developpez votre portfolio de competences"
                        actions={
                            <>
                                <ActionButton icon={<span>⇩</span>}>Exporter</ActionButton>
                                <ActionButton variant="primary" icon={<span>＋</span>} onClick={openCreateModal}>
                                    Ajouter une competence
                                </ActionButton>
                            </>
                        }
                    />

                    {actionError ? (
                        <SurfaceCard className="p-4 border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]">
                            {actionError}
                        </SurfaceCard>
                    ) : null}

                    {loading ? (
                        <SurfaceCard className="p-6">
                            <p className="text-[#4b5563] text-lg">Chargement des competences...</p>
                        </SurfaceCard>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                                <MiniStatCard
                                    icon="◉"
                                    iconClassName="bg-[#e0e7ff] text-[#1d4ed8]"
                                    value={String(total)}
                                    label="competences"
                                />
                                <MiniStatCard
                                    icon="⚡"
                                    iconClassName="bg-[#dcfce7] text-[#16a34a]"
                                    value={String(hardSkills)}
                                    label="hard skills"
                                />
                                <MiniStatCard
                                    icon="◎"
                                    iconClassName="bg-[#fef3c7] text-[#d97706]"
                                    value={String(softSkills)}
                                    label="soft skills"
                                />
                                <MiniStatCard
                                    icon="↗"
                                    iconClassName="bg-[#f3e8ff] text-[#9333ea]"
                                    value={String(thisMonth)}
                                    label="mises a jour ce mois"
                                />
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                                <SurfaceCard className="p-6 xl:col-span-3">
                                    <h2 className="text-lg font-bold text-black">Portfolio de competences</h2>
                                    <p className="mt-1 text-lg text-[#6b7280]">Visualisez et gerez toutes vos competences</p>

                                    <div className="mt-6 rounded-2xl bg-[#eceff4] p-1 grid grid-cols-3 text-center text-lg font-semibold text-[#111827]">
                                        <button onClick={() => setTab('all')} className={`rounded-xl py-2 ${tab === 'all' ? 'bg-white' : ''}`}>
                                            Toutes ({total})
                                        </button>
                                        <button onClick={() => setTab('hard')} className={`rounded-xl py-2 ${tab === 'hard' ? 'bg-white' : ''}`}>
                                            Techniques ({hardSkills})
                                        </button>
                                        <button onClick={() => setTab('soft')} className={`rounded-xl py-2 ${tab === 'soft' ? 'bg-white' : ''}`}>
                                            Transversales ({softSkills})
                                        </button>
                                    </div>

                                    <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {filteredSkills.map((skill) => {
                                            const progress = normalizeProgress(skill);
                                            const level = progress >= 80 ? 'Expert' : progress >= 60 ? 'Avance' : progress >= 40 ? 'Intermediaire' : 'Debutant';

                                            return (
                                                <SurfaceCard key={skill._id} className="p-5 border-[#e8ebf2]">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h3 className="text-lg font-bold text-black flex items-center gap-2">
                                                                {skill.competenceId?.name || 'Competence'}
                                                                <span className="text-[#22c55e]">◉</span>
                                                            </h3>
                                                            <Pill className="mt-2 bg-[#f3f4f6] text-[#111827]">{skill.competenceId?.domain || 'Domaine non renseigne'}</Pill>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => openUpdateModal(skill)}
                                                                className="text-sm font-semibold text-[#111827] hover:text-[#1d4ed8]"
                                                                title="Mettre a jour"
                                                            >
                                                                Modifier
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSkill(skill)}
                                                                className="text-sm font-semibold text-[#b91c1c] hover:text-[#991b1b] disabled:opacity-60"
                                                                disabled={deletingId === skill._id}
                                                                title="Supprimer"
                                                            >
                                                                {deletingId === skill._id ? 'Suppression...' : 'Supprimer'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex items-center justify-between">
                                                        <p className="text-lg text-[#4b5563]">{level}</p>
                                                        <p className="text-lg font-semibold text-black">{progress}%</p>
                                                    </div>

                                                    <ProgressBar value={progress} className="mt-2" />
                                                </SurfaceCard>
                                            );
                                        })}

                                        {filteredSkills.length === 0 ? (
                                            <SurfaceCard className="p-6 lg:col-span-2">
                                                <p className="text-[#6b7280] text-lg">Aucune competence pour ce filtre.</p>
                                            </SurfaceCard>
                                        ) : null}
                                    </div>
                                </SurfaceCard>

                                <SurfaceCard className="p-6 xl:col-span-2 h-fit">
                                    <div className="pt-4 border-t border-[#e6e8ee]">
                                        <h3 className="text-lg font-bold text-black">Recommandations</h3>
                                        {recommendations.length > 0 ? (
                                            <ul className="mt-4 space-y-3 text-lg text-[#4b5563] list-disc pl-6 marker:text-[#1d4ed8]">
                                                {recommendations.map((item) => (
                                                    <li key={item._id}>{item.reason || item.title}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="mt-4 text-lg text-[#6b7280]">Aucune recommandation disponible.</p>
                                        )}
                                    </div>
                                </SurfaceCard>
                            </div>
                        </>
                    )}
                </div>
            </Layout>

            {modalOpen ? (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <SurfaceCard className="w-full max-w-xl p-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-black">Ajouter / Mettre a jour une competence</h3>
                            <button onClick={() => setModalOpen(false)} className="text-lg">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                            {formError ? (
                                <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] text-[#b91c1c] px-4 py-2 text-sm">
                                    {formError}
                                </div>
                            ) : null}

                            <div>
                                <label className="block text-sm text-[#374151] mb-2">Competence</label>
                                <select
                                    value={form.competenceId}
                                    onChange={(e) => setForm({ ...form, competenceId: e.target.value })}
                                    className="w-full h-11 rounded-xl border border-[#d7dbe4] px-3"
                                >
                                    <option value="">Choisir une competence</option>
                                    {competences.map((item) => (
                                        <option key={item._id} value={item._id}>
                                            {item.name} ({item.domain || 'Domaine'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-[#374151] mb-2">Statut</label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        className="w-full h-11 rounded-xl border border-[#d7dbe4] px-3"
                                    >
                                        <option value="Not Started">Not Started</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Reviewed">Reviewed</option>
                                        <option value="Mastered">Mastered</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-[#374151] mb-2">Progression (%)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={form.confidenceScore}
                                        onChange={(e) => setForm({ ...form, confidenceScore: Number(e.target.value) })}
                                        className="w-full h-11 rounded-xl border border-[#d7dbe4] px-3"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <ActionButton type="button" onClick={() => setModalOpen(false)}>Annuler</ActionButton>
                                <ActionButton variant="primary" type="submit" disabled={saving}>
                                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                                </ActionButton>
                            </div>
                        </form>
                    </SurfaceCard>
                </div>
            ) : null}
        </ProtectedRoute>
    );
}
