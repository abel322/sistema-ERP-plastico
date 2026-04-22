import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Obtener los pedidos pendientes o en proceso
        const pedidos = await prisma.pedido.findMany({
            where: {
                estado: {
                    in: ['Pendiente', 'EnProceso']
                }
            },
            include: {
                cliente: true
            }
        });

        // Inicializar proyecciones
        const proyecciones: Record<string, number> = {
            'FB7000': 0,
            '3003': 0,
            'Lineal': 0,
            '0240': 0,
            '0348': 0,
            '7000F': 0,
            'Deslizante': 0,
            'Masterbach Blanco': 0,
            'Masterbach Negro': 0,
            'Masterbach Azul': 0,
            'Masterbach Amarillo': 0
        };

        let totalKgRequeridos = 0;

        // Calcular requerimientos
        for (const pedido of pedidos) {
            const cantidadFaltante = Math.max(0, pedido.cantidadSolicitada - pedido.cantidadProducida);
            if (cantidadFaltante === 0) continue;

            let pesoTotalKg = 0;

            if (pedido.unidad === 'Kilogramos') {
                pesoTotalKg = cantidadFaltante;
            } else if (pedido.unidad === 'Unidades') {
                const pesoPorUnidad = pedido.cliente.pesoPorUnidad || 0;
                pesoTotalKg = cantidadFaltante * pesoPorUnidad;
            }

            if (pesoTotalKg > 0) {
                totalKgRequeridos += pesoTotalKg;

                const c = pedido.cliente;
                if (c.formFB7000) proyecciones['FB7000'] += pesoTotalKg * (c.formFB7000 / 100);
                if (c.form3003) proyecciones['3003'] += pesoTotalKg * (c.form3003 / 100);
                if (c.formLineal) proyecciones['Lineal'] += pesoTotalKg * (c.formLineal / 100);
                if (c.form0240) proyecciones['0240'] += pesoTotalKg * (c.form0240 / 100);
                if (c.form0348) proyecciones['0348'] += pesoTotalKg * (c.form0348 / 100);
                if (c.form7000F) proyecciones['7000F'] += pesoTotalKg * (c.form7000F / 100);
                if (c.formDeslizante) proyecciones['Deslizante'] += pesoTotalKg * (c.formDeslizante / 100);
                if (c.formMasterbachBlanco) proyecciones['Masterbach Blanco'] += pesoTotalKg * (c.formMasterbachBlanco / 100);
                if (c.formMasterbachNegro) proyecciones['Masterbach Negro'] += pesoTotalKg * (c.formMasterbachNegro / 100);
                if (c.formMasterbachAzul) proyecciones['Masterbach Azul'] += pesoTotalKg * (c.formMasterbachAzul / 100);
                if (c.formMasterbachAmarillo) proyecciones['Masterbach Amarillo'] += pesoTotalKg * (c.formMasterbachAmarillo / 100);
            }
        }

        // Filtrar proyecciones que son 0
        const proyeccionesActivas = Object.entries(proyecciones)
            .filter(([_, cantidad]) => cantidad > 0)
            .map(([material, cantidad]) => ({
                material,
                cantidadKg: Number(cantidad.toFixed(2))
            }))
            .sort((a, b) => b.cantidadKg - a.cantidadKg);

        return NextResponse.json({
            proyecciones: proyeccionesActivas,
            totalKgRequeridos: Number(totalKgRequeridos.toFixed(2)),
            pedidosActivos: pedidos.length
        });
    } catch (error) {
        console.error('Error al calcular proyecciones:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
