// types/produccion.ts
import { Turno } from '@prisma/client';

export interface LineaSelladoConfig {
  nombreVariante: string;
  maquinaId: string;
  metaUnidades?: number;
  metaKg?: number;
  operario?: string;
  turno?: Turno;
}

export interface UnificarOrdenesExtrusionParams {
  ordenesIds: string[];
  ordenPrincipalId?: string;
  nombreUnificado?: string;
}

export interface DetalleConsumoMP {
  peletizadoKg: number;
  resinasBaseKg: Record<string, number>;
  aditivosKg: Record<string, number>;
}

