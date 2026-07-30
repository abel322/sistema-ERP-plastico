import { describe, it, expect } from 'vitest';
import { calculateBagWeight, getPlasticDensity } from '../lib/utils/bag-weight';

describe('calculateBagWeight', () => {
  it('calculates weight correctly for tipoBolsa === "sencilla"', () => {
    // raw = 30 * 40 * 2 = 2400. / 1000 = 2.4
    const peso = calculateBagWeight({
      tipoBolsa: 'sencilla',
      ancho: 30,
      largo: 40,
      calibre: 2,
    });
    expect(peso).toBe(2.4);
  });

  it('calculates weight correctly for tipoBolsa === "fuelle"', () => {
    // raw = (30 + (5 * 2)) * 40 * 2 = (40) * 40 * 2 = 3200. / 1000 = 3.2
    const peso = calculateBagWeight({
      tipoBolsa: 'fuelle',
      ancho: 30,
      largo: 40,
      calibre: 2,
      fuelle: 5,
    });
    expect(peso).toBe(3.2);
  });

  it('calculates weight correctly for tipoBolsa === "valvula"', () => {
    // raw = ((30 * 2) + (5 * 2) + 10) * 40 * 2 = (60 + 10 + 10) * 40 * 2 = 80 * 80 = 6400. / 1000 = 6.4
    const peso = calculateBagWeight({
      tipoBolsa: 'valvula',
      ancho: 30,
      largo: 40,
      calibre: 2,
      fuelle: 5,
      solapa: 10,
    });
    expect(peso).toBe(6.4);
  });

  it('calculates weight correctly for tipoBolsa === "asa"', () => {
    // base = (30 + (5 * 2)) * 40 * 2 = 40 * 40 * 2 = 3200
    // troquel = 10 * 5 * 2 = 100
    // raw = 3200 - 100 = 3100. / 1000 = 3.1
    const peso = calculateBagWeight({
      tipoBolsa: 'asa',
      ancho: 30,
      largo: 40,
      calibre: 2,
      fuelle: 5,
      anchoTroquel: 10,
      largoTroquel: 5,
    });
    expect(peso).toBe(3.1);
  });

  it('applies plastic density factors correctly', () => {
    // sencilla with PEBD density (0.92)
    // raw = 30 * 40 * 2 = 2400. * 0.92 = 2208 / 1000 = 2.208
    const pesoPebd = calculateBagWeight({
      tipoBolsa: 'sencilla',
      ancho: 30,
      largo: 40,
      calibre: 2,
      densidad: getPlasticDensity('PEBD'),
    });
    expect(pesoPebd).toBe(2.208);
  });

  it('returns 0 if essential dimensions are missing', () => {
    expect(calculateBagWeight({ tipoBolsa: 'sencilla', ancho: 0, largo: 40, calibre: 2 })).toBe(0);
    expect(calculateBagWeight({ tipoBolsa: 'sencilla', ancho: 30, largo: 0, calibre: 2 })).toBe(0);
    expect(calculateBagWeight({ tipoBolsa: 'sencilla', ancho: 30, largo: 40, calibre: 0 })).toBe(0);
  });
});
