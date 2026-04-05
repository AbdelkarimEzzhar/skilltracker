'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'ADMIN' | 'STUDENT';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredRole,
}) => {
    const router = useRouter();
    const { user, setUser } = useAuthStore();
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                const response = await authApi.getCurrentUser();
                const userData = response.data.data;
                setUser(userData);

                const normalizedRole = userData.role?.toUpperCase();
                if (requiredRole && normalizedRole !== requiredRole) {
                    router.push('/unauthorized');
                    return;
                }

                setLoading(false);
            } catch (error) {
                router.push('/login');
            }
        };

        verifyAuth();
    }, [requiredRole, router, setUser]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
