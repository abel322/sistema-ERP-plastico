import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';
import { TipoMovimiento } from '@prisma/client';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

export const dynamic = 'force-dynamic';

        // Buscamos los movimientos de los últimos 30 días
        const hace30Dias = new Date();
        hace30Dias.setDate(hace30Dias.getDate() - 30);

        const movimientos = await prisma.movimientoInventario.findMany({
            where: {
                fecha: { gte: hace30Dias },
                inventario: {
                    categoria: 'MateriaPrima'
                }
            },
            include: {
                inventario: true
            }
        });

        // Agrupar por material (nombre) y sumar entradas vs salidas
        const agrupado: Record<string, { material: string, entradas: number, consumos: number }> = {};

        for (const d of movimientos) {
            const mat = d.inventario.nombre;
            if (!agrupado[mat]) {
                agrupado[mat] = { material: mat, entradas: 0, consumos: 0 };
            }

            if (d.tipo === TipoMovimiento.Entrada) {
                agrupado[mat].entradas += d.cantidad;
            } else if (d.tipo === TipoMovimiento.Salida) {
                agrupado[mat].consumos += d.cantidad;
            }
        }

        const dataGrafico = Object.values(agrupado)
            .sort((a, b) => b.entradas + b.consumos - (a.entradas + a.consumos))
            .slice(0, 7); // Tomar los 7 más movidos

        return NextResponse.json({ data: dataGrafico });
    } catch (error) {
        console.error('Error al generar análisis:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
