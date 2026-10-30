import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';
import { calcularDesgloseMerma, aplicarMermaAInventario, revertirMermaDeInventario } from '@/lib/merma-logic';
import { resolverConsumoExtrusion, aplicarConsumoExtrusion, revertirConsumoExtrusion } from '@/lib/consumo-extrusion-logic';

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
        const { turno, fecha, operario, cantidad, reporte } = body;

        const produccionExistente = await prisma.produccion.findUnique({
            where: { id },
            include: {
                pedido: {
                    include: {
                        cliente: true,
                        productoCliente: { include: { peletizado: true } },
                    },
                },
                productoCliente: { include: { peletizado: true } },
                productoTerminado: true,
            }
        });

        if (!produccionExistente) {
            return NextResponse.json({ error: 'Producción no encontrada' }, { status: 404 });
        }

        const registroExistente = await prisma.registroProduccion.findUnique({
            where: { id: registroId },
        });

        if (!registroExistente) {
            return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
        }

        const desglose = calcularDesgloseMerma(body);

        const registroActualizado = await prisma.$transaction(async (tx) => {
            // Revertir consumo de Extrusión previo de este registro
            if (produccionExistente.area === 'Extrusion' && registroExistente.cantidad > 0) {
                const formulacionProd = produccionExistente.pedido?.productoCliente || produccionExistente.productoCliente;
                const consumoPrevio = await resolverConsumoExtrusion(tx, formulacionProd, registroExistente.cantidad);
                if (consumoPrevio) {
                    await revertirConsumoExtrusion(tx, {
                        consumo: consumoPrevio,
                        loteCodigo: produccionExistente.codigoLote || produccionExistente.id.slice(0, 8).toUpperCase(),
                        turno: registroExistente.turno,
                        responsable: operario || registroExistente.operario,
                        accion: 'Edición',
                    });
                }
            }

            // Revertir merma previa si ya había sido sumada al inventario
            if (registroExistente.mermaInventarioSumada) {
                await revertirMermaDeInventario(tx, registroExistente, {
                    area: produccionExistente.area,
                    ordenId: produccionExistente.id,
                    codigoLote: produccionExistente.codigoLote,
                    responsable: operario || registroExistente.operario,
                });
            }

            // Actualizar registro
            const reg = await tx.registroProduccion.update({
                where: { id: registroId },
                data: {
                    turno,
                    fecha: fecha ? new Date(fecha) : new Date(),
                    operario,
                    cantidad: cantidad ? parseFloat(cantidad.toString()) : 0,
                    reporte,
                    merma: desglose.mermaTotal,
                    mermaTransparenteAlta: desglose.mermaTransparenteAlta,
                    mermaBlancoPollo: desglose.mermaBlancoPollo,
                    mermaColor: desglose.mermaColor,
                    mermaTransparenteBaja: desglose.mermaTransparenteBaja,
                    mermaBlancoPego: desglose.mermaBlancoPego,
                    mermaCristal: desglose.mermaTransparenteAlta,
                    mermaSinImpresion: desglose.mermaTransparenteAlta,
                    mermaImpreso: desglose.mermaColor,
                    mermaInventarioSumada: true,
                },
            });

            // Recalcular el total de la producción con las 5 mermas
            const todosRegistros = await tx.registroProduccion.findMany({
                where: { produccionId: id },
            });

            const totalCantidad = todosRegistros.reduce((sum, r) => sum + r.cantidad, 0);
            const totalMerma = todosRegistros.reduce((sum, r) => sum + (r.merma || 0), 0);
            const totalMermaAlta = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaTransparenteAlta || (r as any).mermaCristal || r.mermaSinImpresion || 0), 0);
            const totalMermaPollo = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaBlancoPollo || 0), 0);
            const totalMermaColor = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaColor || r.mermaImpreso || 0), 0);
            const totalMermaBaja = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaTransparenteBaja || 0), 0);
            const totalMermaPego = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaBlancoPego || 0), 0);

            const produccion = await tx.produccion.update({
                where: { id },
                data: {
                    cantidadProducida: totalCantidad,
                    merma: totalMerma,
                    mermaTransparenteAlta: totalMermaAlta,
                    mermaBlancoPollo: totalMermaPollo,
                    mermaColor: totalMermaColor,
                    mermaTransparenteBaja: totalMermaBaja,
                    mermaBlancoPego: totalMermaPego,
                    mermaCristal: totalMermaAlta,
                },
                include: {
                    productoTerminado: true,
                },
            });

            // Sumar la nueva merma corregida al inventario de PELETIZADO
            await aplicarMermaAInventario(tx, desglose, {
                area: produccionExistente.area,
                ordenId: produccionExistente.id,
                codigoLote: produccionExistente.codigoLote,
                responsable: operario,
            });

            // Aplicar nuevo consumo de Extrusión por la cantidad actualizada
            if (produccionExistente.area === 'Extrusion') {
                const nuevaCantidadKg = cantidad ? parseFloat(cantidad.toString()) : 0;
                if (nuevaCantidadKg > 0) {
                    const formulacionProd = produccionExistente.pedido?.productoCliente || produccionExistente.productoCliente;
                    const nuevoConsumo = await resolverConsumoExtrusion(tx, formulacionProd, nuevaCantidadKg);
                    if (nuevoConsumo) {
                        await aplicarConsumoExtrusion(tx, {
                            consumo: nuevoConsumo,
                            loteCodigo: produccionExistente.codigoLote || produccionExistente.id.slice(0, 8).toUpperCase(),
                            turno: turno || registroExistente.turno,
                            responsable: operario || registroExistente.operario,
                        });
                    }
                }
            }

            if (produccion.productoTerminado) {
                await tx.productoTerminado.update({
                    where: { id: produccion.productoTerminado.id },
                    data: {
                        cantidadTotal: totalCantidad,
                        cantidadDisponible: totalCantidad,
                    },
                });
            }

            return reg;
        });

        revalidatePath('/produccion');
        revalidatePath('/inventario');
        revalidatePath('/inventario/movimientos');
        revalidatePath('/produccion/historial');

        return NextResponse.json({
            success: true,
            message: 'Registro actualizado correctamente',
            data: registroActualizado,
        });
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

        const produccionExistente = await prisma.produccion.findUnique({
            where: { id },
            include: {
                pedido: {
                    include: {
                        productoCliente: { include: { peletizado: true } },
                    },
                },
                productoCliente: { include: { peletizado: true } },
            },
        });

        const registroExistente = await prisma.registroProduccion.findUnique({
            where: { id: registroId },
        });

        if (!registroExistente) {
            return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
        }

        await prisma.$transaction(async (tx) => {
            // Revertir consumo de Extrusión de este registro al eliminar
            if (produccionExistente && produccionExistente.area === 'Extrusion' && registroExistente.cantidad > 0) {
                const formulacionProd = produccionExistente.pedido?.productoCliente || produccionExistente.productoCliente;
                const consumoAEliminar = await resolverConsumoExtrusion(tx, formulacionProd, registroExistente.cantidad);
                if (consumoAEliminar) {
                    await revertirConsumoExtrusion(tx, {
                        consumo: consumoAEliminar,
                        loteCodigo: produccionExistente.codigoLote || produccionExistente.id.slice(0, 8).toUpperCase(),
                        turno: registroExistente.turno,
                        responsable: (session.user as any)?.name || registroExistente.operario || 'Sistema',
                        accion: 'Eliminación',
                    });
                }
            }

            // Revertir merma del inventario si había sido sumada
            if (registroExistente.mermaInventarioSumada && produccionExistente) {
                await revertirMermaDeInventario(tx, registroExistente, {
                    area: produccionExistente.area,
                    ordenId: produccionExistente.id,
                    codigoLote: produccionExistente.codigoLote,
                    responsable: (session.user as any)?.name || 'Admin',
                });
            }

            await tx.registroProduccion.delete({
                where: { id: registroId },
            });

            // Recalcular el total de la producción
            const todosRegistros = await tx.registroProduccion.findMany({
                where: { produccionId: id },
            });

            const totalCantidad = todosRegistros.reduce((sum, r) => sum + r.cantidad, 0);
            const totalMerma = todosRegistros.reduce((sum, r) => sum + (r.merma || 0), 0);
            const totalMermaAlta = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaTransparenteAlta || (r as any).mermaCristal || r.mermaSinImpresion || 0), 0);
            const totalMermaPollo = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaBlancoPollo || 0), 0);
            const totalMermaColor = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaColor || r.mermaImpreso || 0), 0);
            const totalMermaBaja = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaTransparenteBaja || 0), 0);
            const totalMermaPego = todosRegistros.reduce((sum, r) => sum + ((r as any).mermaBlancoPego || 0), 0);

            const produccion = await tx.produccion.update({
                where: { id },
                data: {
                    cantidadProducida: totalCantidad,
                    merma: totalMerma,
                    mermaTransparenteAlta: totalMermaAlta,
                    mermaBlancoPollo: totalMermaPollo,
                    mermaColor: totalMermaColor,
                    mermaTransparenteBaja: totalMermaBaja,
                    mermaBlancoPego: totalMermaPego,
                    mermaCristal: totalMermaAlta,
                },
                include: {
                    productoTerminado: true,
                },
            });

            if (produccion.productoTerminado) {
                await tx.productoTerminado.update({
                    where: { id: produccion.productoTerminado.id },
                    data: {
                        cantidadTotal: totalCantidad,
                        cantidadDisponible: totalCantidad,
                    },
                });
            }
        });

        revalidatePath('/produccion');
        revalidatePath('/inventario');
        revalidatePath('/inventario/movimientos');
        revalidatePath('/produccion/historial');

        return NextResponse.json({
            success: true,
            message: 'Registro eliminado correctamente',
        });
    } catch (error) {
        console.error('Error al eliminar registro de producción:', error);
        return NextResponse.json({ error: 'Error al eliminar registro' }, { status: 500 });
    }
}
