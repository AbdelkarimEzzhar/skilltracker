'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { ActionButton, Pill, SectionTitle, SurfaceCard } from '@/components/student/DesignSystem';
import { competenceApi } from '@/lib/api';

interface Competence {
    _id: string;
    code: string;
    name: string;
    description: string;
    domain: string;
    level: string;
    category: string;
    createdAt: string;
}

interface CompetenceForm {
    code: string;
    name: string;
    description: string;
    domain: string;
    category: string;
    level: string;
}

const initialForm: CompetenceForm = {
    code: '',
    name: '',
    description: '',
    domain: '',
    category: '',
    level: 'Beginner',
};

export default function SkillManagementPage() {
    const [competences, setCompetences] = React.useState<Competence[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState('');
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);

    const [createOpen, setCreateOpen] = React.useState(false);
    const [editOpen, setEditOpen] = React.useState(false);
    const [submittingCreate, setSubmittingCreate] = React.useState(false);
    const [submittingEdit, setSubmittingEdit] = React.useState(false);

    const [createError, setCreateError] = React.useState('');
    const [editError, setEditError] = React.useState('');

    const [createForm, setCreateForm] = React.useState<CompetenceForm>(initialForm);
    const [editForm, setEditForm] = React.useState<CompetenceForm>(initialForm);
    const [editingSkill, setEditingSkill] = React.useState<Competence | null>(null);

    const fetchCompetences = React.useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { page, limit: 12 };
            if (search.trim()) params.search = search.trim();
            const response = await competenceApi.getAll(params);
            setCompetences(response.data?.data?.competences || []);
            setTotalPages(response.data?.data?.pagination?.pages || 1);
        } catch (error) {
            setCompetences([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    React.useEffect(() => {
        fetchCompetences();
    }, [fetchCompetences]);

    const openEdit = (skill: Competence) => {
        setEditingSkill(skill);
        setEditForm({
            code: skill.code,
            name: skill.name,
            description: skill.description,
            domain: skill.domain,
            category: skill.category,
            level: skill.level,
        });
        setEditError('');
        setEditOpen(true);
    };

    const handleAddSkill = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError('');

        if (!createForm.code || !createForm.name || !createForm.description || !createForm.domain || !createForm.category) {
            setCreateError('Tous les champs sont obligatoires.');
            return;
        }

        setSubmittingCreate(true);
        try {
            await competenceApi.create({
                code: createForm.code.toUpperCase(),
                name: createForm.name,
                description: createForm.description,
                domain: createForm.domain,
                category: createForm.category,
                level: createForm.level,
            });

            setCreateOpen(false);
            setCreateForm(initialForm);
            await fetchCompetences();
        } catch (error: any) {
            setCreateError(error?.response?.data?.error || 'Impossible de creer cette competence.');
        } finally {
            setSubmittingCreate(false);
        }
    };

    const handleEditSkill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSkill) return;

        setEditError('');
        setSubmittingEdit(true);

        try {
            await competenceApi.update(editingSkill._id, {
                name: editForm.name,
                description: editForm.description,
                domain: editForm.domain,
                category: editForm.category,
                level: editForm.level,
            });

            setEditOpen(false);
            setEditingSkill(null);
            await fetchCompetences();
        } catch (error: any) {
            setEditError(error?.response?.data?.error || 'Impossible de modifier cette competence.');
        } finally {
            setSubmittingEdit(false);
        }
    };

    const handleDeleteSkill = async (skillId: string) => {
        if (!window.confirm('Supprimer cette competence ?')) return;

        try {
            await competenceApi.delete(skillId);
            await fetchCompetences();
        } catch (error: any) {
            window.alert(error?.response?.data?.error || 'Impossible de supprimer cette competence.');
        }
    };

    return (
        <ProtectedRoute requiredRole="ADMIN">
            <Layout>
                <div className="max-w-[1600px] mx-auto space-y-6">
                    <SectionTitle
                        title="Gestion des competences"
                        subtitle="Creation, edition et suivi du referentiel"
                        actions={
                            <ActionButton variant="primary" onClick={() => {
                                setCreateError('');
                                setCreateOpen(true);
                            }}>
                                Ajouter une competence
                            </ActionButton>
                        }
                    />

                    <SurfaceCard className="p-5">
                        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                            <input
                                placeholder="Rechercher par nom, domaine ou categorie..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full md:max-w-xl h-11 rounded-xl border border-[#d7dbe4] px-3"
                            />
                            <ActionButton onClick={fetchCompetences}>Actualiser</ActionButton>
                        </div>
                    </SurfaceCard>

                    {loading ? (
                        <SurfaceCard className="p-6">
                            <p className="text-[#4b5563] text-base">Chargement des competences...</p>
                        </SurfaceCard>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {competences.map((comp) => (
                                    <SurfaceCard key={comp._id} className="p-5 border-l-4 border-l-[#1d4ed8]">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-xl font-bold text-black">{comp.name}</h3>
                                                <p className="text-sm text-[#6b7280] mt-1">{comp.code}</p>
                                            </div>
                                            <Pill className="bg-[#eef2ff] text-[#1d4ed8]">{comp.level}</Pill>
                                        </div>

                                        <p className="mt-3 text-sm text-[#4b5563] leading-relaxed">{comp.description}</p>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Pill className="bg-[#f3f4f6] text-[#111827]">{comp.domain}</Pill>
                                            <Pill className="bg-[#dcfce7] text-[#15803d]">{comp.category}</Pill>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-[#eef0f5] flex gap-2">
                                            <ActionButton className="h-9 px-3 text-sm" onClick={() => openEdit(comp)}>
                                                Editer
                                            </ActionButton>
                                            <ActionButton className="h-9 px-3 text-sm" onClick={() => handleDeleteSkill(comp._id)}>
                                                Supprimer
                                            </ActionButton>
                                        </div>
                                    </SurfaceCard>
                                ))}

                                {competences.length === 0 ? (
                                    <SurfaceCard className="p-6 md:col-span-2 xl:col-span-3">
                                        <p className="text-[#6b7280] text-base">Aucune competence trouvee.</p>
                                    </SurfaceCard>
                                ) : null}
                            </div>

                            <SurfaceCard className="p-4 flex items-center justify-between">
                                <ActionButton
                                    className="h-9 px-3 text-sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                >
                                    Precedent
                                </ActionButton>
                                <p className="text-sm text-[#6b7280]">Page {page} / {totalPages}</p>
                                <ActionButton
                                    className="h-9 px-3 text-sm"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                >
                                    Suivant
                                </ActionButton>
                            </SurfaceCard>
                        </>
                    )}
                </div>
            </Layout>

            {createOpen ? (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <SurfaceCard className="w-full max-w-2xl p-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-black">Ajouter une competence</h3>
                            <button onClick={() => setCreateOpen(false)} className="text-xl">✕</button>
                        </div>

                        <form onSubmit={handleAddSkill} className="mt-5 space-y-4">
                            {createError ? (
                                <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] text-[#b91c1c] px-4 py-2 text-sm">
                                    {createError}
                                </div>
                            ) : null}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input className="h-11 rounded-xl border border-[#d7dbe4] px-3" placeholder="Code" value={createForm.code} onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })} />
                                <input className="h-11 rounded-xl border border-[#d7dbe4] px-3" placeholder="Nom" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
                                <input className="h-11 rounded-xl border border-[#d7dbe4] px-3" placeholder="Domaine" value={createForm.domain} onChange={(e) => setCreateForm({ ...createForm, domain: e.target.value })} />
                                <input className="h-11 rounded-xl border border-[#d7dbe4] px-3" placeholder="Categorie" value={createForm.category} onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })} />
                                <select className="h-11 rounded-xl border border-[#d7dbe4] px-3" value={createForm.level} onChange={(e) => setCreateForm({ ...createForm, level: e.target.value })}>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                    <option value="Expert">Expert</option>
                                    <option value="Debutant">Debutant</option>
                                    <option value="Intermediaire">Intermediaire</option>
                                    <option value="Avance">Avance</option>
                                </select>
                            </div>

                            <textarea
                                rows={4}
                                className="w-full rounded-xl border border-[#d7dbe4] px-3 py-2"
                                placeholder="Description"
                                value={createForm.description}
                                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                            />

                            <div className="flex justify-end gap-2 pt-2">
                                <ActionButton type="button" onClick={() => setCreateOpen(false)}>Annuler</ActionButton>
                                <ActionButton variant="primary" type="submit" disabled={submittingCreate}>
                                    {submittingCreate ? 'Creation...' : 'Creer'}
                                </ActionButton>
                            </div>
                        </form>
                    </SurfaceCard>
                </div>
            ) : null}

            {editOpen ? (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <SurfaceCard className="w-full max-w-2xl p-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-black">Editer competence</h3>
                            <button onClick={() => setEditOpen(false)} className="text-xl">✕</button>
                        </div>

                        <form onSubmit={handleEditSkill} className="mt-5 space-y-4">
                            {editError ? (
                                <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] text-[#b91c1c] px-4 py-2 text-sm">
                                    {editError}
                                </div>
                            ) : null}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input className="h-11 rounded-xl border border-[#d7dbe4] px-3" placeholder="Nom" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                                <input className="h-11 rounded-xl border border-[#d7dbe4] px-3" placeholder="Domaine" value={editForm.domain} onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })} />
                                <input className="h-11 rounded-xl border border-[#d7dbe4] px-3" placeholder="Categorie" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
                                <select className="h-11 rounded-xl border border-[#d7dbe4] px-3" value={editForm.level} onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                    <option value="Expert">Expert</option>
                                    <option value="Debutant">Debutant</option>
                                    <option value="Intermediaire">Intermediaire</option>
                                    <option value="Avance">Avance</option>
                                </select>
                            </div>

                            <textarea
                                rows={4}
                                className="w-full rounded-xl border border-[#d7dbe4] px-3 py-2"
                                placeholder="Description"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            />

                            <div className="flex justify-end gap-2 pt-2">
                                <ActionButton type="button" onClick={() => setEditOpen(false)}>Annuler</ActionButton>
                                <ActionButton variant="primary" type="submit" disabled={submittingEdit}>
                                    {submittingEdit ? 'Enregistrement...' : 'Enregistrer'}
                                </ActionButton>
                            </div>
                        </form>
                    </SurfaceCard>
                </div>
            ) : null}
        </ProtectedRoute>
    );
}
