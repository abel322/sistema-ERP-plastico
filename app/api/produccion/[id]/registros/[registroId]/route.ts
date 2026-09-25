import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
        const { turno, fecha, operario, cantidad, reporte, merma, mermaColor, mermaCristal, mermaSinImpresion, mermaImpreso } = body;

        const produccionExistente = await prisma.produccion.findUnique({
            where: { id },
            include: {
                pedido: { include: { cliente: true, productoCliente: true } },
                productoCliente: true,
            }
        });

        let finalMermaColor = 0;
        let finalMermaCristal = 0;
        let finalMerma = 0;

        const area = produccionExistente?.area;
        if (area === 'Serigrafia' || area === 'Refilado') {
            finalMermaColor = mermaColor !== undefined 
                ? (parseFloat(mermaColor?.toString() || '0') || 0)
                : (parseFloat(mermaImpreso?.toString() || '0') || 0);

            finalMermaCristal = mermaCristal !== undefined
                ? (parseFloat(mermaCristal?.toString() || '0') || 0)
                : (parseFloat(mermaSinImpresion?.toString() || '0') || 0);

            finalMerma = finalMermaColor + finalMermaCristal;
        } else if (area === 'Sellado') {
            const rawMerma = merma !== undefined 
                ? (parseFloat(merma?.toString() || '0') || 0)
                : ((parseFloat(mermaColor?.toString() || '0') || 0) + (parseFloat(mermaCristal?.toString() || '0') || 0));

            const conImpresion = Boolean(
                produccionExistente?.pedido?.productoCliente?.conImpresion ||
                produccionExistente?.productoCliente?.conImpresion ||
                (produccionExistente?.pedido?.cliente as any)?.conImpresion
            );

            if (conImpresion) {
                finalMermaColor = rawMerma;
                finalMermaCristal = 0;
            } else {
                finalMermaCristal = rawMerma;
                finalMermaColor = 0;
            }
            finalMerma = rawMerma;
        } else {
            const rawMerma = merma !== undefined 
                ? (parseFloat(merma?.toString() || '0') || 0)
                : ((parseFloat(mermaColor?.toString() || '0') || 0) + (parseFloat(mermaCristal?.toString() || '0') || 0));

            finalMermaCristal = rawMerma;
            finalMermaColor = 0;
            finalMerma = rawMerma;
        }

        // Actualizar registro
        const registro = await prisma.registroProduccion.update({
            where: { id: registroId },
            data: {
                turno,
                fecha: fecha ? new Date(fecha) : new Date(),
                operario,
                cantidad: cantidad ? parseFloat(cantidad.toString()) : 0,
                reporte,
                merma: finalMerma,
                mermaColor: finalMermaColor,
                mermaCristal: finalMermaCristal,
                mermaSinImpresion: finalMermaCristal,
                mermaImpreso: finalMermaColor,
            } as any,
        });

        // Recalcular el total de la producción
        const todosRegistros = await prisma.registroProduccion.findMany({
            where: { produccionId: id },
        });

        const totalCantidad = todosRegistros.reduce((sum, r) => sum + r.cantidad, 0);
        const totalMerma = todosRegistros.reduce((sum, r) => sum + r.merma, 0);
        const totalMermaColor = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaColor ?? r.mermaImpreso ?? 0), 0);
        const totalMermaCristal = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaCristal ?? r.mermaSinImpresion ?? 0), 0);

        // Actualizar cantidad total en la producción principal
        const produccion = await prisma.produccion.update({
            where: { id },
            data: {
                cantidadProducida: totalCantidad,
                merma: totalMerma,
                mermaColor: totalMermaColor,
                mermaCristal: totalMermaCristal,
            } as any,
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
        const totalMermaColor = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaColor ?? r.mermaImpreso ?? 0), 0);
        const totalMermaCristal = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaCristal ?? r.mermaSinImpresion ?? 0), 0);

        const produccion = await prisma.produccion.update({
            where: { id },
            data: {
                cantidadProducida: totalCantidad,
                merma: totalMerma,
                mermaColor: totalMermaColor,
                mermaCristal: totalMermaCristal,
            } as any,
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
