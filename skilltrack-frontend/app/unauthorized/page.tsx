'use client';

import { Card, Button } from '@/components/UI';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-4">
            <Card className="w-full max-w-md text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-600 mb-6">
                    You don't have permission to access this page. Please check your account role.
                </p>
                <Button variant="primary" onClick={() => router.back()}>
                    Go Back
                </Button>
            </Card>
        </div>
    );
}
