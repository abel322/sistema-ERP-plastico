/**
 * Property-Based Tests para InvoiceCalculator
 * 
 * Estos tests verifican propiedades universales que deben cumplirse
 * para cualquier conjunto de datos válidos, usando fast-check para
 * generar múltiples casos de prueba automáticamente.
 * 
 * Feature: automatic-invoicing
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { InvoiceCalculator } from '../invoice-calculator';
import { detallesFacturaArbitrary } from '../../../__tests__/helpers/invoice-arbitraries';

// Configurar fast-check para ejecutar mínimo 100 iteraciones
fc.configureGlobal({ numRuns: 100 });

describe('InvoiceCalculator - Property-Based Tests', () => {
  /**
   * Property 4: Cálculo Correcto de Subtotales
   * 
   * **Validates: Requirements 2.5**
   * 
   * Para cualquier detalle de factura con cantidad y precio unitario, 
   * el subtotal debe ser exactamente igual a cantidad multiplicada por 
   * precio unitario, redondeado a dos decimales.
   */
  describe('Property 4: Cálculo Correcto de Subtotales', () => {
    it('debe calcular correctamente el subtotal para cualquier cantidad y precio unitario', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
          fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
          (cantidad, precioUnitario) => {
            // Act: Calcular subtotal usando InvoiceCalculator
            const subtotal = InvoiceCalculator.calculateDetalleSubtotal(cantidad, precioUnitario);

            // Calcular valor esperado manualmente
            const expectedSubtotal = cantidad * precioUnitario;
            const expectedRounded = Math.round(expectedSubtotal * 100) / 100;

            // Assert: Verificar que el subtotal es correcto
            // Requirement 2.5: Subtotal debe ser cantidad * precioUnitario redondeado a 2 decimales
            expect(subtotal).toBe(expectedRounded);

            // Verificar precisión de 2 decimales
            expect(subtotal).toBe(Math.round(subtotal * 100) / 100);

            // Verificar que no hay valores NaN o Infinity
            expect(Number.isFinite(subtotal)).toBe(true);

            // Verificar que el valor es no negativo
            expect(subtotal).toBeGreaterThanOrEqual(0);

            // Verificar formato de decimales
            const subtotalStr = subtotal.toFixed(2);
            expect(subtotalStr).toMatch(/^\d+\.\d{2}$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe ser conmutativo: cantidad * precio = precio * cantidad', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
          fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
          (cantidad, precioUnitario) => {
            // La multiplicación debe ser conmutativa
            const subtotal1 = InvoiceCalculator.calculateDetalleSubtotal(cantidad, precioUnitario);
            const subtotal2 = InvoiceCalculator.calculateDetalleSubtotal(precioUnitario, cantidad);

            // Los subtotales deben ser iguales
            expect(subtotal1).toBe(subtotal2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe manejar valores muy pequeños correctamente', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.01), max: Math.fround(0.1), noNaN: true }),
          fc.float({ min: Math.fround(0.01), max: Math.fround(0.1), noNaN: true }),
          (cantidad, precioUnitario) => {
            const subtotal = InvoiceCalculator.calculateDetalleSubtotal(cantidad, precioUnitario);

            // Verificar que el resultado es válido
            expect(Number.isFinite(subtotal)).toBe(true);
            expect(subtotal).toBeGreaterThanOrEqual(0);
            
            // Verificar precisión de 2 decimales
            expect(subtotal).toBe(Math.round(subtotal * 100) / 100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe manejar valores muy grandes correctamente', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(5000), max: Math.fround(10000), noNaN: true }),
          fc.float({ min: Math.fround(500), max: Math.fround(1000), noNaN: true }),
          (cantidad, precioUnitario) => {
            const subtotal = InvoiceCalculator.calculateDetalleSubtotal(cantidad, precioUnitario);

            // Verificar que el resultado es válido
            expect(Number.isFinite(subtotal)).toBe(true);
            expect(subtotal).toBeGreaterThanOrEqual(0);
            
            // Verificar precisión de 2 decimales
            expect(subtotal).toBe(Math.round(subtotal * 100) / 100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe manejar valores con muchos decimales correctamente', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true }),
          fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true }),
          (cantidad, precioUnitario) => {
            const subtotal = InvoiceCalculator.calculateDetalleSubtotal(cantidad, precioUnitario);

            // Verificar que el redondeo es consistente
            const manualCalc = cantidad * precioUnitario;
            const manualRounded = Math.round(manualCalc * 100) / 100;
            
            expect(subtotal).toBe(manualRounded);
            
            // Verificar que aplicar redondeo nuevamente no cambia el valor
            expect(InvoiceCalculator.roundToTwoDecimals(subtotal)).toBe(subtotal);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe ser proporcional: duplicar cantidad duplica el subtotal', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.01), max: Math.fround(5000), noNaN: true }),
          fc.float({ min: Math.fround(0.01), max: Math.fround(500), noNaN: true }),
          (cantidad, precioUnitario) => {
            const subtotal1 = InvoiceCalculator.calculateDetalleSubtotal(cantidad, precioUnitario);
            const subtotal2 = InvoiceCalculator.calculateDetalleSubtotal(cantidad * 2, precioUnitario);

            // El subtotal debe ser aproximadamente el doble (con tolerancia por redondeo)
            const expectedDouble = subtotal1 * 2;
            expect(Math.abs(subtotal2 - expectedDouble)).toBeLessThan(0.02);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe ser proporcional: duplicar precio duplica el subtotal', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
          fc.float({ min: Math.fround(0.01), max: Math.fround(500), noNaN: true }),
          (cantidad, precioUnitario) => {
            const subtotal1 = InvoiceCalculator.calculateDetalleSubtotal(cantidad, precioUnitario);
            const subtotal2 = InvoiceCalculator.calculateDetalleSubtotal(cantidad, precioUnitario * 2);

            // El subtotal debe ser aproximadamente el doble (con tolerancia por redondeo)
            const expectedDouble = subtotal1 * 2;
            expect(Math.abs(subtotal2 - expectedDouble)).toBeLessThan(0.02);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Cálculo Correcto de Totales de Factura
   * 
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   * 
   * Para cualquier factura, el subtotal debe ser la suma de todos los 
   * subtotales de sus detalles, el IVA debe ser el 16% del subtotal, 
   * y el total debe ser subtotal más IVA, todos redondeados a dos decimales.
   */
  describe('Property 6: Cálculo Correcto de Totales de Factura', () => {
    it('debe calcular correctamente subtotal, IVA y total para cualquier conjunto de detalles', () => {
      fc.assert(
        fc.property(
          detallesFacturaArbitrary(),
          (detalles) => {
            // Act: Calcular totales usando InvoiceCalculator
            const subtotal = InvoiceCalculator.calculateSubtotal(detalles);
            const iva = InvoiceCalculator.calculateIVA(subtotal, 16);
            const total = InvoiceCalculator.calculateTotal(subtotal, iva);

            // Calcular valores esperados manualmente
            const expectedSubtotal = detalles.reduce(
              (sum, detalle) => sum + (detalle.cantidad * detalle.precioUnitario),
              0
            );
            const expectedIva = expectedSubtotal * 0.16;
            const expectedTotal = expectedSubtotal + expectedIva;

            // Assert: Verificar que los cálculos son correctos
            // Requirement 3.1: Subtotal debe ser suma de todos los detalles
            expect(Math.abs(subtotal - expectedSubtotal)).toBeLessThan(0.01);

            // Requirement 3.2: IVA debe ser 16% del subtotal
            expect(Math.abs(iva - subtotal * 0.16)).toBeLessThan(0.01);

            // Requirement 3.3: Total debe ser subtotal + IVA
            expect(Math.abs(total - (subtotal + iva))).toBeLessThan(0.01);

            // Requirement 3.4: Todos los valores deben tener precisión de 2 decimales
            expect(subtotal).toBe(Math.round(subtotal * 100) / 100);
            expect(iva).toBe(Math.round(iva * 100) / 100);
            expect(total).toBe(Math.round(total * 100) / 100);

            // Verificar que no hay valores NaN o Infinity
            expect(Number.isFinite(subtotal)).toBe(true);
            expect(Number.isFinite(iva)).toBe(true);
            expect(Number.isFinite(total)).toBe(true);

            // Verificar que los valores son no negativos
            expect(subtotal).toBeGreaterThanOrEqual(0);
            expect(iva).toBeGreaterThanOrEqual(0);
            expect(total).toBeGreaterThanOrEqual(0);

            // Verificar relación matemática: total >= subtotal (porque IVA >= 0)
            expect(total).toBeGreaterThanOrEqual(subtotal);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe mantener la propiedad de asociatividad en la suma de detalles', () => {
      fc.assert(
        fc.property(
          detallesFacturaArbitrary(),
          (detalles) => {
            // La suma de subtotales debe ser igual sin importar el orden
            const subtotal1 = InvoiceCalculator.calculateSubtotal(detalles);
            const detallesReversed = [...detalles].reverse();
            const subtotal2 = InvoiceCalculator.calculateSubtotal(detallesReversed);

            // Los subtotales deben ser iguales (con tolerancia por redondeo)
            expect(Math.abs(subtotal1 - subtotal2)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe calcular IVA proporcional al subtotal', () => {
      fc.assert(
        fc.property(
          detallesFacturaArbitrary(),
          (detalles) => {
            const subtotal = InvoiceCalculator.calculateSubtotal(detalles);
            const iva = InvoiceCalculator.calculateIVA(subtotal, 16);

            // IVA debe ser proporcional: si subtotal se duplica, IVA se duplica
            const subtotalDoble = subtotal * 2;
            const ivaDoble = InvoiceCalculator.calculateIVA(subtotalDoble, 16);

            // Verificar proporcionalidad (con tolerancia por redondeo)
            const expectedIvaDoble = iva * 2;
            expect(Math.abs(ivaDoble - expectedIvaDoble)).toBeLessThan(0.02);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe calcular total como suma exacta de subtotal e IVA', () => {
      fc.assert(
        fc.property(
          detallesFacturaArbitrary(),
          (detalles) => {
            const subtotal = InvoiceCalculator.calculateSubtotal(detalles);
            const iva = InvoiceCalculator.calculateIVA(subtotal, 16);
            const total = InvoiceCalculator.calculateTotal(subtotal, iva);

            // Total debe ser exactamente subtotal + IVA (ambos ya redondeados)
            const expectedTotal = InvoiceCalculator.roundToTwoDecimals(subtotal + iva);
            expect(total).toBe(expectedTotal);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe manejar correctamente facturas con un solo detalle', () => {
      fc.assert(
        fc.property(
          fc.record({
            cantidad: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
            precioUnitario: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
          }),
          ({ cantidad, precioUnitario }) => {
            const detalles = [{ cantidad, precioUnitario }];
            
            const subtotal = InvoiceCalculator.calculateSubtotal(detalles);
            const iva = InvoiceCalculator.calculateIVA(subtotal, 16);
            const total = InvoiceCalculator.calculateTotal(subtotal, iva);

            // Verificar cálculos básicos
            const expectedSubtotal = cantidad * precioUnitario;
            expect(Math.abs(subtotal - expectedSubtotal)).toBeLessThan(0.01);
            
            // Verificar precisión de 2 decimales
            expect(subtotal).toBe(Math.round(subtotal * 100) / 100);
            expect(iva).toBe(Math.round(iva * 100) / 100);
            expect(total).toBe(Math.round(total * 100) / 100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe redondear consistentemente en todos los cálculos', () => {
      fc.assert(
        fc.property(
          detallesFacturaArbitrary(),
          (detalles) => {
            const subtotal = InvoiceCalculator.calculateSubtotal(detalles);
            const iva = InvoiceCalculator.calculateIVA(subtotal, 16);
            const total = InvoiceCalculator.calculateTotal(subtotal, iva);

            // Verificar que aplicar redondeo nuevamente no cambia los valores
            expect(InvoiceCalculator.roundToTwoDecimals(subtotal)).toBe(subtotal);
            expect(InvoiceCalculator.roundToTwoDecimals(iva)).toBe(iva);
            expect(InvoiceCalculator.roundToTwoDecimals(total)).toBe(total);

            // Verificar formato de decimales
            const subtotalStr = subtotal.toFixed(2);
            const ivaStr = iva.toFixed(2);
            const totalStr = total.toFixed(2);

            expect(subtotalStr).toMatch(/^\d+\.\d{2}$/);
            expect(ivaStr).toMatch(/^\d+\.\d{2}$/);
            expect(totalStr).toMatch(/^\d+\.\d{2}$/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
