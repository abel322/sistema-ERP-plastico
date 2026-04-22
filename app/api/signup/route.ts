import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Rol } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, nombre, rol } = body;

    if (!email || !password || !nombre) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El correo electrónico ya está registrado' },
        { status: 400 }
      );
    }

    // Verificar si es el primer usuario (será admin automáticamente)
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        rol: isFirstUser ? Rol.admin : (rol || Rol.usuario),
      },
    });

    return NextResponse.json(
      {
        message: 'Usuario creado exitosamente',
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          rol: user.rol,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en signup:', error);
    return NextResponse.json(
      { error: 'Error al crear el usuario' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
