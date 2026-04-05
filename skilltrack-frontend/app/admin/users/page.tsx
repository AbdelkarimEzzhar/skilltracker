'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { ActionButton, Pill, SectionTitle, SurfaceCard } from '@/components/student/DesignSystem';
import { usersApi, authApi, filieresApi } from '@/lib/api';

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'ADMIN' | 'STUDENT' | string;
    status?: 'active' | 'inactive' | string;
    filiereId?: string;
    niveau?: string;
    createdAt: string;
}

interface Filiere {
    _id: string;
    titre: string;
}

interface CreateUserForm {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    role: 'ADMIN' | 'STUDENT';
    status: 'active' | 'inactive';
    filiereId: string;
    niveau: string;
}

interface EditUserForm {
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'STUDENT';
    status: 'active' | 'inactive';
    filiereId: string;
    niveau: string;
}

const initialCreateForm: CreateUserForm = {
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    role: 'STUDENT',
    status: 'active',
    filiereId: '',
    niveau: '',
};

const initialEditForm: EditUserForm = {
    firstName: '',
    lastName: '',
    role: 'STUDENT',
    status: 'active',
    filiereId: '',
    niveau: '',
};

export default function UserManagementPage() {
    const [users, setUsers] = React.useState<User[]>([]);
    const [filieres, setFilieres] = React.useState<Filiere[]>([]);
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

    const [createForm, setCreateForm] = React.useState<CreateUserForm>(initialCreateForm);
    const [editForm, setEditForm] = React.useState<EditUserForm>(initialEditForm);
    const [editingUser, setEditingUser] = React.useState<User | null>(null);

    const fetchUsers = React.useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { page, limit: 10 };
            if (search.trim()) params.search = search.trim();

            const response = await usersApi.getAll(params);
            setUsers(response.data?.data?.users || []);
            setTotalPages(response.data?.data?.pagination?.pages || 1);
        } catch (error) {
            setUsers([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    React.useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    React.useEffect(() => {
        const fetchFilieres = async () => {
            try {
                const response = await filieresApi.getAll({ limit: 200 });
                setFilieres(response.data?.data?.filieres || []);
            } catch (error) {
                setFilieres([]);
            }
        };

        fetchFilieres();
    }, []);

    const openEdit = (user: User) => {
        setEditingUser(user);
        setEditForm({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            role: (user.role as 'ADMIN' | 'STUDENT') || 'STUDENT',
            status: (user.status as 'active' | 'inactive') || 'active',
            filiereId: user.filiereId || '',
            niveau: user.niveau || '',
        });
        setEditError('');
        setEditOpen(true);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError('');

        if (!createForm.firstName || !createForm.lastName || !createForm.email || !createForm.username || !createForm.password) {
            setCreateError('Tous les champs obligatoires doivent etre remplis.');
            return;
        }

        if (createForm.password.length < 6) {
            setCreateError('Le mot de passe doit contenir au moins 6 caracteres.');
            return;
        }

        if (createForm.role === 'STUDENT' && !createForm.filiereId) {
            setCreateError('La filiere est obligatoire pour un etudiant.');
            return;
        }

        setSubmittingCreate(true);
        try {
            await authApi.register({
                firstName: createForm.firstName,
                lastName: createForm.lastName,
                email: createForm.email,
                username: createForm.username,
                password: createForm.password,
                role: createForm.role,
                status: createForm.status,
                filiereId: createForm.role === 'STUDENT' ? createForm.filiereId : undefined,
                niveau: createForm.role === 'STUDENT' ? createForm.niveau : undefined,
            });

            setCreateOpen(false);
            setCreateForm(initialCreateForm);
            await fetchUsers();
        } catch (error: any) {
            setCreateError(error?.response?.data?.error || 'Impossible de creer cet utilisateur.');
        } finally {
            setSubmittingCreate(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setEditError('');
        setSubmittingEdit(true);

        try {
            await usersApi.update(editingUser._id, {
                firstName: editForm.firstName,
                lastName: editForm.lastName,
                role: editForm.role,
                status: editForm.status,
                filiereId: editForm.role === 'STUDENT' ? editForm.filiereId : undefined,
                niveau: editForm.role === 'STUDENT' ? editForm.niveau : undefined,
            });

            setEditOpen(false);
            setEditingUser(null);
            await fetchUsers();
        } catch (error: any) {
            setEditError(error?.response?.data?.error || 'Impossible de mettre a jour cet utilisateur.');
        } finally {
            setSubmittingEdit(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Supprimer cet utilisateur ?')) return;

        try {
            await usersApi.delete(id);
            await fetchUsers();
        } catch (error: any) {
            window.alert(error?.response?.data?.error || 'Impossible de supprimer cet utilisateur.');
        }
    };

    return (
        <ProtectedRoute requiredRole="ADMIN">
            <Layout>
                <div className="max-w-[1600px] mx-auto space-y-6">
                    <SectionTitle
                        title="Gestion des utilisateurs"
                        subtitle="Creation, edition et suivi des comptes"
                        actions={
                            <ActionButton variant="primary" onClick={() => {
                                setCreateError('');
                                setCreateOpen(true);
                            }}>
                                Ajouter un utilisateur
                            </ActionButton>
                        }
                    />

                    <SurfaceCard className="p-5">
                        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                            <input
                                placeholder="Rechercher par nom, email ou username..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full md:max-w-xl h-11 rounded-xl border border-[#d7dbe4] px-3"
                            />
                            <ActionButton onClick={fetchUsers}>Actualiser</ActionButton>
                        </div>
                    </SurfaceCard>

                    {loading ? (
                        <SurfaceCard className="p-6">
                            <p className="text-[#4b5563] text-base">Chargement des utilisateurs...</p>
                        </SurfaceCard>
                    ) : (
                        <SurfaceCard className="p-0 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-[#f8f9fb] text-[#374151]">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Nom</th>
                                            <th className="px-4 py-3 text-left">Email</th>
                                            <th className="px-4 py-3 text-left">Role</th>
                                            <th className="px-4 py-3 text-left">Statut</th>
                                            <th className="px-4 py-3 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user._id} className="border-t border-[#eef0f5]">
                                                <td className="px-4 py-3 font-medium text-[#111827]">{user.firstName} {user.lastName}</td>
                                                <td className="px-4 py-3 text-[#4b5563]">{user.email}</td>
                                                <td className="px-4 py-3">
                                                    <Pill className={user.role === 'ADMIN' ? 'bg-[#dbeafe] text-[#1d4ed8]' : 'bg-[#dcfce7] text-[#15803d]'}>
                                                        {user.role}
                                                    </Pill>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Pill className={user.status === 'inactive' ? 'bg-[#fef3c7] text-[#b45309]' : 'bg-[#d1fae5] text-[#059669]'}>
                                                        {user.status || 'active'}
                                                    </Pill>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2">
                                                        <ActionButton className="h-9 px-3 text-sm" onClick={() => openEdit(user)}>
                                                            Editer
                                                        </ActionButton>
                                                        <ActionButton className="h-9 px-3 text-sm" onClick={() => handleDelete(user._id)}>
                                                            Supprimer
                                                        </ActionButton>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {users.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-[#6b7280]">
                                                    Aucun utilisateur trouve.
                                                </td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>

                            <div className="border-t border-[#eef0f5] p-4 flex items-center justify-between">
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
                            </div>
                        </SurfaceCard>
                    )}
                </div>
            </Layout>

            {createOpen ? (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <SurfaceCard className="w-full max-w-2xl p-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-black">Ajouter un utilisateur</h3>
                            <button onClick={() => setCreateOpen(false)} className="text-xl">✕</button>
                        </div>

                        <form onSubmit={handleCreate} className="mt-5 space-y-4">
                            {createError ? (
                                <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] text-[#b91c1c] px-4 py-2 text-sm">
                                    {createError}
                                </div>
                            ) : null}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input className="h-11 rounded-xl border border-[#d7dbe4] px-3" placeholder="Prenom" value={createForm.firstName} onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })} />
                                <input className="h-11 rounded-xl border border-[#d7dbe4] px-3" placeholder="Nom" value={createForm.lastName} onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })} />
                                <input className="h-11 rounded-xl border border-[#d7dbe4] px-3" placeholder="Email" type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
                                <input className="h-11 rounded-xl border border-[#d7dbe4] px-3" placeholder="Username" value={createForm.username} onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })} />
                                <input className="h-11 rounded-xl border border-[#d7dbe4] px-3" placeholder="Mot de passe" type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
                                <select className="h-11 rounded-xl border border-[#d7dbe4] px-3" value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as 'ADMIN' | 'STUDENT' })}>
                                    <option value="STUDENT">STUDENT</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                                <select className="h-11 rounded-xl border border-[#d7dbe4] px-3" value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as 'active' | 'inactive' })}>
                                    <option value="active">active</option>
                                    <option value="inactive">inactive</option>
                                </select>

                                {createForm.role === 'STUDENT' ? (
                                    <>
                                        <select className="h-11 rounded-xl border border-[#d7dbe4] px-3" value={createForm.filiereId} onChange={(e) => setCreateForm({ ...createForm, filiereId: e.target.value })}>
                                            <option value="">Choisir une filiere</option>
                                            {filieres.map((filiere) => (
                                                <option key={filiere._id} value={filiere._id}>{filiere.titre}</option>
                                            ))}
                                        </select>
                                        <input className="h-11 rounded-xl border border-[#d7dbe4] px-3" placeholder="Niveau" value={createForm.niveau} onChange={(e) => setCreateForm({ ...createForm, niveau: e.target.value })} />
                                    </>
                                ) : null}
                            </div>

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
                            <h3 className="text-lg font-bold text-black">Editer utilisateur</h3>
                            <button onClick={() => setEditOpen(false)} className="text-xl">✕</button>
                        </div>

                        <form onSubmit={handleUpdate} className="mt-5 space-y-4">
                            {editError ? (
                                <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] text-[#b91c1c] px-4 py-2 text-sm">
                                    {editError}
                                </div>
                            ) : null}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input className="h-11 rounded-xl border border-[#d7dbe4] px-3" placeholder="Prenom" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
                                <input className="h-11 rounded-xl border border-[#d7dbe4] px-3" placeholder="Nom" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
                                <select className="h-11 rounded-xl border border-[#d7dbe4] px-3" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'ADMIN' | 'STUDENT' })}>
                                    <option value="STUDENT">STUDENT</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                                <select className="h-11 rounded-xl border border-[#d7dbe4] px-3" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'inactive' })}>
                                    <option value="active">active</option>
                                    <option value="inactive">inactive</option>
                                </select>

                                {editForm.role === 'STUDENT' ? (
                                    <>
                                        <select className="h-11 rounded-xl border border-[#d7dbe4] px-3" value={editForm.filiereId} onChange={(e) => setEditForm({ ...editForm, filiereId: e.target.value })}>
                                            <option value="">Choisir une filiere</option>
                                            {filieres.map((filiere) => (
                                                <option key={filiere._id} value={filiere._id}>{filiere.titre}</option>
                                            ))}
                                        </select>
                                        <input className="h-11 rounded-xl border border-[#d7dbe4] px-3" placeholder="Niveau" value={editForm.niveau} onChange={(e) => setEditForm({ ...editForm, niveau: e.target.value })} />
                                    </>
                                ) : null}
                            </div>

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
