'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';
import { TipoMaquina, EstadoMaquina, AreaProduccion } from '@prisma/client';

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error('No autorizado. Por favor inicie sesión.');
  }
  return session;
}

export async function getMaquinas() {
  const session = await requireAuth();
  const userId = (session.user as any).id;
  try {
    const maquinas = await prisma.maquina.findMany({
      where: { userId },
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

export async function getMaquinaById(id: string) {
  const session = await requireAuth();
  const userId = (session.user as any).id;
  try {
    const maquina = await prisma.maquina.findFirst({
      where: { id, userId },
      include: {
        productosCompatibles: true,
        mantenimientos: {
          where: { userId },
          orderBy: { fechaProgramada: 'desc' },
          take: 5,
        },
        mejorasContinuas: {
          where: { userId },
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
  const session = await requireAuth();
  const userId = (session.user as any).id;

  try {
    const maquina = await prisma.maquina.create({
      data: {
        userId,
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
  const session = await requireAuth();
  const userId = (session.user as any).id;
  try {
    const maquina = await prisma.maquina.updateMany({
      where: { id, userId },
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

export async function deleteMaquina(id: string) {
  const session = await requireAuth();
  const userId = (session.user as any).id;
  try {
    const maquina = await prisma.maquina.deleteMany({
      where: { id, userId },
    });
    revalidatePath('/dashboard/maquinas');
    return maquina;
  } catch (error: any) {
    console.error(`Error al eliminar máquina ${id}:`, error);
    throw new Error('Error al eliminar máquina: ' + error.message);
  }
}

export function isProductCompatibleWithMachine(producto: any, maquina: any): boolean {
  if (!producto || !maquina) return false;

  const mNom = (maquina.nombre || '').trim().toLowerCase();
  const mNumMatch = mNom.match(/\d+/);
  const mNum = mNumMatch ? parseInt(mNumMatch[0], 10) : null;

  if (maquina.tipo === 'Extrusora' || mNom.includes('extrusora')) {
    // 1. Asignación explícita en extMaquinaExtrusora
    if (producto.extMaquinaExtrusora !== null && producto.extMaquinaExtrusora !== undefined) {
      const pExtStr = String(producto.extMaquinaExtrusora).trim().toLowerCase();
      if (pExtStr === mNom) return true;

      const pNum = parseInt(pExtStr.replace(/\D/g, ''), 10);
      if (!isNaN(pNum) && mNum !== null) {
        return pNum === mNum;
      }
      return false; // Asignado explícitamente a otra máquina extrusora
    }

    // 2. Relación directa many-to-many en maquinasCompatibles
    if (producto.maquinasCompatibles && Array.isArray(producto.maquinasCompatibles)) {
      if (producto.maquinasCompatibles.some((mc: any) => mc.id === maquina.id || (mc.nombre && mc.nombre.trim().toLowerCase() === mNom))) {
        return true;
      }
    }

    // 3. Compatibilidad física según diametroCabezal requerido por la bobina frente al cabezal/límite de la extrusora
    if (producto.tipoProducto === 'Bobina') {
      const cabezal = producto.extDiametroCabezal || producto.anchoBobina || producto.ancho;
      if (cabezal && cabezal > 0) {
        if (mNum === 1) {
          // Extrusora 1: bobinas pequeñas (<= 60mm)
          return cabezal <= 60;
        }
        if (mNum === 5) {
          // Extrusora 5: bobinas ultra pequeñas (<= 50mm)
          return cabezal <= 50;
        }
        if (mNum === 6) {
          // Extrusora 6: bobinas medianas (61mm a 110mm)
          return cabezal > 60 && cabezal <= 110;
        }
        if (mNum === 2 || mNum === 3) {
          // Extrusoras 2 y 3: bobinas medianas-grandes (111mm a 120mm)
          return cabezal > 110 && cabezal <= 120;
        }
        if (mNum === 4) {
          // Extrusora 4: bobinas de gran ancho (> 120mm)
          return cabezal > 120 && cabezal <= 150;
        }
        // Fallback genérico para extrusoras sin número en el nombre
        if (maquina.anchoMaximoMm > 0) {
          return cabezal <= maquina.anchoMaximoMm;
        }
      }
    }

    return false;
  } else if (maquina.tipo === 'Selladora') {
    if (producto.tipoProducto !== 'Bolsa') return false;
    if (maquina.anchoMaximoMm > 0) {
      const ancho = producto.ancho || 0;
      return ancho <= maquina.anchoMaximoMm;
    }
    return true;
  } else if (maquina.tipo === 'Impresora') {
    if (!producto.conImpresion) return false;
    if (maquina.anchoMaximoMm > 0) {
      const ancho = producto.anchoBobina || producto.ancho || 0;
      return ancho <= maquina.anchoMaximoMm;
    }
    return true;
  } else if (maquina.tipo === 'Refiladora') {
    if (!producto.tipoRefilado && producto.tipoProducto !== 'Bobina') return false;
    if (maquina.anchoMaximoMm > 0) {
      const ancho = producto.anchoBobina || producto.ancho || 0;
      return ancho <= maquina.anchoMaximoMm;
    }
    return true;
  }

  return true;
}

export async function getCompatibleProductsAndOrders(maquinaId: string) {
  const session = await requireAuth();
  const userId = (session.user as any).id;
  try {
    const maquina = await prisma.maquina.findFirst({
      where: {
        id: maquinaId,
        OR: [{ userId }, { userId: null }],
      },
      include: { productosCompatibles: true },
    });

    if (!maquina) throw new Error('Máquina no encontrada');

    const allProducts = await prisma.productoCliente.findMany({
      where: {
        activo: true,
        OR: [{ userId }, { userId: null }],
      },
      include: {
        cliente: true,
        maquinasCompatibles: true,
      },
      orderBy: { nombreProducto: 'asc' },
    });

    const allOrders = await prisma.pedido.findMany({
      where: {
        OR: [{ userId }, { userId: null }],
        estado: { in: ['Pendiente', 'EnProceso'] },
      },
      include: {
        cliente: true,
        productoCliente: {
          include: {
            maquinasCompatibles: true,
          },
        },
      },
      orderBy: { fechaEntrega: 'asc' },
    });

    const compatibleProducts = allProducts.filter((p) => isProductCompatibleWithMachine(p, maquina));
    const compatibleOrders = allOrders.filter((o) => isProductCompatibleWithMachine(o.productoCliente, maquina));

    return {
      compatibleProducts,
      compatibleOrders,
    };
  } catch (error: any) {
    console.error('Error al obtener compatibilidad:', error);
    throw new Error('Error al obtener compatibilidad: ' + error.message);
  }
}

export async function getMaquinaStats(maquinaId: string) {
  const session = await requireAuth();
  const userId = (session.user as any).id;
  try {
    const maquina = await prisma.maquina.findFirst({
      where: { id: maquinaId, userId },
      include: {
        producciones: {
          where: { userId },
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
