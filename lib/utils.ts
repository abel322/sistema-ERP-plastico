import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Formatea un número usando la convención estándar de la aplicación
 * (es-VE: separador de miles con punto, decimales con coma).
 * Evita desbordamiento de decimales flotantes (ej. 6627,101 -> 6.627,10).
 */
export function formatNumber(
  valor: number | null | undefined,
  opciones?: { minDecimals?: number; maxDecimals?: number }
): string {
  if (valor === null || valor === undefined || isNaN(valor)) return '0,00';
  const minDecimals = opciones?.minDecimals ?? 2;
  const maxDecimals = opciones?.maxDecimals ?? 2;
  return valor.toLocaleString('es-VE', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });
}