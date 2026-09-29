'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { parseParametrosSellado } from '@/lib/utils/parametros-sellado';

export async function guardarParametrosSelladoTurnos({
  clienteId,
  productoId,
  parametrosDia,
  parametrosTarde,
}: {
  clienteId: string;
  productoId: string;
  parametrosDia: any;
  parametrosTarde: any;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('No autorizado');
  }

  const datosDia = parseParametrosSellado(parametrosDia);
  const datosTarde = parseParametrosSellado(parametrosTarde);

  const [dia, tarde] = await prisma.$transaction([
    prisma.parametrosSellado.upsert({
      where: { productoId_turno: { productoId, turno: 'DIA' } },
      update: { ...datosDia },
      create: { ...datosDia, productoId, turno: 'DIA' },
    }),
    prisma.parametrosSellado.upsert({
      where: { productoId_turno: { productoId, turno: 'TARDE' } },
      update: { ...datosTarde },
      create: { ...datosTarde, productoId, turno: 'TARDE' },
    }),
  ]);

  if (clienteId && productoId) {
    revalidatePath(`/clientes/${clienteId}/productos/${productoId}/editar-completo`);
    revalidatePath(`/clientes/${clienteId}/productos`);
  }

  return { success: true, dia, tarde };
}
