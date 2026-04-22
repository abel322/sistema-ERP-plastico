import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';
import { TipoMovimiento } from '@prisma/client';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { inventarioId, cantidad, tipo, fluidez, densidad, fecha, lote } = await request.json();

        if (!inventarioId || !cantidad) {
            return NextResponse.json({ error: 'Faltan datos requeridos (inventarioId, cantidad)' }, { status: 400 });
        }

        const cantidadIn = parseFloat(cantidad);

        // Obtener el inventario
        const inv = await prisma.inventario.findUnique({ where: { id: inventarioId } });
        if (!inv) return NextResponse.json({ error: 'Materia prima no encontrada' }, { status: 404 });

        // Referencia estructurada para parámetros de calidad de ingreso
        const refData = [];
        if (lote) refData.push(`Lote:${lote}`);
        if (tipo) refData.push(`Tipo:${tipo}`);
        if (fluidez) refData.push(`IF:${fluidez}`);
        if (densidad) refData.push(`Dens:${densidad}`);

        const referenciaFormateada = refData.join(' | ') || 'Ingreso Regular';

        const [movimiento] = await prisma.$transaction([
            prisma.movimientoInventario.create({
                data: {
                    inventarioId,
                    tipo: TipoMovimiento.Entrada,
                    cantidad: cantidadIn,
                    motivo: 'Recepción de Materia Prima',
                    referencia: referenciaFormateada,
                    responsable: session.user?.name || 'Sistema',
                    fecha: fecha ? new Date(fecha) : new Date(),
                }
            }),
            prisma.inventario.update({
                where: { id: inventarioId },
                data: {
                    cantidad: { increment: cantidadIn }
                }
            })
        ]);

        return NextResponse.json({ success: true, movimiento });
    } catch (error) {
        console.error('Error registrando entrada MP:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
