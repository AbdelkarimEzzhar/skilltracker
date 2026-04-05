import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'SkillTrack - Academic and Professional Companion',
    description: 'An innovative platform designed to empower students of INPT',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
