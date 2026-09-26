import { describe, it, expect, vi } from 'vitest';
import {
  generarCodigoLote,
  getAreaPrefix,
  formatFechaLote,
  generarCodigoLoteUnico,
} from '../lib/utils/lote';

describe('Trazabilidad e Identificador Único de Lote', () => {
  it('debe asignar el prefijo correcto según el área de producción', () => {
    expect(getAreaPrefix('Extrusion')).toBe('EXT');
    expect(getAreaPrefix('Serigrafia')).toBe('SER');
    expect(getAreaPrefix('Sellado')).toBe('SEL');
    expect(getAreaPrefix('Refilado')).toBe('REF');
    expect(getAreaPrefix('Otra')).toBe('PRD');
  });

  it('debe formatear la fecha correctamente a YYYYMMDD', () => {
    const fecha = new Date(2026, 8, 25); // Septiembre 25, 2026 (mes 8 es 0-indexed)
    expect(formatFechaLote(fecha)).toBe('20260925');
  });

  it('debe generar códigos de lote con el formato PREFIX-YYYYMMDD-XXXX', () => {
    const fecha = new Date(2026, 8, 25);
    const loteExt = generarCodigoLote('Extrusion', fecha);
    const loteSer = generarCodigoLote('Serigrafia', fecha);
    const loteSel = generarCodigoLote('Sellado', fecha);
    const loteRef = generarCodigoLote('Refilado', fecha);

    // Regex: 3 letras, guión, 8 dígitos, guión, 4 caracteres alfanuméricos
    const loteRegex = /^[A-Z]{3}-\d{8}-[A-F0-9]{4}$/;

    expect(loteExt).toMatch(loteRegex);
    expect(loteExt.startsWith('EXT-20260925-')).toBe(true);

    expect(loteSer).toMatch(loteRegex);
    expect(loteSer.startsWith('SER-20260925-')).toBe(true);

    expect(loteSel).toMatch(loteRegex);
    expect(loteSel.startsWith('SEL-20260925-')).toBe(true);

    expect(loteRef).toMatch(loteRegex);
    expect(loteRef.startsWith('REF-20260925-')).toBe(true);
  });

  it('debe generar códigos distintos en llamadas sucesivas (entropía)', () => {
    const fecha = new Date();
    const lotes = new Set();
    for (let i = 0; i < 50; i++) {
      lotes.add(generarCodigoLote('Extrusion', fecha));
    }
    expect(lotes.size).toBe(50);
  });

  it('generarCodigoLoteUnico debe validar contra la base de datos y reintentar si existe colisión', async () => {
    let callCount = 0;
    const mockPrisma = {
      produccion: {
        findUnique: vi.fn().mockImplementation(async ({ where }) => {
          callCount++;
          // Simular que el primer intento ya existe
          if (callCount === 1) {
            return { id: 'prod-existente', codigoLote: where.codigoLote };
          }
          return null;
        }),
      },
      productoTerminado: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };

    const fecha = new Date(2026, 8, 25);
    const lote = await generarCodigoLoteUnico(mockPrisma, 'Extrusion', fecha);

    expect(lote).toMatch(/^EXT-20260925-[A-F0-9]{4}$/);
    expect(callCount).toBeGreaterThanOrEqual(2);
  });

  it('debe vincular la trazabilidad madre-hija entre fases usando loteOrigen', () => {
    // 1. Fase Extrusión produce una bobina madre
    const bobinaExtrusion = {
      id: 'prod-ext-101',
      codigoLote: generarCodigoLote('Extrusion'),
      area: 'Extrusion',
      cantidadProducida: 250,
      unidad: 'Kilogramos',
    };

    expect(bobinaExtrusion.codigoLote.startsWith('EXT-')).toBe(true);

    // 2. Fase Sellado consume la bobina madre
    const ordenSellado = {
      id: 'prod-sel-202',
      codigoLote: generarCodigoLote('Sellado'),
      loteOrigen: bobinaExtrusion.codigoLote, // Referencia exacta de la bobina
      area: 'Sellado',
      cantidadProducida: 5000,
      unidad: 'Unidades',
    };

    expect(ordenSellado.codigoLote.startsWith('SEL-')).toBe(true);
    expect(ordenSellado.loteOrigen).toBe(bobinaExtrusion.codigoLote);

    // 3. Verificación de coincidencia exacta por loteOrigen
    const buscarStockPorLote = (loteBuscado: string) => {
      const stockDisponible = [
        { id: 'pt-1', codigoLote: 'EXT-20260920-0001', cantidadDisponible: 100 },
        { id: 'pt-2', codigoLote: bobinaExtrusion.codigoLote, cantidadDisponible: 250 },
      ];
      return stockDisponible.find((pt) => pt.codigoLote === loteBuscado);
    };

    const stockAsociado = buscarStockPorLote(ordenSellado.loteOrigen);
    expect(stockAsociado).toBeDefined();
    expect(stockAsociado?.id).toBe('pt-2');
    expect(stockAsociado?.cantidadDisponible).toBe(250);
  });
});
