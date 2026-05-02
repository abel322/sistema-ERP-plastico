import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { TipoMovimiento } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { cantidad, motivo } = body;
        const id = params.id;

        // Obtener el movimiento actual
        const movimientoActual = await prisma.movimientoInventario.findUnique({
            where: { id },
            include: { inventario: true }
        });

        if (!movimientoActual) {
            return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 });
        }

        const diff = cantidad - movimientoActual.cantidad;
        if (diff === 0 && motivo === movimientoActual.motivo) {
            return NextResponse.json(movimientoActual);
        }

        // Calcular nueva cantidad del inventario basado en la diferencia
        let nuevaCantidadInventario = movimientoActual.inventario.cantidad;
        const tipo = movimientoActual.tipo;

        if (tipo === TipoMovimiento.Entrada || tipo === TipoMovimiento.Devolucion) {
            nuevaCantidadInventario += diff;
        } else if (tipo === TipoMovimiento.Salida) {
            nuevaCantidadInventario -= diff;
        } else if (tipo === TipoMovimiento.Ajuste) {
            nuevaCantidadInventario = cantidad; // En ajuste, la cantidad es el nuevo valor final
        }

        if (nuevaCantidadInventario < 0) {
            return NextResponse.json({ error: 'La edición resultaría en stock negativo' }, { status: 400 });
        }

        // Actualizar movimiento e inventario en transacción
        const [movimientoActualizado] = await prisma.$transaction([
            prisma.movimientoInventario.update({
                where: { id },
                data: {
                    cantidad,
                    motivo,
                    responsable: session.user?.name || movimientoActual.responsable
                },
                include: { inventario: true }
            }),
            prisma.inventario.update({
                where: { id: movimientoActual.inventarioId },
                data: { cantidad: nuevaCantidadInventario }
            })
        ]);

        return NextResponse.json(movimientoActualizado);
    } catch (error) {
        console.error('Error al actualizar movimiento:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
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

        const id = params.id;

        // Obtener el movimiento antes de eliminarlo
        const movimiento = await prisma.movimientoInventario.findUnique({
            where: { id },
            include: { inventario: true }
        });

        if (!movimiento) {
            return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 });
        }

        // Revertir el efecto del movimiento en el stock
        let nuevaCantidadInventario = movimiento.inventario.cantidad;
        const tipo = movimiento.tipo;

        if (tipo === TipoMovimiento.Entrada || tipo === TipoMovimiento.Devolucion) {
            nuevaCantidadInventario -= movimiento.cantidad;
        } else if (tipo === TipoMovimiento.Salida) {
            nuevaCantidadInventario += movimiento.cantidad;
        } else if (tipo === TipoMovimiento.Ajuste) {
            // Revertir un ajuste es complejo sin saber el valor previo. 
            // Para simplicidad, se deja la cantidad igual o se podría buscar el movimiento anterior.
            // Pero en muchos sistemas, eliminar un ajuste simplemente borra el registro histórico.
            // Optamos por no cambiar la cantidad si es ajuste, o avisar.
        }

        if (nuevaCantidadInventario < 0) {
            return NextResponse.json({ error: 'Eliminar este movimiento resultaría en stock negativo' }, { status: 400 });
        }

        await prisma.$transaction([
            prisma.movimientoInventario.delete({ where: { id } }),
            prisma.inventario.update({
                where: { id: movimiento.inventarioId },
                data: { cantidad: nuevaCantidadInventario }
            })
        ]);

        return NextResponse.json({ message: 'Movimiento eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar movimiento:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
