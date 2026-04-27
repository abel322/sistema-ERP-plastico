import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Rol } from '@prisma/client';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ usuarios });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { nombre, email, password, rol, activo } = await request.json();

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: 'Nombre, email y contraseña son requeridos' }, { status: 400 });
    }

    // Verificar email único
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = await prisma.user.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        rol: rol as Rol || Rol.usuario,
        activo: activo ?? true,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
    });

    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}
