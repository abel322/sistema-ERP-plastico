/**
 * Utilitarios de manejo seguro de fechas para evitar desfases por zona horaria UTC.
 */

/**
 * Convierte un string "YYYY-MM-DD" a un Date seguro fijado al mediodía UTC (12:00:00.000Z).
 * Al estar a las 12:00 UTC, ningún desfase de zona horaria (-12 a +12) cambiará el día calendario.
 */
export function parseLocalDateToMiddayUTC(dateString: string | Date | undefined | null): Date {
  if (!dateString) return new Date();
  if (dateString instanceof Date) return dateString;

  // Si viene con formato ISO completo, extraer la parte de la fecha
  const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;
  const parts = datePart.split('-');
  if (parts.length < 3) return new Date();
  const [year, month, day] = parts.map(Number);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return new Date();

  // Crear fecha fijada al mediodía UTC
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

/**
 * Formatea un Date a string "DD/MM/YYYY" usando componentes UTC para evitar desfases locales.
 */
export function formatUTCtoDisplayDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';

  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Formatea un Date a string "DD/MM" usando componentes UTC.
 */
export function formatUTCtoShortDisplayDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';

  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');

  return `${day}/${month}`;
}

/**
 * Devuelve la fecha de hoy en formato "YYYY-MM-DD" local para inputs type="date".
 */
export function getTodayInputDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convierte un Date o string a "YYYY-MM-DD" en UTC para inputs de fecha.
 */
export function formatUTCtoInputDate(date: Date | string | null | undefined): string {
  if (!date) return getTodayInputDate();
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return getTodayInputDate();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
