'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export function parseParametrosSellado(data: any) {
  if (!data) return {};
  const parseNum = (val: any) =>
    val !== undefined && val !== null && val !== '' ? parseFloat(val) : null;
  const parseIntNum = (val: any) =>
    val !== undefined && val !== null && val !== '' ? parseInt(val) : null;

  return {
    temperaturaSuperior: parseNum(data.temperaturaSuperior ?? data.sldTempSuperior),
    temperaturaInferior: parseNum(data.temperaturaInferior ?? data.sldTempInferior),
    temperaturaValvula: parseNum(data.temperaturaValvula ?? data.sldTempValvula),
    temperaturaCuchilla: parseNum(data.temperaturaCuchilla ?? data.sldTempCuchilla),
    preselladoA: parseNum(data.preselladoA ?? data.sldPresellado_A),
    preselladoB: parseNum(data.preselladoB ?? data.sldPresellado_B),
    temperaturaAmbiente: parseNum(data.temperaturaAmbiente ?? data.sldTemperaturaAmbiente),
    tornilloEsparrago: parseNum(data.tornilloEsparrago ?? data.sldTornilloEsparrago),
    capacidadBolsa: parseIntNum(data.capacidadBolsa ?? data.sldCapacidadBolsa),

    tiempoLimite: parseIntNum(data.tiempoLimite ?? data.sldTiempoLimite),
    microperforaciones: (data.microperforaciones ?? data.sldMicroperforaciones) || null,
    muleteado: (data.muleteado ?? data.sldMuleteado) || null,
    presionTroquelValvula: parseNum(data.presionTroquelValvula ?? data.sldPresionTroquelValvula),

    rodilloAnchoValvula: parseIntNum(data.rodilloAnchoValvula ?? data.sldRodilloAnchoValvula),
    gpm: parseIntNum(data.gpm ?? data.sldGPM),
    velocidadTransportador: parseNum(data.velocidadTransportador ?? data.sldVelocidadTransportador),
    cicloTrabajo: parseNum(data.cicloTrabajo ?? data.sldCicloTrabajo),

    presionBalancin1: parseNum(data.presionBalancin1 ?? data.sldPresionBalancin1),
    presionBalancin2: parseNum(data.presionBalancin2 ?? data.sldPresionBalancin2),
    presionBalancin3: parseNum(data.presionBalancin3 ?? data.sldPresionBalancin3),

    alturaCabezalExtDerecho: parseNum(data.alturaCabezalExtDerecho ?? data.sldAlturaCabezalExtDerecho),
    alturaCabezalExtIzquierdo: parseNum(data.alturaCabezalExtIzquierdo ?? data.sldAlturaCabezalExtIzquierdo),
    bandaTransportadora: parseNum(data.bandaTransportadora ?? data.sldBandaTransportadora),
    medidaPortabobina: parseIntNum(data.medidaPortabobina ?? data.sldMedidaPortabobina),
    ajusteSensorFail: parseIntNum(data.ajusteSensorFail ?? data.sldAjusteSensorFail),

    tornilloDerMovHorizCabezalDer: parseNum(data.tornilloDerMovHorizCabezalDer),
    tornilloIzqMovHorizCabezalDer: parseNum(data.tornilloIzqMovHorizCabezalDer),
    tornilloDerMovHorizCabezalIzq: parseNum(data.tornilloDerMovHorizCabezalIzq),
    tornilloIzqMovHorizCabezalIzq: parseNum(data.tornilloIzqMovHorizCabezalIzq),

    tornilloAmortiguadorCabezalA: parseNum(data.tornilloAmortiguadorCabezalA),
    tornilloAmortiguadorCabezalB: parseNum(data.tornilloAmortiguadorCabezalB),
    tornilloAmortiguadorCabezalC: parseNum(data.tornilloAmortiguadorCabezalC),

    fuelleSuperiorIzquierdo: parseNum(data.fuelleSuperiorIzquierdo),
    fuelleSuperiorDerecho: parseNum(data.fuelleSuperiorDerecho),
    fuelleInferiorIzquierdo: parseNum(data.fuelleInferiorIzquierdo),
    fuelleInferiorDerecho: parseNum(data.fuelleInferiorDerecho),
    anchoBolsaDespuesTriangulo: parseNum(data.anchoBolsaDespuesTriangulo),
    distanciaBarraRoscadaTriangulo: parseNum(data.distanciaBarraRoscadaTriangulo),
    longitudBolsa: parseNum(data.longitudBolsa),

    feedingBagAngle: parseNum(data.feedingBagAngle),
    distanciaSensorRegistroColor: parseNum(data.distanciaSensorRegistroColor),
    distanciaSensorMovimiento: parseNum(data.distanciaSensorMovimiento),
    distanciaPresellado: parseNum(data.distanciaPresellado),

    presionSopladoArriba: parseNum(data.presionSopladoArriba ?? data.sldPresionSopladoArriba),
    presionSopladoAbajo: parseNum(data.presionSopladoAbajo ?? data.sldPresionSopladoAbajo),
    presionRodilloServoL: parseNum(data.presionRodilloServoL ?? data.sldPresionRodilloServoL),
    presionRodilloServoR: parseNum(data.presionRodilloServoR ?? data.sldPresionRodilloServoR),
    soplarInicio: parseIntNum(data.soplarInicio ?? data.sldSoplarInicio),
    soplarTerminar: parseIntNum(data.soplarTerminar ?? data.sldSoplarTerminar),

    selladoSiliconaLateralIniciar: parseNum(data.selladoSiliconaLateralIniciar),
    selladoSiliconaLateralFinal: parseNum(data.selladoSiliconaLateralFinal),
    tiempoPrecalentar: parseNum(data.tiempoPrecalentar),
    temporizador: parseNum(data.temporizador),
    plancha: parseNum(data.plancha),
    montajeBobina: data.montajeBobina || null,
    disenoImpresionValvula: data.disenoImpresionValvula || null,
    llevaPostizo: Boolean(data.llevaPostizo),
  };
}

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
