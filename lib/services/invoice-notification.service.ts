/**
 * InvoiceNotificationService - Servicio para notificaciones de facturación
 * 
 * Este servicio maneja la creación de notificaciones relacionadas con
 * operaciones de facturación automática.
 * 
 * Validates Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.3
 */

import { prisma } from '../db';
import { Factura, User } from '@prisma/client';

/**
 * Factura con relaciones necesarias para notificaciones
 */
export interface FacturaWithRelations extends Factura {
  cliente: {
    id: string;
    nombre: string;
  };
  detalles: Array<{
    id: string;
    despachoId: string | null;
  }>;
}

/**
 * Servicio de notificaciones de facturación
 */
export class InvoiceNotificationService {
  /**
   * Crea notificación cuando se genera una factura automáticamente
   * 
   * Requirement 6.1: WHEN el Sistema_Facturación crea una Factura automática,
   * THE Sistema_Facturación SHALL crear una notificación para usuarios con rol admin
   * 
   * Requirement 6.2: THE notificación SHALL incluir el número de factura,
   * nombre del cliente y valor total
   * 
   * Requirement 6.3: THE notificación SHALL incluir un enlace directo a la Factura generada
   * 
   * Requirement 6.4: THE notificación SHALL tener tipo "Sistema"
   * 
   * @param factura - Factura generada con relaciones de cliente
   * @returns Promise<void>
   * 
   * @example
   * await notificationService.notifyInvoiceCreated(factura);
   */
  async notifyInvoiceCreated(factura: FacturaWithRelations): Promise<void> {
    // Requirement 6.1: Obtener usuarios admin
    const adminUsers = await this.getAdminUsers();

    if (adminUsers.length === 0) {
      // No hay admins para notificar, salir silenciosamente
      return;
    }

    // Requirement 6.2: Construir mensaje con número, cliente y total
    const titulo = 'Nueva factura generada automáticamente';
    const mensaje = `Se ha generado la factura ${factura.numero} para el cliente ${factura.cliente.nombre} por un total de $${factura.total.toFixed(2)}`;
    
    // Requirement 6.3: Incluir enlace directo a la factura
    const enlace = `/facturas/${factura.id}`;

    // Crear notificaciones para todos los admins
    const notificaciones = adminUsers.map((admin) => ({
      usuarioId: admin.id,
      // Requirement 6.4: Tipo "Sistema"
      tipo: 'Sistema' as const,
      titulo,
      mensaje,
      enlace,
      leida: false,
    }));

    await prisma.notificacion.createMany({
      data: notificaciones,
    });
  }

  /**
   * Crea notificación de error cuando falla la generación de factura
   * 
   * Requirement 7.1: IF la creación de una Factura automática falla,
   * THEN THE Sistema_Facturación SHALL registrar el error en los logs del sistema
   * 
   * Requirement 7.3: IF la creación de una Factura automática falla,
   * THEN THE Sistema_Facturación SHALL crear una notificación de error para usuarios admin
   * 
   * @param despachoId - ID del despacho que falló al generar factura
   * @param error - Mensaje de error descriptivo
   * @returns Promise<void>
   * 
   * @example
   * await notificationService.notifyInvoiceError('despacho-123', 'Cliente no encontrado');
   */
  async notifyInvoiceError(despachoId: string, error: string): Promise<void> {
    // Requirement 7.3: Obtener usuarios admin para notificar
    const adminUsers = await this.getAdminUsers();

    if (adminUsers.length === 0) {
      // No hay admins para notificar, salir silenciosamente
      return;
    }

    const titulo = 'Error en generación automática de factura';
    const mensaje = `No se pudo generar la factura para el despacho ${despachoId}. Error: ${error}`;
    const enlace = `/despachos/${despachoId}`;

    // Crear notificaciones de error para todos los admins
    const notificaciones = adminUsers.map((admin) => ({
      usuarioId: admin.id,
      tipo: 'Sistema' as const,
      titulo,
      mensaje,
      enlace,
      leida: false,
    }));

    await prisma.notificacion.createMany({
      data: notificaciones,
    });
  }

  /**
   * Obtiene todos los usuarios con rol admin
   * 
   * Requirement 6.1: Usuarios con rol admin deben recibir notificaciones
   * 
   * @returns Promise<User[]> - Lista de usuarios admin activos
   * @private
   * 
   * @example
   * const admins = await this.getAdminUsers();
   * console.log(`${admins.length} administradores encontrados`);
   */
  private async getAdminUsers(): Promise<User[]> {
    return await prisma.user.findMany({
      where: {
        rol: 'admin',
        activo: true,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        password: true,
        actionPassword: true,
      },
    });
  }
}

// Exportar instancia singleton
export const invoiceNotificationService = new InvoiceNotificationService();
