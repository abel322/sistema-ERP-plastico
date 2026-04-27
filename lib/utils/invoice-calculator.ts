/**
 * InvoiceCalculator - Utilidad para cálculos de facturación
 * 
 * Esta clase proporciona métodos estáticos para realizar cálculos
 * relacionados con facturas, asegurando consistencia en toda la aplicación.
 * 
 * Todos los valores monetarios se redondean a 2 decimales.
 */

interface DetalleFactura {
  cantidad: number;
  precioUnitario: number;
  subtotal?: number;
}

export class InvoiceCalculator {
  /**
   * Calcula el subtotal de un detalle de factura
   * 
   * @param cantidad - Cantidad de unidades
   * @param precioUnitario - Precio por unidad
   * @returns Subtotal redondeado a 2 decimales
   * 
   * @example
   * InvoiceCalculator.calculateDetalleSubtotal(10, 5.5) // 55.00
   * InvoiceCalculator.calculateDetalleSubtotal(3, 10.333) // 31.00
   */
  static calculateDetalleSubtotal(cantidad: number, precioUnitario: number): number {
    const subtotal = cantidad * precioUnitario;
    return this.roundToTwoDecimals(subtotal);
  }

  /**
   * Calcula el subtotal total de una factura sumando todos los detalles
   * 
   * @param detalles - Array de detalles de factura
   * @returns Subtotal total redondeado a 2 decimales
   * 
   * @example
   * const detalles = [
   *   { cantidad: 10, precioUnitario: 5.5 },
   *   { cantidad: 3, precioUnitario: 10.333 }
   * ];
   * InvoiceCalculator.calculateSubtotal(detalles) // 86.00
   */
  static calculateSubtotal(detalles: DetalleFactura[]): number {
    const subtotal = detalles.reduce((sum, detalle) => {
      const detalleSubtotal = detalle.cantidad * detalle.precioUnitario;
      return sum + detalleSubtotal;
    }, 0);
    return this.roundToTwoDecimals(subtotal);
  }

  /**
   * Calcula el IVA basado en el subtotal y la tasa de IVA
   * 
   * @param subtotal - Subtotal de la factura
   * @param ivaRate - Tasa de IVA en porcentaje (ej: 16 para 16%)
   * @returns IVA redondeado a 2 decimales
   * 
   * @example
   * InvoiceCalculator.calculateIVA(100, 16) // 16.00
   * InvoiceCalculator.calculateIVA(86.00, 16) // 13.76
   */
  static calculateIVA(subtotal: number, ivaRate: number): number {
    const iva = subtotal * (ivaRate / 100);
    return this.roundToTwoDecimals(iva);
  }

  /**
   * Calcula el total de la factura (subtotal + IVA)
   * 
   * @param subtotal - Subtotal de la factura
   * @param iva - IVA calculado
   * @returns Total redondeado a 2 decimales
   * 
   * @example
   * InvoiceCalculator.calculateTotal(100, 16) // 116.00
   * InvoiceCalculator.calculateTotal(86.00, 13.76) // 99.76
   */
  static calculateTotal(subtotal: number, iva: number): number {
    const total = subtotal + iva;
    return this.roundToTwoDecimals(total);
  }

  /**
   * Redondea un valor a 2 decimales
   * 
   * Utiliza el método estándar de redondeo (Math.round) para asegurar
   * precisión en cálculos monetarios.
   * 
   * @param value - Valor a redondear
   * @returns Valor redondeado a 2 decimales
   * 
   * @example
   * InvoiceCalculator.roundToTwoDecimals(10.333) // 10.33
   * InvoiceCalculator.roundToTwoDecimals(10.335) // 10.34
   * InvoiceCalculator.roundToTwoDecimals(10.999) // 11.00
   */
  static roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
