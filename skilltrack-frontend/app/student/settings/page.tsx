'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { ActionButton, SectionTitle, SurfaceCard } from '@/components/student/DesignSystem';
import { filieresApi, studentApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface Filiere {
    _id: string;
    titre: string;
}

export default function StudentSettingsPage() {
    const { setUser } = useAuthStore();
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [message, setMessage] = React.useState('');
    const [error, setError] = React.useState('');
    const [filieres, setFilieres] = React.useState<Filiere[]>([]);
    const [form, setForm] = React.useState({
        firstName: '',
        lastName: '',
        bio: '',
        niveau: '',
        filiereId: '',
        location: '',
        phone: '',
        linkedinUrl: '',
        githubUrl: '',
    });

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, filieresRes] = await Promise.all([
                    studentApi.getProfile(),
                    filieresApi.getAll({ limit: 200 }),
                ]);

                const profile = profileRes.data?.data;
                setForm({
                    firstName: profile?.firstName || '',
                    lastName: profile?.lastName || '',
                    bio: profile?.bio || '',
                    niveau: profile?.niveau || '',
                    filiereId: profile?.filiereId || '',
                    location: profile?.location || '',
                    phone: profile?.phone || '',
                    linkedinUrl: profile?.linkedinUrl || '',
                    githubUrl: profile?.githubUrl || '',
                });
                setFilieres(filieresRes.data?.data?.filieres || []);
            } catch (err) {
                setError('Impossible de charger les parametres.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setMessage('');

        try {
            const response = await studentApi.updateProfile({
                firstName: form.firstName,
                lastName: form.lastName,
                bio: form.bio,
                niveau: form.niveau,
                filiereId: form.filiereId || undefined,
                location: form.location,
                phone: form.phone,
                linkedinUrl: form.linkedinUrl,
                githubUrl: form.githubUrl,
            });

            setUser(response.data?.data);
            setMessage('Parametres enregistres avec succes.');
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Echec de la sauvegarde.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ProtectedRoute requiredRole="STUDENT">
            <Layout>
                <div className="max-w-[1200px] mx-auto space-y-6">
                    <SectionTitle
                        title="Parametres"
                        subtitle="Gerez vos preferences de compte"
                        actions={
                            <ActionButton variant="primary" onClick={handleSave} disabled={saving || loading}>
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </ActionButton>
                        }
                    />

                    <SurfaceCard className="p-6">
                        <h2 className="text-lg font-bold text-black">Profil</h2>

                        {loading ? <p className="mt-4 text-[#6b7280] text-lg">Chargement...</p> : null}
                        {error ? <p className="mt-4 text-[#b91c1c] text-sm">{error}</p> : null}
                        {message ? <p className="mt-4 text-[#059669] text-sm">{message}</p> : null}

                        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-[#374151] mb-2">Prenom</label>
                                <input
                                    value={form.firstName}
                                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                    className="w-full h-11 rounded-xl border border-[#d7dbe4] px-3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[#374151] mb-2">Nom</label>
                                <input
                                    value={form.lastName}
                                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                    className="w-full h-11 rounded-xl border border-[#d7dbe4] px-3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[#374151] mb-2">Niveau</label>
                                <input
                                    value={form.niveau}
                                    onChange={(e) => setForm({ ...form, niveau: e.target.value })}
                                    className="w-full h-11 rounded-xl border border-[#d7dbe4] px-3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[#374151] mb-2">Filiere</label>
                                <select
                                    value={form.filiereId}
                                    onChange={(e) => setForm({ ...form, filiereId: e.target.value })}
                                    className="w-full h-11 rounded-xl border border-[#d7dbe4] px-3"
                                >
                                    <option value="">Aucune</option>
                                    {filieres.map((filiere) => (
                                        <option key={filiere._id} value={filiere._id}>{filiere.titre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm text-[#374151] mb-2">Bio</label>
                                <textarea
                                    value={form.bio}
                                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                    rows={5}
                                    className="w-full rounded-xl border border-[#d7dbe4] px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-[#374151] mb-2">Ville / Localisation</label>
                                <input
                                    value={form.location}
                                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                                    className="w-full h-11 rounded-xl border border-[#d7dbe4] px-3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[#374151] mb-2">Telephone</label>
                                <input
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="w-full h-11 rounded-xl border border-[#d7dbe4] px-3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[#374151] mb-2">Lien LinkedIn</label>
                                <input
                                    value={form.linkedinUrl}
                                    onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                                    className="w-full h-11 rounded-xl border border-[#d7dbe4] px-3"
                                    placeholder="https://linkedin.com/in/..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[#374151] mb-2">Lien GitHub</label>
                                <input
                                    value={form.githubUrl}
                                    onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                                    className="w-full h-11 rounded-xl border border-[#d7dbe4] px-3"
                                    placeholder="https://github.com/..."
                                />
                            </div>
                        </div>
                    </SurfaceCard>
                </div>
            </Layout>
        </ProtectedRoute>
    );
}
