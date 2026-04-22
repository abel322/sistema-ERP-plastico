import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { EstadoPedido } from '@prisma/client';
import { startOfWeek, startOfMonth, subDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const busqueda = searchParams.get('busqueda');
        const periodo = searchParams.get('periodo'); // 'semana', 'mes', 'todos'
        const page = parseInt(searchParams.get('page') ?? '1');
        const limit = parseInt(searchParams.get('limit') ?? '10');
        const skip = (page - 1) * limit;

        let whereClause: any = {
            estado: EstadoPedido.Completado,
        };

        if (busqueda) {
            whereClause.cliente = {
                nombre: { contains: busqueda, mode: 'insensitive' },
            };
        }

        if (periodo === 'semana') {
            whereClause.updatedAt = {
                gte: startOfWeek(new Date(), { weekStartsOn: 1 }),
            };
        } else if (periodo === 'mes') {
            whereClause.updatedAt = {
                gte: startOfMonth(new Date()),
            };
        }

        const [pedidos, total] = await Promise.all([
            prisma.pedido.findMany({
                where: whereClause,
                include: {
                    cliente: {
                        select: {
                            nombre: true,
                            tipoProducto: true,
                        }
                    },
                },
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
            }),
            prisma.pedido.count({ where: whereClause }),
        ]);

        // Calcular estadísticas simples para el historial
        const totalCompletados = await prisma.pedido.count({
            where: { estado: EstadoPedido.Completado }
        });

        return NextResponse.json({
            data: pedidos,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            stats: {
                totalCompletados
            }
        });
    } catch (error) {
        console.error('Error al obtener historial de pedidos:', error);
        return NextResponse.json(
            { error: 'Error al obtener historial' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
