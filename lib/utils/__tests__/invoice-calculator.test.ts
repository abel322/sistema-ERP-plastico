import { InvoiceCalculator } from '../invoice-calculator';

describe('InvoiceCalculator', () => {
  describe('calculateDetalleSubtotal', () => {
    it('debe calcular correctamente el subtotal de un detalle', () => {
      expect(InvoiceCalculator.calculateDetalleSubtotal(10, 5.5)).toBe(55.00);
      expect(InvoiceCalculator.calculateDetalleSubtotal(3, 10.333)).toBe(31.00);
      expect(InvoiceCalculator.calculateDetalleSubtotal(1, 100)).toBe(100.00);
    });

    it('debe redondear a 2 decimales', () => {
      expect(InvoiceCalculator.calculateDetalleSubtotal(3, 10.335)).toBe(31.01);
      expect(InvoiceCalculator.calculateDetalleSubtotal(7, 1.111)).toBe(7.78);
    });

    it('debe manejar valores con muchos decimales', () => {
      expect(InvoiceCalculator.calculateDetalleSubtotal(2.5, 3.333333)).toBe(8.33);
    });

    it('debe manejar valores pequeños', () => {
      expect(InvoiceCalculator.calculateDetalleSubtotal(0.01, 0.01)).toBe(0.00);
      expect(InvoiceCalculator.calculateDetalleSubtotal(0.1, 0.1)).toBe(0.01);
    });
  });

  describe('calculateSubtotal', () => {
    it('debe calcular correctamente el subtotal de múltiples detalles', () => {
      const detalles = [
        { cantidad: 10, precioUnitario: 5.5 },
        { cantidad: 3, precioUnitario: 10.333 }
      ];
      expect(InvoiceCalculator.calculateSubtotal(detalles)).toBe(86.00);
    });

    it('debe manejar un solo detalle', () => {
      const detalles = [{ cantidad: 5, precioUnitario: 20 }];
      expect(InvoiceCalculator.calculateSubtotal(detalles)).toBe(100.00);
    });

    it('debe retornar 0 para array vacío', () => {
      expect(InvoiceCalculator.calculateSubtotal([])).toBe(0);
    });

    it('debe redondear correctamente la suma total', () => {
      const detalles = [
        { cantidad: 1, precioUnitario: 10.335 },
        { cantidad: 1, precioUnitario: 10.335 },
        { cantidad: 1, precioUnitario: 10.335 }
      ];
      expect(InvoiceCalculator.calculateSubtotal(detalles)).toBe(31.01);
    });

    it('debe manejar detalles con valores decimales complejos', () => {
      const detalles = [
        { cantidad: 2.5, precioUnitario: 3.333 },
        { cantidad: 1.75, precioUnitario: 8.888 }
      ];
      const result = InvoiceCalculator.calculateSubtotal(detalles);
      expect(result).toBe(23.89);
    });
  });

  describe('calculateIVA', () => {
    it('debe calcular correctamente el IVA al 16%', () => {
      expect(InvoiceCalculator.calculateIVA(100, 16)).toBe(16.00);
      expect(InvoiceCalculator.calculateIVA(86.00, 16)).toBe(13.76);
    });

    it('debe redondear a 2 decimales', () => {
      expect(InvoiceCalculator.calculateIVA(100.33, 16)).toBe(16.05);
      expect(InvoiceCalculator.calculateIVA(50.50, 16)).toBe(8.08);
    });

    it('debe manejar diferentes tasas de IVA', () => {
      expect(InvoiceCalculator.calculateIVA(100, 10)).toBe(10.00);
      expect(InvoiceCalculator.calculateIVA(100, 21)).toBe(21.00);
      expect(InvoiceCalculator.calculateIVA(100, 0)).toBe(0.00);
    });

    it('debe manejar subtotales pequeños', () => {
      expect(InvoiceCalculator.calculateIVA(0.50, 16)).toBe(0.08);
      expect(InvoiceCalculator.calculateIVA(1.00, 16)).toBe(0.16);
    });
  });

  describe('calculateTotal', () => {
    it('debe calcular correctamente el total', () => {
      expect(InvoiceCalculator.calculateTotal(100, 16)).toBe(116.00);
      expect(InvoiceCalculator.calculateTotal(86.00, 13.76)).toBe(99.76);
    });

    it('debe redondear a 2 decimales', () => {
      expect(InvoiceCalculator.calculateTotal(100.335, 16.335)).toBe(116.67);
    });

    it('debe manejar valores con muchos decimales', () => {
      expect(InvoiceCalculator.calculateTotal(33.333, 5.333)).toBe(38.67);
    });

    it('debe manejar IVA cero', () => {
      expect(InvoiceCalculator.calculateTotal(100, 0)).toBe(100.00);
    });
  });

  describe('roundToTwoDecimals', () => {
    it('debe redondear correctamente hacia arriba', () => {
      expect(InvoiceCalculator.roundToTwoDecimals(10.335)).toBe(10.34);
      expect(InvoiceCalculator.roundToTwoDecimals(10.999)).toBe(11.00);
    });

    it('debe redondear correctamente hacia abajo', () => {
      expect(InvoiceCalculator.roundToTwoDecimals(10.333)).toBe(10.33);
      expect(InvoiceCalculator.roundToTwoDecimals(10.001)).toBe(10.00);
    });

    it('debe mantener valores ya redondeados', () => {
      expect(InvoiceCalculator.roundToTwoDecimals(10.50)).toBe(10.50);
      expect(InvoiceCalculator.roundToTwoDecimals(10.00)).toBe(10.00);
    });

    it('debe manejar valores enteros', () => {
      expect(InvoiceCalculator.roundToTwoDecimals(10)).toBe(10.00);
      expect(InvoiceCalculator.roundToTwoDecimals(0)).toBe(0.00);
    });

    it('debe manejar valores negativos', () => {
      expect(InvoiceCalculator.roundToTwoDecimals(-10.335)).toBe(-10.34);
      expect(InvoiceCalculator.roundToTwoDecimals(-10.333)).toBe(-10.33);
    });
  });

  describe('Integración: Cálculo completo de factura', () => {
    it('debe calcular correctamente una factura completa', () => {
      // Arrange: Detalles de factura
      const detalles = [
        { cantidad: 10, precioUnitario: 5.50 },
        { cantidad: 3, precioUnitario: 10.33 },
        { cantidad: 5, precioUnitario: 2.75 }
      ];

      // Act: Calcular totales
      const subtotal = InvoiceCalculator.calculateSubtotal(detalles);
      const iva = InvoiceCalculator.calculateIVA(subtotal, 16);
      const total = InvoiceCalculator.calculateTotal(subtotal, iva);

      // Assert: Verificar cálculos
      expect(subtotal).toBe(99.74); // 55 + 30.99 + 13.75
      expect(iva).toBe(15.96); // 99.74 * 0.16
      expect(total).toBe(115.70); // 99.74 + 15.96
    });

    it('debe manejar factura con un solo detalle', () => {
      const detalles = [{ cantidad: 100, precioUnitario: 1.50 }];

      const subtotal = InvoiceCalculator.calculateSubtotal(detalles);
      const iva = InvoiceCalculator.calculateIVA(subtotal, 16);
      const total = InvoiceCalculator.calculateTotal(subtotal, iva);

      expect(subtotal).toBe(150.00);
      expect(iva).toBe(24.00);
      expect(total).toBe(174.00);
    });

    it('debe manejar factura con valores decimales complejos', () => {
      const detalles = [
        { cantidad: 2.5, precioUnitario: 3.333 },
        { cantidad: 1.75, precioUnitario: 8.888 }
      ];

      const subtotal = InvoiceCalculator.calculateSubtotal(detalles);
      const iva = InvoiceCalculator.calculateIVA(subtotal, 16);
      const total = InvoiceCalculator.calculateTotal(subtotal, iva);

      expect(subtotal).toBe(23.89);
      expect(iva).toBe(3.82);
      expect(total).toBe(27.71);
    });
  });

  describe('Validación de Requirements', () => {
    it('Requirement 2.5: Subtotal debe ser cantidad * precioUnitario', () => {
      const cantidad = 10;
      const precioUnitario = 5.5;
      const subtotal = InvoiceCalculator.calculateDetalleSubtotal(cantidad, precioUnitario);
      
      expect(subtotal).toBe(cantidad * precioUnitario);
    });

    it('Requirement 3.1: Subtotal debe ser suma de todos los detalles', () => {
      const detalles = [
        { cantidad: 10, precioUnitario: 5 },
        { cantidad: 5, precioUnitario: 10 },
        { cantidad: 2, precioUnitario: 25 }
      ];
      
      const subtotal = InvoiceCalculator.calculateSubtotal(detalles);
      const expectedSum = 10*5 + 5*10 + 2*25; // 50 + 50 + 50 = 150
      
      expect(subtotal).toBe(expectedSum);
    });

    it('Requirement 3.2: IVA debe ser 16% del subtotal', () => {
      const subtotal = 100;
      const iva = InvoiceCalculator.calculateIVA(subtotal, 16);
      
      expect(iva).toBe(16.00);
      expect(iva).toBe(subtotal * 0.16);
    });

    it('Requirement 3.3: Total debe ser subtotal + IVA', () => {
      const subtotal = 100;
      const iva = 16;
      const total = InvoiceCalculator.calculateTotal(subtotal, iva);
      
      expect(total).toBe(116.00);
      expect(total).toBe(subtotal + iva);
    });

    it('Requirement 3.4: Todos los valores deben tener precisión de 2 decimales', () => {
      const detalles = [
        { cantidad: 3.333, precioUnitario: 7.777 }
      ];
      
      const subtotal = InvoiceCalculator.calculateSubtotal(detalles);
      const iva = InvoiceCalculator.calculateIVA(subtotal, 16);
      const total = InvoiceCalculator.calculateTotal(subtotal, iva);
      
      // Verificar que todos tienen exactamente 2 decimales
      expect(subtotal).toBe(Math.round(subtotal * 100) / 100);
      expect(iva).toBe(Math.round(iva * 100) / 100);
      expect(total).toBe(Math.round(total * 100) / 100);
      
      // Verificar formato
      expect(subtotal.toFixed(2)).toMatch(/^\d+\.\d{2}$/);
      expect(iva.toFixed(2)).toMatch(/^\d+\.\d{2}$/);
      expect(total.toFixed(2)).toMatch(/^\d+\.\d{2}$/);
    });
  });
});
