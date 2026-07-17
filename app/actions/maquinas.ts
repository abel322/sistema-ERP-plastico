'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';
import { TipoMaquina, EstadoMaquina, AreaProduccion } from '@prisma/client';

// Helper to check user authorization
async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('No autorizado. Por favor inicie sesión.');
  }
  return session;
}

// Helper to check admin authorization
async function requireAdmin() {
  const session = await requireAuth();
  const userRole = (session.user as any)?.rol;
  if (userRole !== 'admin') {
    throw new Error('No autorizado. Se requieren permisos de administrador.');
  }
  return session;
}

// 1. Get all machines
export async function getMaquinas() {
  await requireAuth();
  try {
    const maquinas = await prisma.maquina.findMany({
      orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
      include: {
        productosCompatibles: true,
      },
    });
    return maquinas;
  } catch (error: any) {
    console.error('Error al obtener máquinas:', error);
    throw new Error('Error al obtener máquinas: ' + error.message);
  }
}

// 2. Get machine by ID
export async function getMaquinaById(id: string) {
  await requireAuth();
  try {
    const maquina = await prisma.maquina.findUnique({
      where: { id },
      include: {
        productosCompatibles: true,
        mantenimientos: {
          orderBy: { fechaProgramada: 'desc' },
          take: 5,
        },
        mejorasContinuas: {
          orderBy: { fecha: 'desc' },
          take: 5,
        },
      },
    });
    return maquina;
  } catch (error: any) {
    console.error(`Error al obtener máquina ${id}:`, error);
    throw new Error('Error al obtener la máquina: ' + error.message);
  }
}

// 3. Create a machine
export async function createMaquina(formData: {
  nombre: string;
  tipo: TipoMaquina;
  marca: string;
  modelo: string;
  estado: EstadoMaquina;
  capacidadNominal: number;
  unidadCapacidad: string;
  anchoMaximoMm: number;
  horasAcumuladas: number;
  kgAcumulados: number;
  limiteMantenimiento: number;
  area: AreaProduccion;
}) {
  await requireAdmin();
  try {
    const maquina = await prisma.maquina.create({
      data: {
        nombre: formData.nombre,
        tipo: formData.tipo,
        marca: formData.marca,
        modelo: formData.modelo,
        estado: formData.estado,
        capacidadNominal: formData.capacidadNominal,
        unidadCapacidad: formData.unidadCapacidad,
        anchoMaximoMm: formData.anchoMaximoMm,
        horasAcumuladas: formData.horasAcumuladas,
        kgAcumulados: formData.kgAcumulados,
        limiteMantenimiento: formData.limiteMantenimiento,
        area: formData.area,
      },
    });
    revalidatePath('/dashboard/maquinas');
    return maquina;
  } catch (error: any) {
    console.error('Error al crear máquina:', error);
    throw new Error('Error al crear máquina: ' + error.message);
  }
}

// 4. Update a machine
export async function updateMaquina(
  id: string,
  formData: {
    nombre?: string;
    tipo?: TipoMaquina;
    marca?: string;
    modelo?: string;
    estado?: EstadoMaquina;
    capacidadNominal?: number;
    unidadCapacidad?: string;
    anchoMaximoMm?: number;
    horasAcumuladas?: number;
    kgAcumulados?: number;
    limiteMantenimiento?: number;
    area?: AreaProduccion;
    activa?: boolean;
  }
) {
  await requireAdmin();
  try {
    const maquina = await prisma.maquina.update({
      where: { id },
      data: {
        ...formData,
      },
    });
    revalidatePath('/dashboard/maquinas');
    return maquina;
  } catch (error: any) {
    console.error(`Error al actualizar máquina ${id}:`, error);
    throw new Error('Error al actualizar máquina: ' + error.message);
  }
}

// 5. Delete a machine
export async function deleteMaquina(id: string) {
  await requireAdmin();
  try {
    const maquina = await prisma.maquina.delete({
      where: { id },
    });
    revalidatePath('/dashboard/maquinas');
    return maquina;
  } catch (error: any) {
    console.error(`Error al eliminar máquina ${id}:`, error);
    throw new Error('Error al eliminar máquina. Verifique si tiene dependencias asociadas (producciones, mantenimientos): ' + error.message);
  }
}

// 6. Get compatible products and active production orders for a machine
export async function getCompatibleProductsAndOrders(maquinaId: string) {
  await requireAuth();
  try {
    const maquina = await prisma.maquina.findUnique({
      where: { id: maquinaId },
    });

    if (!maquina) throw new Error('Máquina no encontrada');

    const query: any = {
      activo: true,
    };

    // Filter products based on technical limitations of the machine
    if (maquina.tipo === 'Extrusora') {
      query.tipoProducto = 'Bobina';
      if (maquina.anchoMaximoMm > 0) {
        query.OR = [
          { ancho: { lte: maquina.anchoMaximoMm } },
          { anchoBobina: { lte: maquina.anchoMaximoMm } }
        ];
      }
    } else if (maquina.tipo === 'Impresora') {
      query.conImpresion = true;
      if (maquina.anchoMaximoMm > 0) {
        query.OR = [
          { ancho: { lte: maquina.anchoMaximoMm } },
          { anchoBobina: { lte: maquina.anchoMaximoMm } }
        ];
      }
    } else if (maquina.tipo === 'Selladora') {
      query.tipoProducto = 'Bolsa';
      if (maquina.anchoMaximoMm > 0) {
        query.ancho = { lte: maquina.anchoMaximoMm };
      }
    } else if (maquina.tipo === 'Refiladora') {
      query.tipoRefilado = { not: null };
      if (maquina.anchoMaximoMm > 0) {
        query.OR = [
          { ancho: { lte: maquina.anchoMaximoMm } },
          { anchoBobina: { lte: maquina.anchoMaximoMm } }
        ];
      }
    }

    const compatibleProducts = await prisma.productoCliente.findMany({
      where: query,
      include: { cliente: true },
      orderBy: { nombreProducto: 'asc' },
    });

    const compatibleOrders = await prisma.pedido.findMany({
      where: {
        estado: { in: ['Pendiente', 'EnProceso'] },
        productoCliente: query,
      },
      include: {
        cliente: true,
        productoCliente: true,
      },
      orderBy: { fechaEntrega: 'asc' },
    });

    return {
      compatibleProducts,
      compatibleOrders,
    };
  } catch (error: any) {
    console.error('Error al obtener compatibilidad:', error);
    throw new Error('Error al obtener compatibilidad: ' + error.message);
  }
}

// 7. Get OEE, efficiency, and waste analytics for a machine
export async function getMaquinaStats(maquinaId: string) {
  await requireAuth();
  try {
    const maquina = await prisma.maquina.findUnique({
      where: { id: maquinaId },
      include: {
        producciones: {
          include: {
            pedido: { include: { cliente: true } },
            productoCliente: true,
            registros: true,
          },
          orderBy: { fecha: 'desc' },
        },
      },
    });

    if (!maquina) throw new Error('Máquina no encontrada');

    let totalCantidadProducida = 0;
    let totalMerma = 0;
    let totalExpectedProduction = 0;
    const runsCount = maquina.producciones.length;

    const getTurnoHours = (turno: string) => {
      if (turno.includes('12H')) return 12;
      return 8;
    };

    const runsStats = maquina.producciones.map((p) => {
      const hours = getTurnoHours(p.turno);
      let expected = 0;

      if (maquina.capacidadNominal > 0) {
        if (maquina.unidadCapacidad.toLowerCase().includes('minuto')) {
          expected = hours * 60 * maquina.capacidadNominal;
        } else {
          expected = hours * maquina.capacidadNominal;
        }
      }

      const efficiency = expected > 0 ? (p.cantidadProducida / expected) * 100 : 100;
      const mermaPercent = p.cantidadProducida > 0 ? (p.merma / p.cantidadProducida) * 100 : 0;

      totalCantidadProducida += p.cantidadProducida;
      totalMerma += p.merma;
      totalExpectedProduction += expected;

      return {
        id: p.id,
        fecha: p.fecha.toISOString(),
        turno: p.turno,
        cantidadProducida: p.cantidadProducida,
        merma: p.merma,
        mermaPercent,
        efficiency: Math.min(efficiency, 100),
        producto: p.productoCliente?.nombreProducto || 'N/A',
        cliente: p.pedido?.cliente?.nombre || 'Interno',
      };
    });

    const overallMermaPercent = totalCantidadProducida > 0
      ? (totalMerma / totalCantidadProducida) * 100
      : 0;

    const overallEfficiency = totalExpectedProduction > 0
      ? (totalCantidadProducida / totalExpectedProduction) * 100
      : 0;

    const monthlyStats: { [key: string]: { totalProducido: number; totalMerma: number; count: number } } = {};
    maquina.producciones.forEach((p) => {
      const monthKey = p.fecha.toISOString().substring(0, 7);
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { totalProducido: 0, totalMerma: 0, count: 0 };
      }
      monthlyStats[monthKey].totalProducido += p.cantidadProducida;
      monthlyStats[monthKey].totalMerma += p.merma;
      monthlyStats[monthKey].count += 1;
    });

    const historicalData = Object.entries(monthlyStats).map(([month, data]) => {
      const mermaPercent = data.totalProducido > 0 ? (data.totalMerma / data.totalProducido) * 100 : 0;
      return {
        month,
        totalProducido: data.totalProducido,
        totalMerma: data.totalMerma,
        mermaPercent,
      };
    }).sort((a, b) => a.month.localeCompare(b.month));

    return {
      maquina: {
        id: maquina.id,
        nombre: maquina.nombre,
        tipo: maquina.tipo,
        estado: maquina.estado,
        horasAcumuladas: maquina.horasAcumuladas,
        kgAcumulados: maquina.kgAcumulados,
        limiteMantenimiento: maquina.limiteMantenimiento,
        capacidadNominal: maquina.capacidadNominal,
        unidadCapacidad: maquina.unidadCapacidad,
      },
      totalCantidadProducida,
      totalMerma,
      overallMermaPercent,
      overallEfficiency: Math.min(overallEfficiency, 100),
      runsCount,
      runsStats,
      historicalData,
    };
  } catch (error: any) {
    console.error('Error al calcular estadísticas:', error);
    throw new Error('Error al obtener estadísticas de la máquina: ' + error.message);
  }
}
