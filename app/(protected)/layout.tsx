import { ProtectedLayout } from '@/components/layout/protected-layout';

export default function ProtectedRouteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ProtectedLayout>{children}</ProtectedLayout>;
}
