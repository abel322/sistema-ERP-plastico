import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { EstadoPedido } from '@prisma/client';
import { startOfWeek, startOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const userId = (session.user as any)?.id;
        const { searchParams } = new URL(request.url);
        const busqueda = searchParams.get('busqueda');
        const periodo = searchParams.get('periodo'); // 'semana', 'mes', 'todos'
        const page = parseInt(searchParams.get('page') ?? '1');
        const limit = parseInt(searchParams.get('limit') ?? '10');
        const skip = (page - 1) * limit;

        const andConditions: any[] = [
            {
                estado: EstadoPedido.Completado,
            }
        ];

        if (userId) {
            andConditions.push({
                OR: [
                    { userId },
                    { userId: null },
                ]
            });
        }

        if (busqueda && busqueda.trim()) {
            const query = busqueda.trim();
            andConditions.push({
                OR: [
                    { cliente: { nombre: { contains: query, mode: 'insensitive' } } },
                    { productoCliente: { nombreProducto: { contains: query, mode: 'insensitive' } } },
                    { id: { contains: query, mode: 'insensitive' } },
                ]
            });
        }

        if (periodo === 'semana') {
            andConditions.push({
                updatedAt: {
                    gte: startOfWeek(new Date(), { weekStartsOn: 1 }),
                }
            });
        } else if (periodo === 'mes') {
            andConditions.push({
                updatedAt: {
                    gte: startOfMonth(new Date()),
                }
            });
        }

        const whereClause = andConditions.length === 1 ? andConditions[0] : { AND: andConditions };

        const [pedidos, total] = await Promise.all([
            prisma.pedido.findMany({
                where: whereClause,
                include: {
                    cliente: {
                        select: {
                            id: true,
                            nombre: true,
                            rif: true,
                            telefono: true,
                            contacto: true,
                        }
                    },
                    productoCliente: {
                        select: {
                            id: true,
                            nombreProducto: true,
                            codigoProducto: true,
                            tipoProducto: true,
                            conImpresion: true,
                            conPigmento: true,
                            material: true,
                            color: true,
                            ancho: true,
                            largo: true,
                            calibre: true,
                            unidadVenta: true,
                        }
                    },
                },
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
            }),
            prisma.pedido.count({ where: whereClause }),
        ]);

        // Estadísticas de pedidos completados (alineado al dashboard)
        const statsConditions: any[] = [
            {
                estado: EstadoPedido.Completado,
            }
        ];
        if (userId) {
            statsConditions.push({
                OR: [{ userId }, { userId: null }]
            });
        }
        const totalCompletados = await prisma.pedido.count({
            where: statsConditions.length === 1 ? statsConditions[0] : { AND: statsConditions }
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
