import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { EstadoMejora } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';


// GET: Obtener una mejora
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const mejora = await prisma.mejoraContinua.findUnique({
      where: { id: params.id },
      include: {
        maquina: true,
      },
    });

    if (!mejora) {
      return NextResponse.json(
        { error: 'Mejora no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(mejora);
  } catch (error) {
    console.error('Error al obtener mejora:', error);
    return NextResponse.json(
      { error: 'Error al obtener mejora' },
      { status: 500 }
    );
  }
}

// PUT: Actualizar mejora
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const existente = await prisma.mejoraContinua.findUnique({
      where: { id: params.id },
    });

    if (!existente) {
      return NextResponse.json(
        { error: 'Mejora no encontrada' },
        { status: 404 }
      );
    }

    const data = await request.json();
    const updateData: Record<string, unknown> = {};

    // Campos que se pueden actualizar
    if (data.titulo !== undefined) updateData.titulo = data.titulo;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.problema !== undefined) updateData.problema = data.problema;
    if (data.solucionPropuesta !== undefined) updateData.solucionPropuesta = data.solucionPropuesta;
    if (data.solucionImplementada !== undefined) updateData.solucionImplementada = data.solucionImplementada;
    if (data.responsable !== undefined) updateData.responsable = data.responsable;
    if (data.costoEstimado !== undefined) updateData.costoEstimado = data.costoEstimado ? parseFloat(data.costoEstimado) : null;
    if (data.ahorroEstimado !== undefined) updateData.ahorroEstimado = data.ahorroEstimado ? parseFloat(data.ahorroEstimado) : null;
    if (data.resultados !== undefined) updateData.resultados = data.resultados;
    if (data.observaciones !== undefined) updateData.observaciones = data.observaciones;

    // Cambio de estado con lógica especial
    if (data.estado !== undefined) {
      updateData.estado = data.estado as EstadoMejora;
      
      // Si se implementa, guardar fecha de implementación
      if (data.estado === 'Implementada' && !existente.fechaImplementacion) {
        updateData.fechaImplementacion = new Date();
      }
    }

    const mejora = await prisma.mejoraContinua.update({
      where: { id: params.id },
      data: updateData,
      include: {
        maquina: true,
      },
    });

    return NextResponse.json(mejora);
  } catch (error) {
    console.error('Error al actualizar mejora:', error);
    return NextResponse.json(
      { error: 'Error al actualizar mejora' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar mejora
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admin puede eliminar
    if ((session.user as { rol?: string }).rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const existente = await prisma.mejoraContinua.findUnique({
      where: { id: params.id },
    });

    if (!existente) {
      return NextResponse.json(
        { error: 'Mejora no encontrada' },
        { status: 404 }
      );
    }

    await prisma.mejoraContinua.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar mejora:', error);
    return NextResponse.json(
      { error: 'Error al eliminar mejora' },
      { status: 500 }
    );
  }
}
