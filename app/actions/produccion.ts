'use server';

import type { LineaSelladoConfig, UnificarOrdenesExtrusionParams } from '@/types/produccion';
import {
  eliminarORevertirFaseSellado as eliminarORevertirFaseSelladoAction,
  eliminarOrdenProduccion as eliminarOrdenProduccionAction,
  descontarConsumoExtrusionTurno as descontarConsumoExtrusionTurnoAction,
  finalizarFaseSelladoConDestino as finalizarFaseSelladoConDestinoAction,
  crearRegistroSellado as crearRegistroSelladoAction,
  eliminarRegistroExtrusion as eliminarRegistroExtrusionAction,
  unificarOrdenesExtrusionAction as unificarOrdenesExtrusionActionImpl,
  avanzarASelladoMultiLineaAction as avanzarASelladoMultiLineaActionImpl,
} from '@/actions/produccion';

export async function unificarOrdenesExtrusionAction(params: UnificarOrdenesExtrusionParams) {
  return unificarOrdenesExtrusionActionImpl(params);
}

export async function avanzarASelladoMultiLineaAction(params: {
  ordenExtrusionId: string;
  lineas: LineaSelladoConfig[];
  modoAvance?: 'paralelo' | 'finalizar';
}) {
  return avanzarASelladoMultiLineaActionImpl(params);
}

export async function eliminarORevertirFaseSellado(ordenId: string, loteSelladoCodigo?: string) {
  return eliminarORevertirFaseSelladoAction(ordenId, loteSelladoCodigo);
}

export async function eliminarOrdenProduccion(ordenId: string, forzar: boolean = false) {
  return eliminarOrdenProduccionAction(ordenId, forzar);
}

export async function descontarConsumoExtrusionTurno(params: {
  produccionId: string;
  kgTurno: number;
  turno: string;
  operario?: string;
}) {
  return descontarConsumoExtrusionTurnoAction(params);
}

export async function finalizarFaseSelladoConDestino(
  ordenId: string,
  destinoSobrante: 'MOLIENDA' | 'ALMACEN_BOBINA',
  sobranteKg: number = 0
) {
  return finalizarFaseSelladoConDestinoAction(ordenId, destinoSobrante, sobranteKg);
}

export async function crearRegistroSellado(params: {
  produccionId: string;
  turno: any;
  operario: string;
  cantidad: number;
  merma?: number;
  reporte?: string;
  mermaColor?: number;
  mermaCristal?: number;
}) {
  return crearRegistroSelladoAction(params);
}

export async function eliminarRegistroExtrusion(registroId: string) {
  return eliminarRegistroExtrusionAction(registroId);
}
