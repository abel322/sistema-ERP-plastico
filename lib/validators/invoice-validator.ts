/**
 * InvoiceValidator - Validador de datos de facturación
 * 
 * Esta clase proporciona métodos estáticos para validar datos relacionados
 * con facturas, asegurando integridad de datos y reglas de negocio.
 * 
 * Validates Requirements: 7.5, 8.1, 8.4
 */

import { prisma } from '../db';
import { Factura, EstadoFactura } from '@prisma/client';

/**
 * Input para crear o actualizar un detalle de factura
 */
export interface DetalleFacturaInput {
  descripcion: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
}

/**
 * Resultado de validación
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class InvoiceValidator {
  /**
   * Valida que un cliente existe en la base de datos
   * 
   * Requirement 7.5: THE Sistema_Facturación SHALL validar que el Cliente existe
   * antes de crear la Factura
   * 
   * @param clienteId - ID del cliente a validar
   * @returns true si el cliente existe, false en caso contrario
   * 
   * @example
   * const exists = await InvoiceValidator.validateClienteExists('cliente-123');
   * if (!exists) {
   *   throw new Error('Cliente no encontrado');
   * }
   */
  static async validateClienteExists(clienteId: string): Promise<boolean> {
    try {
      const cliente = await prisma.cliente.findUnique({
        where: { id: clienteId },
        select: { id: true }
      });
      
      return cliente !== null;
    } catch (error) {
      // En caso de error de base de datos, retornar false
      console.error('Error validating cliente:', error);
      return false;
    }
  }

  /**
   * Valida que una factura puede ser editada según su estado
   * 
   * Requirement 8.1: THE Sistema_Facturación SHALL permitir editar Facturas
   * con estado "Borrador" o "Emitida"
   * 
   * Requirement 8.4: THE Sistema_Facturación SHALL no permitir editar Facturas
   * con estado "Pagada" o "Anulada"
   * 
   * @param factura - Factura a validar
   * @returns true si la factura puede ser editada, false en caso contrario
   * 
   * @example
   * const factura = await prisma.factura.findUnique({ where: { id: 'factura-123' } });
   * if (!InvoiceValidator.canEdit(factura)) {
   *   throw new Error('No se puede editar una factura pagada o anulada');
   * }
   */
  static canEdit(factura: Factura): boolean {
    const editableStates: EstadoFactura[] = ['Borrador', 'Emitida'];
    return editableStates.includes(factura.estado);
  }

  /**
   * Valida los detalles de una factura
   * 
   * Verifica que cada detalle tenga:
   * - Descripción no vacía
   * - Cantidad mayor a 0
   * - Unidad no vacía
   * - Precio unitario mayor o igual a 0
   * 
   * @param detalles - Array de detalles a validar
   * @returns Resultado de validación con lista de errores si aplica
   * 
   * @example
   * const detalles = [
   *   { descripcion: 'Producto A', cantidad: 10, unidad: 'Unidades', precioUnitario: 5.5 }
   * ];
   * const result = InvoiceValidator.validateDetalles(detalles);
   * if (!result.valid) {
   *   console.error('Errores de validación:', result.errors);
   * }
   */
  static validateDetalles(detalles: DetalleFacturaInput[]): ValidationResult {
    const errors: string[] = [];

    // Validar que hay al menos un detalle
    if (!detalles || detalles.length === 0) {
      errors.push('Debe incluir al menos un detalle en la factura');
      return { valid: false, errors };
    }

    // Validar cada detalle
    detalles.forEach((detalle, index) => {
      const position = index + 1;

      // Validar descripción
      if (!detalle.descripcion || detalle.descripcion.trim() === '') {
        errors.push(`Detalle ${position}: La descripción es requerida`);
      }

      // Validar cantidad
      if (typeof detalle.cantidad !== 'number' || detalle.cantidad <= 0) {
        errors.push(`Detalle ${position}: La cantidad debe ser mayor a 0`);
      }

      // Validar unidad
      if (!detalle.unidad || detalle.unidad.trim() === '') {
        errors.push(`Detalle ${position}: La unidad es requerida`);
      }

      // Validar precio unitario
      if (typeof detalle.precioUnitario !== 'number' || detalle.precioUnitario < 0) {
        errors.push(`Detalle ${position}: El precio unitario debe ser mayor o igual a 0`);
      }

      // Validar que los números no sean NaN o Infinity
      if (isNaN(detalle.cantidad) || !isFinite(detalle.cantidad)) {
        errors.push(`Detalle ${position}: La cantidad no es un número válido`);
      }

      if (isNaN(detalle.precioUnitario) || !isFinite(detalle.precioUnitario)) {
        errors.push(`Detalle ${position}: El precio unitario no es un número válido`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
