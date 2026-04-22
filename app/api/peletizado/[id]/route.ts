import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';


export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const registro = await prisma.peletizado.findUnique({
      where: { id: params.id },
      include: {
        maquina: true,
      },
    });

    if (!registro) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    return NextResponse.json(registro);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al obtener registro' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { operario, materialEntrada, materialSalida, colorPelet, tipoMaterial, observaciones } = body;

    const updateData: any = {};
    if (operario !== undefined) updateData.operario = operario;
    if (materialEntrada !== undefined) {
      updateData.materialEntrada = parseFloat(materialEntrada);
    }
    if (materialSalida !== undefined) {
      updateData.materialSalida = parseFloat(materialSalida);
    }
    if (materialEntrada !== undefined && materialSalida !== undefined) {
      const merma = parseFloat(materialEntrada) - parseFloat(materialSalida);
      updateData.merma = merma > 0 ? merma : 0;
    }
    if (colorPelet !== undefined) updateData.colorPelet = colorPelet;
    if (tipoMaterial !== undefined) updateData.tipoMaterial = tipoMaterial;
    if (observaciones !== undefined) updateData.observaciones = observaciones;

    const registro = await prisma.peletizado.update({
      where: { id: params.id },
      data: updateData,
      include: {
        maquina: true,
      },
    });

    return NextResponse.json(registro);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al actualizar registro' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.rol !== 'admin') {
      return NextResponse.json({ error: 'Solo admin puede eliminar' }, { status: 403 });
    }

    await prisma.peletizado.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Registro eliminado' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al eliminar registro' }, { status: 500 });
  }
}
