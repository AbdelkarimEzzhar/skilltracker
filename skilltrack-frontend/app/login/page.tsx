'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';
import { Card, Button, Input } from '@/components/UI';

export default function LoginPage() {
    const router = useRouter();
    const { setUser } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authApi.login({ email, password });
            const userData = response.data.data.user;
            setUser(userData);

            const userRole = userData.role?.toUpperCase();
            router.push(userRole === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-4">
            <Card className="w-full max-w-md">
                <div className="text-center mb-6">
                    <h1 className="text-4xl font-bold text-primary mb-2">SkillTrack</h1>
                    <p className="text-gray-600">Academic and Professional Companion</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-error px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </Button>
                </form>

                <p className="text-center text-gray-600 text-sm mt-4">
                    Demo: Use admin credentials from your backend setup
                </p>
            </Card>
        </div>
    );
}
