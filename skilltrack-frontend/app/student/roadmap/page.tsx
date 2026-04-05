'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import {
    ActionButton,
    ProgressBar,
    SectionTitle,
    SurfaceCard,
} from '@/components/student/DesignSystem';
import { studentApi } from '@/lib/api';

interface RoadmapItem {
    phase: number;
    goalId?: string;
    title: string;
    description?: string;
    status?: string;
    progress?: number;
    skills: Array<{ name: string; priority?: string }>;
    duration: string;
}

interface GoalItem {
    _id: string;
    title: string;
    description?: string;
    type?: string;
    status?: string;
    targetJobTitle?: string;
    deadline: string;
}

interface SkillItem {
    _id: string;
    competenceId: { name: string };
    progressPercentage?: number;
    confidenceScore?: number;
}

export default function StudentRoadmapPage() {
    const [loading, setLoading] = React.useState(true);
    const [savingGoalId, setSavingGoalId] = React.useState<string | null>(null);
    const [creatingGoal, setCreatingGoal] = React.useState(false);
    const [goalModalOpen, setGoalModalOpen] = React.useState(false);
    const [goalFormError, setGoalFormError] = React.useState('');
    const [roadmap, setRoadmap] = React.useState<RoadmapItem[]>([]);
    const [goals, setGoals] = React.useState<GoalItem[]>([]);
    const [skills, setSkills] = React.useState<SkillItem[]>([]);
    const [manualProgress, setManualProgress] = React.useState<Record<string, number>>({});
    const [goalForm, setGoalForm] = React.useState({
        title: '',
        description: '',
        type: 'Career',
        priority: 'Medium',
        deadline: '',
    });

    const fetchData = React.useCallback(async () => {
        try {
            const [roadmapRes, goalsRes, skillsRes] = await Promise.all([
                studentApi.getRoadmap(),
                studentApi.getGoals({ limit: 200 }),
                studentApi.getSkills({ limit: 300 }),
            ]);

            const roadmapItems = roadmapRes.data?.data?.roadmap || [];
            setRoadmap(roadmapItems);
            setGoals(goalsRes.data?.data?.goals || []);
            setSkills(skillsRes.data?.data?.skills || []);

            const nextProgress: Record<string, number> = {};
            roadmapItems.forEach((item: RoadmapItem) => {
                if (item.goalId) {
                    nextProgress[item.goalId] = Math.max(0, Math.min(100, Number(item.progress || 0)));
                }
            });
            setManualProgress(nextProgress);
        } catch (error) {
            setRoadmap([]);
            setGoals([]);
            setSkills([]);
            setManualProgress({});
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const skillProgress = React.useMemo(() => {
        const map = new Map<string, number>();
        skills.forEach((skill) => {
            const name = (skill.competenceId?.name || '').toLowerCase().trim();
            const progress = Math.max(0, Math.min(100, Number(skill.progressPercentage ?? skill.confidenceScore ?? 0)));
            if (name) map.set(name, progress);
        });
        return map;
    }, [skills]);

    const milestones = React.useMemo(() => {
        const mapped = roadmap.map((phase, index) => {
            const tasks = (phase.skills || []).map((skill) => {
                const progress = skillProgress.get((skill.name || '').toLowerCase().trim()) || 0;
                return { label: skill.name, done: progress >= 60, progress };
            });

            const savedProgress = phase.goalId ? manualProgress[phase.goalId] : undefined;
            const progress = Math.max(0, Math.min(100, Number(savedProgress ?? phase.progress ?? 0)));

            return {
                id: `${phase.phase}-${phase.title}`,
                goalId: phase.goalId,
                term: index === 0 ? 'Court terme' : index === 1 ? 'Moyen terme' : 'Long terme',
                horizon: phase.duration,
                title: phase.title,
                tasks,
                progress,
                status: phase.status || 'Not Started',
            };
        });

        const activeIndex = mapped.findIndex((step) => step.progress < 100);
        return mapped.map((step, index) => ({
            ...step,
            active: activeIndex >= 0 ? index === activeIndex : index === 0,
        }));
    }, [roadmap, manualProgress, skillProgress]);

    const careerGoal = goals.find((goal) => (goal.type || '').toLowerCase().includes('career')) || goals[0];

    const gapItems = React.useMemo(() => {
        const raw = roadmap.flatMap((phase) => phase.skills || []);
        const map = new Map<string, { name: string; target: number; current: number }>();

        raw.forEach((skill) => {
            const name = (skill.name || '').trim();
            if (!name) return;
            const key = name.toLowerCase();
            const target = (skill.priority || '').toLowerCase().includes('high')
                ? 80
                : (skill.priority || '').toLowerCase().includes('low')
                    ? 60
                    : 70;
            const current = skillProgress.get(key) || 0;

            if (!map.has(key) || map.get(key)!.target < target) {
                map.set(key, { name, target, current });
            }
        });

        return [...map.values()].slice(0, 6);
    }, [roadmap, skillProgress]);

    const onSliderChange = (goalId: string, value: number) => {
        setManualProgress((prev) => ({ ...prev, [goalId]: value }));
    };

    const saveProgress = async (goalId?: string) => {
        if (!goalId) return;
        const value = Math.max(0, Math.min(100, Number(manualProgress[goalId] || 0)));
        const status = value >= 100 ? 'Completed' : value > 0 ? 'In Progress' : 'Not Started';

        setSavingGoalId(goalId);
        try {
            await studentApi.updateGoal(goalId, { progress: value, status });
            await fetchData();
        } finally {
            setSavingGoalId(null);
        }
    };

    const openGoalModal = () => {
        setGoalFormError('');
        setGoalForm({
            title: '',
            description: '',
            type: 'Career',
            priority: 'Medium',
            deadline: '',
        });
        setGoalModalOpen(true);
    };

    const handleCreateGoal = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!goalForm.title.trim() || !goalForm.deadline) {
            setGoalFormError('Le titre et la date limite sont obligatoires.');
            return;
        }

        setCreatingGoal(true);
        setGoalFormError('');

        try {
            await studentApi.createGoal({
                title: goalForm.title.trim(),
                description: goalForm.description.trim(),
                type: goalForm.type,
                priority: goalForm.priority,
                deadline: goalForm.deadline,
            });

            setGoalModalOpen(false);
            await fetchData();
        } catch (error: any) {
            setGoalFormError(error?.response?.data?.error || 'Impossible de creer cet objectif.');
        } finally {
            setCreatingGoal(false);
        }
    };

    return (
        <ProtectedRoute requiredRole="STUDENT">
            <Layout>
                <div className="max-w-[1600px] mx-auto space-y-6">
                    <SectionTitle
                        title="Roadmap carriere"
                        subtitle="Votre plan personnalise vers vos objectifs professionnels"
                        actions={
                            <>
                                <ActionButton icon={<span>↗</span>}>Partager</ActionButton>
                                <ActionButton variant="primary" icon={<span>＋</span>} onClick={openGoalModal}>
                                    Ajouter un objectif
                                </ActionButton>
                            </>
                        }
                    />

                    {loading ? (
                        <SurfaceCard className="p-6">
                            <p className="text-[#4b5563] text-base">Chargement de la roadmap...</p>
                        </SurfaceCard>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                            <SurfaceCard className="p-6 xl:col-span-3">
                                <h2 className="text-lg font-bold text-black">Feuille de route</h2>
                                <p className="mt-1 text-base text-[#6b7280]">Vos jalons vers la reussite professionnelle</p>

                                <div className="mt-5 relative pl-12 space-y-5">
                                    <div className="absolute left-4 top-4 bottom-4 w-px bg-[#d1d5db]" />
                                    {milestones.map((step, index) => (
                                        <div key={step.id} className="relative">
                                            <div
                                                className={`absolute left-0 top-8 h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm ${step.active
                                                    ? 'bg-[#6f8fe5] border-[#6f8fe5] text-white'
                                                    : 'bg-white border-[#c4c8d0] text-[#6b7280]'
                                                    }`}
                                            >
                                                {index === 0 ? '◷' : '○'}
                                            </div>

                                            <SurfaceCard className={`ml-6 p-5 ${step.active ? 'border-[#1d4ed8]' : 'border-[#e6e8ee]'}`}>
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="text-sm text-[#6b7280]">
                                                            <span className="font-semibold text-[#111827]">{step.term}</span>
                                                            <span className="ml-2">{step.horizon}</span>
                                                        </p>
                                                        <h3 className="mt-2 text-lg font-bold text-black">{step.title}</h3>
                                                    </div>
                                                    <p className="text-lg font-bold text-[#1d4ed8]">{step.progress}%</p>
                                                </div>

                                                <ul className="mt-4 space-y-2 text-base text-[#111827]">
                                                    {step.tasks.map((task) => (
                                                        <li key={task.label} className="flex items-center gap-2.5">
                                                            <span className={task.done ? 'text-[#16a34a]' : 'text-[#6b7280]'}>{task.done ? '◉' : '○'}</span>
                                                            <span className={task.done ? 'line-through text-[#6b7280]' : ''}>{task.label}</span>
                                                        </li>
                                                    ))}
                                                </ul>

                                                {step.goalId ? (
                                                    <div className="mt-4 rounded-xl border border-[#e6e8ee] p-3">
                                                        <div className="flex items-center justify-between text-sm text-[#4b5563]">
                                                            <span>Progression du jalon</span>
                                                            <span className="font-semibold text-black">{manualProgress[step.goalId] ?? step.progress}%</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min={0}
                                                            max={100}
                                                            step={5}
                                                            value={manualProgress[step.goalId] ?? step.progress}
                                                            onChange={(e) => onSliderChange(step.goalId!, Number(e.target.value))}
                                                            className="w-full mt-2"
                                                        />
                                                        <div className="mt-3 flex items-center justify-end gap-2">
                                                            <ActionButton
                                                                className="h-10 px-4 text-sm"
                                                                onClick={() => saveProgress(step.goalId)}
                                                                disabled={savingGoalId === step.goalId}
                                                            >
                                                                {savingGoalId === step.goalId ? 'Enregistrement...' : 'Enregistrer progression'}
                                                            </ActionButton>
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </SurfaceCard>
                                        </div>
                                    ))}

                                    {milestones.length === 0 ? (
                                        <SurfaceCard className="ml-6 p-5">
                                            <p className="text-[#6b7280] text-base">Aucun jalon genere. Ajoutez des objectifs pour construire votre roadmap.</p>
                                        </SurfaceCard>
                                    ) : null}
                                </div>
                            </SurfaceCard>

                            <div className="xl:col-span-2 space-y-5">
                                <SurfaceCard className="p-6">
                                    <h3 className="text-lg font-bold text-black">Objectifs de carriere</h3>
                                    <p className="mt-1 text-base text-[#6b7280]">Votre vision professionnelle</p>

                                    {careerGoal ? (
                                        <div className="mt-5 space-y-3 text-base">
                                            <div className="rounded-2xl bg-[#f5f6f9] px-4 py-3">
                                                <p className="text-[#6b7280]">Objectif principal</p>
                                                <p className="font-semibold text-black">{careerGoal.title}</p>
                                            </div>
                                            <div className="rounded-2xl bg-[#f5f6f9] px-4 py-3">
                                                <p className="text-[#6b7280]">Description</p>
                                                <p className="font-semibold text-black">{careerGoal.description || 'Aucune description'}</p>
                                            </div>
                                            <div className="rounded-2xl bg-[#f5f6f9] px-4 py-3">
                                                <p className="text-[#6b7280]">Echeance</p>
                                                <p className="font-semibold text-black">{new Date(careerGoal.deadline).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="mt-5 text-[#6b7280] text-base">Aucun objectif de carriere defini.</p>
                                    )}
                                </SurfaceCard>

                                <SurfaceCard className="p-6">
                                    <h3 className="text-lg font-bold text-black">Ecarts de competences</h3>
                                    <p className="mt-1 text-base text-[#6b7280]">Competences a developper pour votre objectif</p>

                                    <div className="mt-5 space-y-5">
                                        {gapItems.map((gap) => {
                                            const safeTarget = Math.max(1, gap.target);
                                            const gapPercent = Math.max(0, safeTarget - gap.current);

                                            return (
                                                <div key={gap.name}>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <p className="font-semibold text-black">{gap.name}</p>
                                                        <p className="text-[#6b7280]">{gap.current}% / {safeTarget}%</p>
                                                    </div>
                                                    <ProgressBar value={gap.current} max={safeTarget} className="mt-2" />
                                                    <p className="mt-1 text-sm text-[#6b7280]">Gap: {gapPercent}% a combler</p>
                                                </div>
                                            );
                                        })}

                                        {gapItems.length === 0 ? (
                                            <p className="text-[#6b7280] text-base">Aucun ecart detecte pour le moment.</p>
                                        ) : null}
                                    </div>
                                </SurfaceCard>
                            </div>
                        </div>
                    )}
                </div>
            </Layout>

            {goalModalOpen ? (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <SurfaceCard className="w-full max-w-xl p-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-black">Ajouter un objectif</h3>
                            <button onClick={() => setGoalModalOpen(false)} className="text-lg">✕</button>
                        </div>

                        <form onSubmit={handleCreateGoal} className="mt-5 space-y-4">
                            {goalFormError ? (
                                <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] text-[#b91c1c] px-4 py-2 text-sm">
                                    {goalFormError}
                                </div>
                            ) : null}

                            <input
                                type="text"
                                placeholder="Titre"
                                value={goalForm.title}
                                onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                                className="w-full h-11 rounded-xl border border-[#d7dbe4] px-3"
                                required
                            />

                            <textarea
                                rows={3}
                                placeholder="Description"
                                value={goalForm.description}
                                onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                                className="w-full rounded-xl border border-[#d7dbe4] px-3 py-2"
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <select
                                    value={goalForm.type}
                                    onChange={(e) => setGoalForm({ ...goalForm, type: e.target.value })}
                                    className="h-11 rounded-xl border border-[#d7dbe4] px-3"
                                >
                                    <option value="Career">Career</option>
                                    <option value="Learning">Learning</option>
                                    <option value="Project">Project</option>
                                    <option value="Certification">Certification</option>
                                </select>

                                <select
                                    value={goalForm.priority}
                                    onChange={(e) => setGoalForm({ ...goalForm, priority: e.target.value })}
                                    className="h-11 rounded-xl border border-[#d7dbe4] px-3"
                                >
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>

                                <input
                                    type="date"
                                    value={goalForm.deadline}
                                    onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                                    className="h-11 rounded-xl border border-[#d7dbe4] px-3"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <ActionButton type="button" onClick={() => setGoalModalOpen(false)}>
                                    Annuler
                                </ActionButton>
                                <ActionButton variant="primary" type="submit" disabled={creatingGoal}>
                                    {creatingGoal ? 'Creation...' : 'Creer objectif'}
                                </ActionButton>
                            </div>
                        </form>
                    </SurfaceCard>
                </div>
            ) : null}
        </ProtectedRoute>
    );
}
