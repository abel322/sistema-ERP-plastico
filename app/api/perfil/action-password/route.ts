import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 4 caracteres' },
        { status: 400 }
      );
    }

    const userEmail = (session.user as { email?: string })?.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'Email no encontrado' }, { status: 400 });
    }

    // Actualizar la contraseña de acción
    await prisma.user.update({
      where: { email: userEmail },
      data: { actionPassword: newPassword }
    });

    return NextResponse.json({ 
      message: 'Contraseña de acción actualizada correctamente' 
    });
  } catch (error) {
    console.error('Error al actualizar contraseña de acción:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
