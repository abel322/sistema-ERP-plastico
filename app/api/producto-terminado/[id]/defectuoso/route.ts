import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        if (!id) {
            return NextResponse.json({ error: 'Falta el id del producto' }, { status: 400 });
        }

export const dynamic = 'force-dynamic';

        const body = await request.json().catch(() => ({}));
        const motivo = body.motivo;

        const currentProd = await prisma.productoTerminado.findUnique({ where: { id } });
        let nuevaDescripcion = currentProd?.descripcion || '';

        if (motivo) {
            nuevaDescripcion = currentProd?.descripcion
                ? `${currentProd.descripcion}\n---\nMotivo Devolución: ${motivo}`
                : `Motivo Devolución: ${motivo}`;
        }

        const producto = await prisma.productoTerminado.update({
            where: { id },
            data: {
                estado: 'Defectuoso' as any,
                descripcion: nuevaDescripcion || null
            }
        });

        return NextResponse.json(producto);
    } catch (error) {
        console.error('Error al marcar defectuoso:', error);
        return NextResponse.json(
            { error: 'Error al marcar producto como defectuoso' },
            { status: 500 }
        );
    }
}
