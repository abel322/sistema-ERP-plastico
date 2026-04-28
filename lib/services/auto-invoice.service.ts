/**
 * AutoInvoiceService - Servicio para generación automática de facturas
 * 
 * Este servicio maneja la lógica de negocio para crear facturas automáticamente
 * cuando un despacho es marcado como "Entregado".
 * 
 * Validates Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

import { prisma } from '../db';
import { InvoiceCalculator } from '../utils/invoice-calculator';
import { InvoiceValidator } from '../validators/invoice-validator';
import { Factura, Prisma } from '@prisma/client';

/**
 * Tipo para transacciones de Prisma
 */
export type PrismaTransaction = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Resultado de validación de despacho
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Servicio de facturación automática
 */
export class AutoInvoiceService {
  /**
   * Genera una factura automáticamente desde un despacho
   * 
   * Requirement 1.1: WHEN un Despacho es actualizado a Estado_Entregado,
   * THE Sistema_Facturación SHALL crear una nueva Factura con estado "Emitida"
   * 
   * Requirement 1.5: IF un Despacho no tiene precioUnitario definido,
   * THEN THE Sistema_Facturación SHALL crear la Factura con valores en cero
   * y estado "Borrador"
   * 
   * @param despachoId - ID del despacho a facturar
   * @param tx - Transacción de Prisma opcional para rollback
   * @returns Factura creada
   * @throws Error si el despacho no existe o no tiene cliente
   * 
   * @example
   * const factura = await autoInvoiceService.generateFromDespacho('despacho-123');
   * console.log(`Factura ${factura.numero} creada`);
   */
  async generateFromDespacho(
    despachoId: string,
    tx?: PrismaTransaction
  ): Promise<Factura> {
    const db = tx || prisma;

    // Validar despacho
    const validation = await this.validateDespacho(despachoId, db);
    if (!validation.valid) {
      throw new Error(`Validación fallida: ${validation.errors.join(', ')}`);
    }

    // Obtener despacho con cliente
    const despacho = await db.despacho.findUnique({
      where: { id: despachoId },
      include: {
        cliente: true,
      },
    });

    if (!despacho) {
      throw new Error('Despacho no encontrado');
    }

    if (!despacho.cliente) {
      throw new Error('Despacho no tiene cliente asociado');
    }

    // Generar número de factura
    const numeroFactura = await this.generateNextInvoiceNumber(db);

    // Determinar si el despacho tiene precio unitario
    const hasPrecio = despacho.precioUnitario !== null && despacho.precioUnitario !== undefined;

    // Calcular valores
    let subtotal = 0;
    let iva = 0;
    let total = 0;
    let estado: 'Emitida' | 'Borrador' = 'Borrador';
    let precioUnitario = 0;

    if (hasPrecio) {
      // Requirement 2.4: THE Detalle_Factura SHALL incluir el precioUnitario del Despacho
      precioUnitario = despacho.precioUnitario!;
      
      // Requirement 2.5: THE Detalle_Factura SHALL calcular el subtotal como
      // cantidad multiplicada por precioUnitario
      const detalleSubtotal = InvoiceCalculator.calculateDetalleSubtotal(
        despacho.cantidadDespachada,
        precioUnitario
      );

      subtotal = detalleSubtotal;
      
      // Requirement 3.2: THE Sistema_Facturación SHALL calcular el IVA como el 16% del subtotal
      iva = InvoiceCalculator.calculateIVA(subtotal, 16);
      
      // Requirement 3.3: THE Sistema_Facturación SHALL calcular el total como subtotal más IVA
      total = InvoiceCalculator.calculateTotal(subtotal, iva);
      
      // Requirement 1.1: Estado "Emitida" cuando tiene precio
      estado = 'Emitida';
    }
    // Si no tiene precio, los valores quedan en 0 y estado "Borrador" (Requirement 1.5)

    // Requirement 2.6: THE Detalle_Factura SHALL incluir una descripción basada
    // en el nombre del Cliente y tipo de producto
    const descripcion = `Despacho para ${despacho.cliente.nombre} - ${despacho.cantidadDespachada} ${despacho.unidad}`;

    // Crear factura con detalle
    const factura = await db.factura.create({
      data: {
        // Requirement 1.2: Asignar número de factura único secuencial
        numero: numeroFactura,
        
        // Requirement 1.4: Asociar la Factura con el Cliente del Despacho
        clienteId: despacho.clienteId,
        
        // Requirement 1.3: Copiar la fecha de entrega del Despacho como fecha de la Factura
        fecha: despacho.entregadoAt || new Date(),
        
        // Requirement 3.4: Almacenar subtotal, IVA y total con precisión de dos decimales
        subtotal,
        iva,
        total,
        estado,
        
        // Crear detalle de factura
        detalles: {
          create: {
            // Requirement 2.7: Almacenar la referencia al despachoId de origen
            despachoId: despacho.id,
            
            // Requirement 2.6: Descripción con nombre del cliente
            descripcion,
            
            // Requirement 2.1: Incluir la cantidad despachada del Despacho
            cantidad: despacho.cantidadDespachada,
            
            // Requirement 2.2: Incluir la unidad de medida del Despacho
            unidad: despacho.unidad,
            
            // Requirement 2.3: Incluir el precioUnitario del Despacho
            precioUnitario,
            
            // Requirement 2.5: Calcular subtotal
            subtotal: hasPrecio
              ? InvoiceCalculator.calculateDetalleSubtotal(
                  despacho.cantidadDespachada,
                  precioUnitario
                )
              : 0,
          },
        },
      },
      include: {
        cliente: true,
        detalles: true,
      },
    });

    return factura;
  }

  /**
   * Genera el siguiente número de factura secuencial
   * 
   * Requirement 1.2: WHEN el Sistema_Facturación crea una Factura automática,
   * THE Sistema_Facturación SHALL asignar un número de factura único secuencial
   * 
   * Formato: FAC-YYYYMMDD-NNNN
   * Ejemplo: FAC-20240115-0001
   * 
   * @param tx - Transacción de Prisma opcional
   * @returns Número de factura único
   * 
   * @example
   * const numero = await autoInvoiceService.generateNextInvoiceNumber();
   * console.log(numero); // "FAC-20240115-0001"
   */
  async generateNextInvoiceNumber(tx?: PrismaTransaction): Promise<string> {
    const db = tx || prisma;

    // Obtener la fecha actual en formato YYYYMMDD
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;

    // Buscar el último número de factura del día
    const lastFactura = await db.factura.findFirst({
      where: {
        numero: {
          startsWith: `FAC-${datePrefix}`,
        },
      },
      orderBy: {
        numero: 'desc',
      },
      select: {
        numero: true,
      },
    });

    let nextSequence = 1;

    if (lastFactura) {
      // Extraer el número secuencial del último número de factura
      // Formato: FAC-YYYYMMDD-NNNN
      const parts = lastFactura.numero.split('-');
      if (parts.length === 3) {
        const lastSequence = parseInt(parts[2], 10);
        if (!isNaN(lastSequence)) {
          nextSequence = lastSequence + 1;
        }
      }
    }

    // Formatear el número secuencial con 4 dígitos
    const sequenceStr = String(nextSequence).padStart(4, '0');

    return `FAC-${datePrefix}-${sequenceStr}`;
  }

  /**
   * Valida que un despacho puede generar una factura
   * 
   * Requirement 7.5: THE Sistema_Facturación SHALL validar que el Cliente existe
   * antes de crear la Factura
   * 
   * Validaciones:
   * - El despacho existe
   * - El despacho tiene un cliente asociado
   * - El cliente existe en la base de datos
   * - El despacho no ha sido facturado previamente
   * 
   * @param despachoId - ID del despacho a validar
   * @param tx - Transacción de Prisma opcional
   * @returns Resultado de validación con lista de errores
   * 
   * @example
   * const result = await autoInvoiceService.validateDespacho('despacho-123');
   * if (!result.valid) {
   *   console.error('Errores:', result.errors);
   * }
   */
  async validateDespacho(
    despachoId: string,
    tx?: PrismaTransaction
  ): Promise<ValidationResult> {
    const db = tx || prisma;
    const errors: string[] = [];

    // Validar que el despacho existe
    const despacho = await db.despacho.findUnique({
      where: { id: despachoId },
      select: {
        id: true,
        clienteId: true,
      },
    });

    if (!despacho) {
      errors.push('Despacho no encontrado');
      return { valid: false, errors };
    }

    // Validar que el despacho tiene cliente
    if (!despacho.clienteId) {
      errors.push('Despacho no tiene cliente asociado');
    } else {
      // Requirement 7.5: Validar que el cliente existe
      const clienteExists = await InvoiceValidator.validateClienteExists(
        despacho.clienteId
      );
      if (!clienteExists) {
        errors.push('Cliente no encontrado');
      }
    }

    // Validar que el despacho no ha sido facturado previamente
    const existingFactura = await db.factura.findFirst({
      where: {
        detalles: {
          some: {
            despachoId: despachoId,
          },
        },
      },
      select: {
        id: true,
        numero: true,
      },
    });

    if (existingFactura) {
      errors.push(
        `Despacho ya fue facturado (Factura ${existingFactura.numero})`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Exportar instancia singleton
export const autoInvoiceService = new AutoInvoiceService();
