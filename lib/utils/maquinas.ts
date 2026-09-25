export interface MaquinaCompatInput {
  id: string;
  nombre: string;
  tipo?: string | null;
  anchoMaximoMm?: number | null;
}

export interface ProductoClienteCompatInput {
  id?: string;
  nombreProducto?: string;
  tipoProducto?: string;
  extMaquinaExtrusora?: number | string | null;
  extDiametroCabezal?: number | null;
  anchoBobina?: number | null;
  ancho?: number | null;
  conImpresion?: boolean | null;
  tipoRefilado?: string | null;
  maquinasCompatibles?: Array<{ id: string; nombre?: string | null }> | null;
}

/**
 * Evalúa si un producto es compatible con una máquina industrial según:
 * 1. Asignación explícita (extMaquinaExtrusora o relación maquinasCompatibles).
 * 2. Límites físicos de cabezal/dado (extDiametroCabezal / anchoBobina) para extrusoras.
 * 3. Restricciones operativas para selladoras, impresoras y refiladoras.
 */
export function isProductCompatibleWithMachine(
  producto: ProductoClienteCompatInput | null | undefined,
  maquina: MaquinaCompatInput | null | undefined
): boolean {
  if (!producto || !maquina) return false;

  const mNom = (maquina.nombre || '').trim().toLowerCase();
  const mNumMatch = mNom.match(/\d+/);
  const mNum = mNumMatch ? parseInt(mNumMatch[0], 10) : null;
  const anchoMax = maquina.anchoMaximoMm || 0;

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
      if (
        producto.maquinasCompatibles.some(
          (mc) => mc.id === maquina.id || (mc.nombre && mc.nombre.trim().toLowerCase() === mNom)
        )
      ) {
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
        if (anchoMax > 0) {
          return cabezal <= anchoMax;
        }
      }
    }

    return false;
  } else if (maquina.tipo === 'Selladora') {
    if (producto.tipoProducto !== 'Bolsa') return false;
    if (anchoMax > 0) {
      const ancho = producto.ancho || 0;
      return ancho <= anchoMax;
    }
    return true;
  } else if (maquina.tipo === 'Impresora') {
    if (!producto.conImpresion) return false;
    if (anchoMax > 0) {
      const ancho = producto.anchoBobina || producto.ancho || 0;
      return ancho <= anchoMax;
    }
    return true;
  } else if (maquina.tipo === 'Refiladora') {
    if (!producto.tipoRefilado && producto.tipoProducto !== 'Bobina') return false;
    if (anchoMax > 0) {
      const ancho = producto.anchoBobina || producto.ancho || 0;
      return ancho <= anchoMax;
    }
    return true;
  }

  return true;
}
