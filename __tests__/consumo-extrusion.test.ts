import { describe, it, expect, vi } from 'vitest';
import { resolverConsumoExtrusion, revertirConsumoExtrusion, revertirSalidasTurnoExtrusion } from '../lib/consumo-extrusion-logic';

describe('resolverConsumoExtrusion - Regla Real de Planta (Base 100% Virgen + Añadidura Peletizado)', () => {
  it('calcula resinas vírgenes sobre el 100% de kgProducidos sin restar el peletizado (200 kg -> 140 kg 3003, 60 kg Lineal, 20 kg Peletizado)', async () => {
    const mockTx = {
      inventario: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'pel-baja-id',
          codigo: 'PEL-BAJA',
          nombre: 'Peletizado Transparente Baja',
          categoria: 'Peletizado',
          cantidad: 500,
        }),
        findFirst: vi.fn().mockImplementation(async ({ where }: any) => {
          const str = JSON.stringify(where).toLowerCase();
          if (str.includes('3003')) {
            return { id: 'mp-3003', codigo: 'MP-3003', nombre: 'PEBD 3003', categoria: 'MateriaPrima' };
          }
          if (str.includes('lineal')) {
            return { id: 'mp-lineal', codigo: 'MP-LIN', nombre: 'Lineal LLDPE', categoria: 'MateriaPrima' };
          }
          if (str.includes('mb-3') || str.includes('deslizante')) {
            return { id: 'ad-desl', codigo: 'MB-3', nombre: 'Deslizante', categoria: 'Aditivo' };
          }
          return null;
        }),
      },
    };

    const formulacion = {
      peletizadoId: 'pel-baja-id',
      peletizadoPorcentaje: 10, // +10% añadidura directa
      form3003: 70,             // 70% de la base virgen (100%)
      formLineal: 30,           // 30% de la base virgen (100%)
      formDeslizante: 2,        // 2% dosificación directa
    };

    const resultado = await resolverConsumoExtrusion(mockTx, formulacion, 200);

    expect(resultado).not.toBeNull();
    // Peletizado: 200 * 0.10 = 20 kg (0.8 sacas)
    expect(resultado?.peletizado?.kg).toBeCloseTo(20, 4);
    expect((resultado?.peletizado?.kg || 0) / 25).toBeCloseTo(0.8, 4);

    // Resinas vírgenes: 3003 = 140 kg (5.6 sacas), Lineal = 60 kg (2.4 sacas)
    const r3003 = resultado?.resinasVirgenes.find((r) => r.label === '3003');
    const rLineal = resultado?.resinasVirgenes.find((r) => r.label === 'Lineal');

    expect(r3003?.kg).toBeCloseTo(140, 4);
    expect((r3003?.kg || 0) / 25).toBeCloseTo(5.6, 4);

    expect(rLineal?.kg).toBeCloseTo(60, 4);
    expect((rLineal?.kg || 0) / 25).toBeCloseTo(2.4, 4);

    // Aditivo: 200 * 0.02 = 4 kg
    const adDesl = resultado?.aditivos.find((a) => a.label === 'Deslizante');
    expect(adDesl?.kg).toBeCloseTo(4, 4);
  });
  it('calcula correctamente dosificación en KILOGRAMOS para tanda compuesta (Cestera 100 kg molido + 50 kg 3003 en 150 kg producidos)', async () => {
    const mockTx = {
      inventario: {
        findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
          if (where.id === 'pel-alta-id') {
            return {
              id: 'pel-alta-id',
              codigo: 'MOL-ALTA',
              nombre: 'Peletizado Transparente Alta',
              categoria: 'Peletizado',
              cantidad: 1000,
            };
          }
          if (where.id === 'res-3003-id') {
            return {
              id: 'res-3003-id',
              codigo: 'MP-3003',
              nombre: 'Polietileno de baja densidad 3003',
              categoria: 'MateriaPrima',
              cantidad: 5000,
            };
          }
          return null;
        }),
        findFirst: vi.fn().mockImplementation(async ({ where }: any) => {
          const str = JSON.stringify(where).toLowerCase();
          if (str.includes('3003')) {
            return { id: 'res-3003-id', codigo: 'MP-3003', nombre: 'Polietileno de baja densidad 3003', categoria: 'MateriaPrima' };
          }
          return null;
        }),
      },
    };

    const formulacion = {
      tipoDosificacionMolido: 'KILOGRAMOS' as const,
      peletizadoId: 'pel-alta-id',
      peletizadoKgPor100: 100,
      llevaResinaEnMolido: true,
      resinaMolidoId: 'res-3003-id',
      resinaMolidoKgPor100: 50,
      form3003: 50, // 50% virgen base
    };

    const resultado = await resolverConsumoExtrusion(mockTx, formulacion, 150);

    expect(resultado).not.toBeNull();
    // Tanda = 100 + 50 = 150 kg
    // Peletizado: 150 * (100 / 150) = 100 kg (4.0 sacas)
    expect(resultado?.peletizado?.kg).toBeCloseTo(100, 2);
    expect((resultado?.peletizado?.kg || 0) / 25).toBeCloseTo(4.0, 2);

    // 3003 extra de corte: 150 * (50 / 150) = 50 kg (2.0 sacas)
    expect(resultado?.resinaMolidoExtra?.kg).toBeCloseTo(50, 2);
    expect((resultado?.resinaMolidoExtra?.kg || 0) / 25).toBeCloseTo(2.0, 2);

    // 3003 base (50% de 150 kg) = 75 kg
    const r3003 = resultado?.resinasVirgenes.find((r) => r.label === '3003');
    expect(r3003?.kg).toBeCloseTo(75, 2);
    expect((r3003?.kg || 0) / 25).toBeCloseTo(3.0, 2);
  });
  it('revertirConsumoExtrusion incluye la reversión de resinaMolidoExtra (3003 de corte/enriquecimiento)', async () => {
    const movimientosCreados: any[] = [];
    const stockActualizado: any[] = [];

    const mockTx = {
      inventario: {
        update: vi.fn().mockImplementation(async ({ where, data }: any) => {
          stockActualizado.push({ id: where.id, increment: data.cantidad?.increment });
          return { id: where.id };
        }),
      },
      movimientoInventario: {
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          movimientosCreados.push(data);
          return { id: 'mov-' + movimientosCreados.length, ...data };
        }),
      },
    };

    const consumo = {
      peletizado: {
        inventarioId: 'pel-id',
        nombre: 'Peletizado Transparente Alta',
        label: 'Peletizado',
        kg: 100,
      },
      resinaMolidoExtra: {
        inventarioId: '3003-extra-id',
        nombre: 'Polietileno de baja densidad 3003',
        label: '3003 Extra Mezcla',
        kg: 50,
        esExtraMezcla: true,
      },
      resinasVirgenes: [
        {
          inventarioId: '3003-base-id',
          nombre: '3003 Base',
          label: '3003',
          kg: 75,
        },
      ],
      aditivos: [],
    };

    await revertirConsumoExtrusion(mockTx, {
      consumo,
      loteCodigo: 'EXT-TEST-001',
      turno: 'Manana',
      responsable: 'Tester',
      accion: 'Eliminación',
    });

    // Se deben generar 3 entradas: Peletizado, 3003 Extra y 3003 Base
    expect(movimientosCreados.length).toBe(3);

    const movPel = movimientosCreados.find((m) => m.inventarioId === 'pel-id');
    const movExtra = movimientosCreados.find((m) => m.inventarioId === '3003-extra-id');
    const movBase = movimientosCreados.find((m) => m.inventarioId === '3003-base-id');

    expect(movPel?.cantidad).toBe(100);
    expect(movPel?.tipo).toBe('Entrada');

    expect(movExtra?.cantidad).toBe(50);
    expect(movExtra?.tipo).toBe('Entrada');
    expect(movExtra?.motivo).toContain('Enriquecimiento');

    expect(movBase?.cantidad).toBe(75);
    expect(movBase?.tipo).toBe('Entrada');

    // Comprobar que en stock se reintegraron los 50 kg de resina extra
    const stockExtra = stockActualizado.find((s) => s.id === '3003-extra-id');
    expect(stockExtra?.increment).toBe(50);
  });
});
