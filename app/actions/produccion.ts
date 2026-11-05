'use server';

export {
  eliminarORevertirFaseSellado,
  eliminarOrdenProduccion,
  descontarConsumoExtrusionTurno,
  finalizarFaseSelladoConDestino,
  crearRegistroSellado,
  eliminarRegistroExtrusion,
  unificarOrdenesExtrusionAction,
  avanzarASelladoMultiLineaAction,
} from '@/actions/produccion';

export type {
  UnificarOrdenesExtrusionParams,
  LineaSelladoConfig,
} from '@/actions/produccion';
