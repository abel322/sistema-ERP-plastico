import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// Obtener pedidos filtrados por tipo de producto del cliente
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipoProducto = searchParams.get('tipoProducto'); // Bolsa o Bobina

    if (!tipoProducto) {
      return NextResponse.json({ error: 'Se requiere tipoProducto' }, { status: 400 });
    }

    // Obtener pedidos pendientes o en proceso cuyos clientes tienen el tipo de producto especificado
    const pedidos = await prisma.pedido.findMany({
      where: {
        estado: {
          in: ['Pendiente', 'EnProceso'],
        },
        cliente: {
          tipoProducto: tipoProducto as 'Bolsa' | 'Bobina',
        },
      },
      include: {
        cliente: {
          select: {
            nombre: true,
            tipoProducto: true,
          },
        },
      },
      orderBy: [
        { prioridad: 'desc' },
        { fechaEntrega: 'asc' },
      ],
    });

    return NextResponse.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos por tipo:', error);
    return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 });
  }
}
