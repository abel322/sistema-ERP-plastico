import { AreaProduccion, TipoProducto, EstadoProductoTerminado, SiguienteArea } from '@prisma/client';

export interface DestinoProducto {
  estado: EstadoProductoTerminado;
  siguienteArea: SiguienteArea;
  descripcionDestino: string;
}

/**
 * Determina el destino de un producto terminado basado en:
 * - Área de origen (donde se finalizó la producción)
 * - Tipo de producto (Bolsa o Bobina)
 * - Si tiene impresión/serigrafía
 * 
 * Flujo de producción:
 * 
 * EXTRUSIÓN:
 *   - Bobina sin impresión → Listo para Despacho
 *   - Bobina con impresión → Pendiente Serigrafía
 *   - Bolsa sin impresión → Pendiente Sellado
 *   - Bolsa con impresión → Pendiente Serigrafía
 * 
 * SERIGRAFÍA:
 *   - Bobina → Listo para Despacho (ya impresa)
 *   - Bolsa → Pendiente Sellado (necesita sellarse después de imprimir)
 * 
 * SELLADO:
 *   - Cualquier producto → Listo para Despacho (proceso final para bolsas)
 * 
 * REFILADO:
 *   - Cualquier producto → Listo para Despacho (proceso de ajuste final)
 */
export function determinarDestinoProducto(
  areaOrigen: AreaProduccion,
  tipoProducto: TipoProducto,
  conImpresion: boolean
): DestinoProducto {

  // SELLADO: Siempre es el proceso final para bolsas
  if (areaOrigen === 'Sellado') {
    return {
      estado: 'ListoDespacho',
      siguienteArea: 'Ninguna',
      descripcionDestino: 'Producto sellado listo para despacho'
    };
  }

  // REFILADO: Siempre es el proceso final de ajuste
  if (areaOrigen === 'Refilado') {
    return {
      estado: 'ListoDespacho',
      siguienteArea: 'Ninguna',
      descripcionDestino: 'Producto refilado listo para despacho'
    };
  }

  // SERIGRAFÍA:
  if (areaOrigen === 'Serigrafia') {
    if (tipoProducto === 'Bobina') {
      // Bobina impresa → Pendiente de Refilado (o siguiente proceso)
      return {
        estado: 'PendienteArea',
        siguienteArea: 'Refilado',
        descripcionDestino: 'Bobina impresa pendiente de refilado/proceso'
      };
    } else {
      // Bolsa impresa → Necesita sellado
      return {
        estado: 'PendienteArea',
        siguienteArea: 'Sellado',
        descripcionDestino: 'Bolsa impresa pendiente de sellado'
      };
    }
  }

  // EXTRUSIÓN:
  if (areaOrigen === 'Extrusion') {
    if (tipoProducto === 'Bobina') {
      if (conImpresion) {
        // Bobina que necesita impresión
        return {
          estado: 'PendienteArea',
          siguienteArea: 'Serigrafia',
          descripcionDestino: 'Bobina pendiente de serigrafía/impresión'
        };
      } else {
        // Bobina sin impresión → Lista para despacho
        return {
          estado: 'ListoDespacho',
          siguienteArea: 'Ninguna',
          descripcionDestino: 'Bobina lista para despacho'
        };
      }
    } else {
      // Bolsa
      if (conImpresion) {
        // Bolsa que necesita impresión primero
        return {
          estado: 'PendienteArea',
          siguienteArea: 'Serigrafia',
          descripcionDestino: 'Bolsa pendiente de serigrafía/impresión'
        };
      } else {
        // Bolsa sin impresión → Necesita sellado
        return {
          estado: 'PendienteArea',
          siguienteArea: 'Sellado',
          descripcionDestino: 'Bolsa pendiente de sellado'
        };
      }
    }
  }

  // Default: Listo para despacho
  return {
    estado: 'ListoDespacho',
    siguienteArea: 'Ninguna',
    descripcionDestino: 'Producto terminado'
  };
}

/**
 * Obtiene el nombre legible del área
 */
export function getNombreArea(area: AreaProduccion | SiguienteArea): string {
  const nombres: Record<string, string> = {
    'Extrusion': 'Extrusión',
    'Sellado': 'Sellado',
    'Serigrafia': 'Serigrafía',
    'Refilado': 'Refilado',
    'Ninguna': 'Ninguna'
  };
  return nombres[area] || area;
}

/**
 * Obtiene el color de badge para el estado
 */
export function getColorEstado(estado: EstadoProductoTerminado): string {
  const colores: Record<EstadoProductoTerminado, string> = {
    'ListoDespacho': 'bg-green-100 text-green-800',
    'PendienteArea': 'bg-yellow-100 text-yellow-800',
    'Despachado': 'bg-gray-100 text-gray-800'
  };
  return colores[estado] || 'bg-gray-100 text-gray-800';
}

/**
 * Obtiene el color de badge para la siguiente área
 */
export function getColorSiguienteArea(area: SiguienteArea): string {
  const colores: Record<SiguienteArea, string> = {
    'Sellado': 'bg-blue-100 text-blue-800',
    'Serigrafia': 'bg-purple-100 text-purple-800',
    'Refilado': 'bg-orange-100 text-orange-800',
    'Ninguna': 'bg-gray-100 text-gray-800'
  };
  return colores[area] || 'bg-gray-100 text-gray-800';
}
