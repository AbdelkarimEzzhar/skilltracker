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

interface AcademicCourse {
    title: string;
    grade?: string;
    credits?: number;
}

interface AcademicRecord {
    _id: string;
    semester: string;
    courses: AcademicCourse[];
    createdAt?: string;
}

interface AcademicStats {
    totalSemesters: number;
    totalCourses: number;
    totalCredits: number;
    averageGrade: number | null;
    coursesInProgress: number;
}

const defaultStats: AcademicStats = {
    totalSemesters: 0,
    totalCourses: 0,
    totalCredits: 0,
    averageGrade: null,
    coursesInProgress: 0,
};

const parseGradeTo20 = (value?: string): number | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    const match = trimmed.match(/^(\d+(?:[.,]\d+)?)(?:\s*\/\s*(\d+(?:[.,]\d+)?))?$/);
    if (!match) return null;

    const grade = Number(match[1].replace(',', '.'));
    const scale = match[2] ? Number(match[2].replace(',', '.')) : 20;
    if (!Number.isFinite(grade) || !Number.isFinite(scale) || scale <= 0) return null;

    return Math.max(0, Math.min(20, (grade / scale) * 20));
};

const formatGrade = (grade: number | null) => {
    if (grade === null) return 'En cours';
    return `${grade.toFixed(1)}/20`;
};

const semesterYearHint = (semester: string) => {
    const parts = semester.match(/(\d{4})/g);
    if (!parts || parts.length === 0) return semester;
    if (parts.length === 1) return `${parts[0]}-${Number(parts[0]) + 1}`;
    return `${parts[0]}-${parts[1]}`;
};

export default function StudentAcademicPage() {
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [records, setRecords] = React.useState<AcademicRecord[]>([]);
    const [stats, setStats] = React.useState<AcademicStats>(defaultStats);
    const [modalOpen, setModalOpen] = React.useState(false);
    const [formError, setFormError] = React.useState('');
    const [form, setForm] = React.useState({
        semester: '',
        title: '',
        grade: '',
        credits: '',
    });

    const fetchData = React.useCallback(async () => {
        try {
            const recordsRes = await studentApi.getAcademicRecords();

            setRecords(recordsRes.data?.data?.records || []);
            setStats(recordsRes.data?.data?.stats || defaultStats);
        } catch (error) {
            setRecords([]);
            setStats(defaultStats);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const timeline = React.useMemo(() => {
        return [...records].map((record, index) => {
            const graded = (record.courses || [])
                .map((course) => parseGradeTo20(course.grade))
                .filter((grade): grade is number => grade !== null);

            const average = graded.length
                ? graded.reduce((sum, grade) => sum + grade, 0) / graded.length
                : null;

            const inProgress = (record.courses || []).filter((course) => parseGradeTo20(course.grade) === null).length;
            const completed = (record.courses || []).length - inProgress;

            return {
                ...record,
                order: index,
                average,
                inProgress,
                completed,
                status: inProgress > 0 ? 'En cours' : 'Complete',
            };
        });
    }, [records]);

    const currentCourses = React.useMemo(() => {
        const fromRecords = records.flatMap((record) =>
            (record.courses || [])
                .filter((course) => parseGradeTo20(course.grade) === null)
                .map((course) => ({
                    id: `${record._id}-${course.title}`,
                    title: course.title,
                    subtitle: semesterYearHint(record.semester),
                    progress: 0,
                    score: 'En cours',
                }))
        );

        return fromRecords.slice(0, 8);
    }, [records]);

    const averageGradeLabel = stats.averageGrade !== null ? `${stats.averageGrade.toFixed(1)}/20` : 'N/A';

    const handleDownloadTranscript = () => {
        const lines: string[] = ['Semester,Course,Grade,Credits'];

        records.forEach((record) => {
            (record.courses || []).forEach((course) => {
                lines.push([
                    record.semester,
                    course.title,
                    course.grade || 'In Progress',
                    String(course.credits ?? ''),
                ].join(','));
            });
        });

        const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'releve-academique.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');

        try {
            await studentApi.addAcademicCourse({
                semester: form.semester,
                title: form.title,
                grade: form.grade || undefined,
                credits: form.credits ? Number(form.credits) : undefined,
            });

            setModalOpen(false);
            setForm({ semester: '', title: '', grade: '', credits: '' });
            await fetchData();
        } catch (error: any) {
            setFormError(error?.response?.data?.error || 'Impossible d\'ajouter ce cours.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ProtectedRoute requiredRole="STUDENT">
            <Layout>
                <div className="max-w-[1600px] mx-auto space-y-6">
                    <SectionTitle
                        title="Parcours academique"
                        subtitle="Votre historique educatif et vos cours en cours"
                        actions={
                            <>
                                <ActionButton icon={<span>⇩</span>} onClick={handleDownloadTranscript}>
                                    Telecharger le releve
                                </ActionButton>
                                <ActionButton variant="primary" icon={<span>＋</span>} onClick={() => setModalOpen(true)}>
                                    Ajouter un cours
                                </ActionButton>
                            </>
                        }
                    />

                    {loading ? (
                        <SurfaceCard className="p-6">
                            <p className="text-[#4b5563] text-lg">Chargement des donnees academiques...</p>
                        </SurfaceCard>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                                <MiniStatCard
                                    icon="◉"
                                    iconClassName="bg-[#e0e7ff] text-[#1d4ed8]"
                                    value={averageGradeLabel}
                                    label="Moyenne generale"
                                />
                                <MiniStatCard
                                    icon="▭"
                                    iconClassName="bg-[#dcfce7] text-[#16a34a]"
                                    value={String(stats.totalCredits)}
                                    label="Credits cumules"
                                />
                                <MiniStatCard
                                    icon="⌛"
                                    iconClassName="bg-[#fef3c7] text-[#d97706]"
                                    value={String(stats.totalCourses)}
                                    label="Cours enregistres"
                                />
                                <MiniStatCard
                                    icon="↗"
                                    iconClassName="bg-[#f3e8ff] text-[#9333ea]"
                                    value={String(stats.totalSemesters)}
                                    label="Semestres"
                                />
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                                <SurfaceCard className="p-6 xl:col-span-3">
                                    <h2 className="text-lg font-bold text-black">Historique academique</h2>
                                    <p className="mt-1 text-lg text-[#6b7280]">Vos semestres enregistres avec de vraies notes</p>

                                    <div className="mt-5 relative pl-12 space-y-5">
                                        <div className="absolute left-4 top-4 bottom-4 w-px bg-[#d1d5db]" />
                                        {timeline.map((record, index) => {
                                            const active = record.inProgress > 0;

                                            return (
                                                <div key={record._id} className="relative">
                                                    <div
                                                        className={`absolute left-0 top-8 h-8 w-8 rounded-full border-4 flex items-center justify-center text-sm ${active
                                                            ? 'bg-[#1d4ed8] border-[#1d4ed8] text-white'
                                                            : 'bg-[#d1fae5] border-[#6ee7b7] text-[#059669]'
                                                            }`}
                                                    >
                                                        {index === 0 ? '◉' : active ? '○' : '✓'}
                                                    </div>

                                                    <SurfaceCard className={`ml-6 p-5 ${active ? 'border-[#1d4ed8]' : 'border-[#e6e8ee]'}`}>
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <h3 className="text-lg font-bold text-black">{record.semester}</h3>
                                                                <p className="text-lg text-[#6b7280] mt-1">Periode {semesterYearHint(record.semester)}</p>
                                                                <p className="mt-4 text-lg text-[#4b5563]">
                                                                    {record.courses.length} cours
                                                                    <span className="mx-2">{record.completed} valides</span>
                                                                    <span className="font-semibold text-black">{formatGrade(record.average)}</span>
                                                                </p>
                                                            </div>
                                                            <Pill className={active ? 'bg-[#1d4ed8] text-white' : 'bg-[#d1fae5] text-[#059669]'}>
                                                                {record.status}
                                                            </Pill>
                                                        </div>

                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            {record.courses.slice(0, 4).map((course, i) => (
                                                                <Pill key={`${record._id}-${i}`} className="bg-[#f3f4f6] text-[#111827]">
                                                                    {course.title}
                                                                </Pill>
                                                            ))}
                                                            {record.courses.length > 4 ? (
                                                                <Pill className="bg-[#eef2ff] text-[#1d4ed8]">+{record.courses.length - 4} autres</Pill>
                                                            ) : null}
                                                        </div>
                                                    </SurfaceCard>
                                                </div>
                                            );
                                        })}

                                        {timeline.length === 0 ? (
                                            <SurfaceCard className="ml-6 p-5">
                                                <p className="text-[#6b7280] text-lg">Aucun enregistrement academique pour le moment.</p>
                                            </SurfaceCard>
                                        ) : null}
                                    </div>
                                </SurfaceCard>

                                <SurfaceCard className="p-6 xl:col-span-2">
                                    <h3 className="text-lg font-bold text-black">Cours en cours</h3>
                                    <p className="mt-1 text-lg text-[#6b7280]">Suivi des cours academiques actifs</p>

                                    <div className="mt-5 space-y-6">
                                        {currentCourses.map((course) => (
                                            <div key={course.id}>
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-lg font-semibold text-black">{course.title}</h4>
                                                </div>
                                                <div className="mt-1 flex items-center justify-between text-lg text-[#6b7280]">
                                                    <span>{course.subtitle}</span>
                                                    <span className="font-semibold text-black">{course.score}</span>
                                                </div>
                                                <ProgressBar value={course.progress} className="mt-3" />
                                                <div className="mt-2 text-xl text-[#6b7280]">
                                                    {course.progress > 0 ? `${course.progress}% complete` : 'En cours de suivi'}
                                                </div>
                                            </div>
                                        ))}

                                        {currentCourses.length === 0 ? (
                                            <p className="text-[#6b7280] text-lg">Aucun cours actif pour le moment.</p>
                                        ) : null}
                                    </div>

                                    <div className="mt-6 pt-5 border-t border-[#e6e8ee] flex items-center justify-between text-lg">
                                        <span className="text-[#6b7280]">Cours encore en cours</span>
                                        <span className="font-semibold text-black">{stats.coursesInProgress}</span>
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
                            <h3 className="text-lg font-bold text-black">Ajouter un cours</h3>
                            <button onClick={() => setModalOpen(false)} className="text-lg">✕</button>
                        </div>

                        <form onSubmit={handleCreateCourse} className="mt-5 space-y-4">
                            {formError ? (
                                <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] text-[#b91c1c] px-4 py-2 text-sm">
                                    {formError}
                                </div>
                            ) : null}

                            <input
                                type="text"
                                placeholder="Semestre (ex: 2024-2025 S1)"
                                value={form.semester}
                                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                                className="w-full h-11 rounded-xl border border-[#d7dbe4] px-3"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Nom du cours"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full h-11 rounded-xl border border-[#d7dbe4] px-3"
                                required
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="Note (ex: 15.5/20)"
                                    value={form.grade}
                                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                                    className="h-11 rounded-xl border border-[#d7dbe4] px-3"
                                />
                                <input
                                    type="number"
                                    min={0}
                                    placeholder="Credits"
                                    value={form.credits}
                                    onChange={(e) => setForm({ ...form, credits: e.target.value })}
                                    className="h-11 rounded-xl border border-[#d7dbe4] px-3"
                                />
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
