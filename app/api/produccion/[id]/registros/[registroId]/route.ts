import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export async function PUT(
    request: Request,
    { params }: { params: { id: string; registroId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { id, registroId } = params;
        const body = await request.json();
        const { turno, fecha, operario, cantidad, reporte, merma, mermaSinImpresion, mermaImpreso } = body;

        // Actualizar registro
        const registro = await prisma.registroProduccion.update({
            where: { id: registroId },
            data: {
                turno,
                fecha: fecha ? new Date(fecha) : new Date(),
                operario,
                cantidad: cantidad ? parseFloat(cantidad.toString()) : 0,
                reporte,
                merma: merma ? parseFloat(merma.toString()) : 0,
                mermaSinImpresion: mermaSinImpresion ? parseFloat(mermaSinImpresion.toString()) : null,
                mermaImpreso: mermaImpreso ? parseFloat(mermaImpreso.toString()) : null,
            },
        });

        // Recalcular el total de la producción
        const todosRegistros = await prisma.registroProduccion.findMany({
            where: { produccionId: id },
        });

        const totalCantidad = todosRegistros.reduce((sum, r) => sum + r.cantidad, 0);
        const totalMerma = todosRegistros.reduce((sum, r) => sum + r.merma, 0);

        // Actualizar cantidad total en la producción principal
        const produccion = await prisma.produccion.update({
            where: { id },
            data: {
                cantidadProducida: totalCantidad,
                merma: totalMerma,
            },
            include: {
                productoTerminado: true
            }
        });

        // Re-sincronizar cantidadDisponible de la tarjeta Kanban global de "En Proceso" si existe
        if (produccion.productoTerminado) {
            await prisma.productoTerminado.update({
                where: { id: produccion.productoTerminado.id },
                data: {
                    cantidadTotal: totalCantidad,
                    cantidadDisponible: totalCantidad, // Assuming it's still in process and hasn't been consumed yet
                }
            });
        }

        return NextResponse.json(registro);
    } catch (error) {
        console.error('Error al actualizar registro de producción:', error);
        return NextResponse.json({ error: 'Error al actualizar registro' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string; registroId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any)?.rol !== 'admin') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { id, registroId } = params;

        await prisma.registroProduccion.delete({
            where: { id: registroId },
        });

        // Recalcular el total de la producción
        const todosRegistros = await prisma.registroProduccion.findMany({
            where: { produccionId: id },
        });

        const totalCantidad = todosRegistros.reduce((sum, r) => sum + r.cantidad, 0);
        const totalMerma = todosRegistros.reduce((sum, r) => sum + r.merma, 0);

        const produccion = await prisma.produccion.update({
            where: { id },
            data: {
                cantidadProducida: totalCantidad,
                merma: totalMerma,
            },
            include: {
                productoTerminado: true
            }
        });

        if (produccion.productoTerminado) {
            await prisma.productoTerminado.update({
                where: { id: produccion.productoTerminado.id },
                data: {
                    cantidadTotal: totalCantidad,
                    cantidadDisponible: totalCantidad,
                }
            });
        }

        return NextResponse.json({ message: 'Registro eliminado' });
    } catch (error) {
        console.error('Error al eliminar registro de producción:', error);
        return NextResponse.json({ error: 'Error al eliminar registro' }, { status: 500 });
    }
}
