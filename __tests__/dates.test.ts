import { describe, it, expect } from 'vitest';
import {
  parseLocalDateToMiddayUTC,
  formatUTCtoDisplayDate,
  formatUTCtoShortDisplayDate,
  formatUTCtoInputDate,
  getTodayInputDate,
} from '@/lib/utils/dates';
import { formatFechaLote } from '@/lib/utils/lote';

describe('dates utils', () => {
  it('parseLocalDateToMiddayUTC fija la fecha a las 12:00:00.000Z de ese día', () => {
    const d1 = parseLocalDateToMiddayUTC('2026-10-30');
    expect(d1.toISOString()).toBe('2026-10-30T12:00:00.000Z');
    expect(d1.getUTCFullYear()).toBe(2026);
    expect(d1.getUTCMonth()).toBe(9); // 0-indexed, 9 = October
    expect(d1.getUTCDate()).toBe(30);

    const d2 = parseLocalDateToMiddayUTC('2026-10-28');
    expect(d2.toISOString()).toBe('2026-10-28T12:00:00.000Z');
    expect(d2.getUTCDate()).toBe(28);

    const d3 = parseLocalDateToMiddayUTC('2026-10-30T00:00:00.000Z');
    expect(d3.toISOString()).toBe('2026-10-30T12:00:00.000Z');
  });

  it('formatUTCtoDisplayDate formatea a DD/MM/YYYY sin desfases', () => {
    const d = new Date('2026-10-30T12:00:00.000Z');
    expect(formatUTCtoDisplayDate(d)).toBe('30/10/2026');
    expect(formatUTCtoDisplayDate('2026-10-30T12:00:00.000Z')).toBe('30/10/2026');
    expect(formatUTCtoDisplayDate(null)).toBe('-');
    expect(formatUTCtoDisplayDate('')).toBe('-');
  });

  it('formatUTCtoShortDisplayDate formatea a DD/MM', () => {
    const d = new Date('2026-10-30T12:00:00.000Z');
    expect(formatUTCtoShortDisplayDate(d)).toBe('30/10');
  });

  it('formatUTCtoInputDate convierte a YYYY-MM-DD en UTC', () => {
    const d = new Date('2026-10-30T12:00:00.000Z');
    expect(formatUTCtoInputDate(d)).toBe('2026-10-30');
  });

  it('getTodayInputDate retorna una cadena YYYY-MM-DD válida', () => {
    const today = getTodayInputDate();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('formatFechaLote genera YYYYMMDD usando UTC de forma segura', () => {
    expect(formatFechaLote('2026-10-30')).toBe('20261030');
    expect(formatFechaLote(new Date('2026-10-30T12:00:00.000Z'))).toBe('20261030');
  });
});
