import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { verifyActionPassword } from '@/lib/verify-action-password';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { password } = body;

        if (!password) {
            return NextResponse.json({ error: 'Falta la contraseña' }, { status: 400 });
        }

        // Usar la función centralizada de verificación
        const verification = await verifyActionPassword(session.user.email, password);

        if (!verification.valid) {
            return NextResponse.json({ error: verification.error || 'Contraseña incorrecta' }, { status: 401 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error verificando contraseña de acción:', error);
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
}
