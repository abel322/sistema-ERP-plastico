// types/operadores.ts

export type AreaOperadorTipo =
  | 'EXTRUSION'
  | 'SELLADO'
  | 'IMPRESION'
  | 'REFILADO'
  | 'PELETIZADO';

export interface OperadorItem {
  id: string;
  nombre: string;
  cedula?: string | null;
  area: AreaOperadorTipo;
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FormOperadorInput {
  nombre: string;
  cedula?: string;
  area: AreaOperadorTipo;
}

