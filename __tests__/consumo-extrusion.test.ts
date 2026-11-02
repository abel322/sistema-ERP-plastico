import { describe, it, expect, vi } from 'vitest';
import { resolverConsumoExtrusion } from '@/lib/consumo-extrusion-logic';

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
});
