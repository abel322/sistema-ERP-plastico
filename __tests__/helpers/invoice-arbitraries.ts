/**
 * Arbitraries (generadores) para property-based testing de facturas
 * 
 * Estos generadores crean datos aleatorios válidos para probar propiedades
 * universales del sistema de facturación.
 */

import fc from 'fast-check';

/**
 * Generador de detalle de factura válido
 * 
 * Genera detalles con:
 * - cantidad: 0.01 a 10000
 * - precioUnitario: 0.01 a 1000
 * - unidad: valores comunes
 * - descripción: string no vacío
 */
export function detalleFacturaArbitrary() {
  return fc.record({
    descripcion: fc.string({ minLength: 1, maxLength: 100 }),
    cantidad: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
    unidad: fc.constantFrom('Unidades', 'Kilogramos', 'Metros', 'Litros'),
    precioUnitario: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
  });
}

/**
 * Generador de array de detalles de factura
 * 
 * Genera arrays con 1 a 10 detalles para simular facturas realistas
 */
export function detallesFacturaArbitrary() {
  return fc.array(detalleFacturaArbitrary(), { minLength: 1, maxLength: 10 });
}

/**
 * Generador de tasa de IVA
 * 
 * Genera tasas comunes de IVA (0%, 10%, 16%, 21%)
 */
export function ivaRateArbitrary() {
  return fc.constantFrom(0, 10, 16, 21);
}

/**
 * Generador de valores monetarios positivos
 * 
 * Útil para generar subtotales, IVA, totales
 */
export function moneyArbitrary() {
  return fc.float({ min: 0, max: 1000000, noNaN: true });
}

/**
 * Generador de factura con relaciones para notificaciones
 * 
 * Genera facturas con:
 * - número de factura único
 * - cliente con id y nombre
 * - detalles con despachoId
 * - valores monetarios válidos
 */
export function facturaWithRelationsArbitrary() {
  return fc.record({
    id: fc.uuid(),
    numero: fc.string({ minLength: 10, maxLength: 20 }).map(s => `FAC-${s}`),
    clienteId: fc.uuid(),
    fecha: fc.date(),
    fechaVencimiento: fc.option(fc.date(), { nil: null }),
    subtotal: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
    iva: fc.float({ min: Math.fround(0), max: Math.fround(16000), noNaN: true }),
    total: fc.float({ min: Math.fround(0.01), max: Math.fround(116000), noNaN: true }),
    estado: fc.constantFrom('Emitida', 'Borrador', 'Pagada', 'Anulada'),
    metodoPago: fc.option(fc.constantFrom('Efectivo', 'Transferencia', 'Cheque'), { nil: null }),
    observaciones: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
    pagadaAt: fc.option(fc.date(), { nil: null }),
    createdAt: fc.date(),
    updatedAt: fc.date(),
    cliente: fc.record({
      id: fc.uuid(),
      nombre: fc.string({ minLength: 3, maxLength: 50 }),
    }),
    detalles: fc.array(
      fc.record({
        id: fc.uuid(),
        despachoId: fc.option(fc.uuid(), { nil: null }),
      }),
      { minLength: 1, maxLength: 5 }
    ),
  });
}
