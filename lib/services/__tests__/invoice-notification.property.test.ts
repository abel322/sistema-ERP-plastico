/**
 * Property-Based Tests for InvoiceNotificationService
 * 
 * Feature: automatic-invoicing
 * Property 15: Creación de Notificación Completa
 * 
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
 * 
 * Para cualquier factura generada automáticamente, el sistema debe crear
 * una notificación de tipo "Sistema" para todos los usuarios con rol admin,
 * que incluya el número de factura, nombre del cliente, valor total,
 * y un enlace directo a la factura.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { prisma } from '../../db';
import { InvoiceNotificationService } from '../invoice-notification.service';
import { facturaWithRelationsArbitrary } from '../../../__tests__/helpers/invoice-arbitraries';

describe('Property 15: Creación de Notificación Completa', () => {
  let service: InvoiceNotificationService;
  let testAdminUsers: any[] = [];

  beforeEach(async () => {
    service = new InvoiceNotificationService();

    // Crear múltiples usuarios admin de prueba para verificar que se notifican todos
    const admin1 = await prisma.user.create({
      data: {
        email: `admin1-${Date.now()}@test.com`,
        password: 'hashedpassword',
        nombre: 'Admin Test 1',
        rol: 'admin',
        activo: true,
      },
    });

    const admin2 = await prisma.user.create({
      data: {
        email: `admin2-${Date.now()}@test.com`,
        password: 'hashedpassword',
        nombre: 'Admin Test 2',
        rol: 'admin',
        activo: true,
      },
    });

    testAdminUsers = [admin1, admin2];
  });

  afterEach(async () => {
    // Limpiar notificaciones y usuarios de prueba
    for (const admin of testAdminUsers) {
      await prisma.notificacion.deleteMany({
        where: { usuarioId: admin.id },
      });
      await prisma.user.delete({ where: { id: admin.id } });
    }
    testAdminUsers = [];
  });

  it('debe crear notificación completa para todos los admins con toda la información requerida', async () => {
    await fc.assert(
      fc.asyncProperty(
        facturaWithRelationsArbitrary(),
        async (factura) => {
          // Act: Crear notificación para la factura generada
          await service.notifyInvoiceCreated(factura);

          // Assert: Verificar que se crearon notificaciones para todos los admins
          const notificaciones = await prisma.notificacion.findMany({
            where: {
              usuarioId: { in: testAdminUsers.map(u => u.id) },
            },
          });

          // Requirement 6.1: Debe crear notificación para TODOS los usuarios admin
          expect(notificaciones.length).toBe(testAdminUsers.length);

          // Verificar cada notificación
          for (const notificacion of notificaciones) {
            // Requirement 6.4: Debe tener tipo "Sistema"
            expect(notificacion.tipo).toBe('Sistema');

            // Requirement 6.2: Debe incluir número de factura en el mensaje
            expect(notificacion.mensaje).toContain(factura.numero);

            // Requirement 6.2: Debe incluir nombre del cliente en el mensaje
            expect(notificacion.mensaje).toContain(factura.cliente.nombre);

            // Requirement 6.2: Debe incluir valor total en el mensaje
            // Formatear el total con 2 decimales como lo hace el servicio
            const totalFormateado = factura.total.toFixed(2);
            expect(notificacion.mensaje).toContain(totalFormateado);

            // Requirement 6.3: Debe incluir enlace directo a la factura
            expect(notificacion.enlace).toBe(`/facturas/${factura.id}`);

            // Verificar que la notificación no está leída inicialmente
            expect(notificacion.leida).toBe(false);

            // Verificar que el usuario es admin
            expect(testAdminUsers.map(u => u.id)).toContain(notificacion.usuarioId);
          }

          // Cleanup: Eliminar notificaciones creadas en esta iteración
          await prisma.notificacion.deleteMany({
            where: {
              usuarioId: { in: testAdminUsers.map(u => u.id) },
            },
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('debe incluir el número de factura exacto en el mensaje', async () => {
    await fc.assert(
      fc.asyncProperty(
        facturaWithRelationsArbitrary(),
        async (factura) => {
          // Act
          await service.notifyInvoiceCreated(factura);

          // Assert
          const notificaciones = await prisma.notificacion.findMany({
            where: {
              usuarioId: { in: testAdminUsers.map(u => u.id) },
            },
          });

          // Requirement 6.2: Verificar que el número de factura está presente
          for (const notificacion of notificaciones) {
            expect(notificacion.mensaje).toContain(factura.numero);
          }

          // Cleanup
          await prisma.notificacion.deleteMany({
            where: {
              usuarioId: { in: testAdminUsers.map(u => u.id) },
            },
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('debe incluir el nombre del cliente exacto en el mensaje', async () => {
    await fc.assert(
      fc.asyncProperty(
        facturaWithRelationsArbitrary(),
        async (factura) => {
          // Act
          await service.notifyInvoiceCreated(factura);

          // Assert
          const notificaciones = await prisma.notificacion.findMany({
            where: {
              usuarioId: { in: testAdminUsers.map(u => u.id) },
            },
          });

          // Requirement 6.2: Verificar que el nombre del cliente está presente
          for (const notificacion of notificaciones) {
            expect(notificacion.mensaje).toContain(factura.cliente.nombre);
          }

          // Cleanup
          await prisma.notificacion.deleteMany({
            where: {
              usuarioId: { in: testAdminUsers.map(u => u.id) },
            },
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('debe incluir el valor total formateado en el mensaje', async () => {
    await fc.assert(
      fc.asyncProperty(
        facturaWithRelationsArbitrary(),
        async (factura) => {
          // Act
          await service.notifyInvoiceCreated(factura);

          // Assert
          const notificaciones = await prisma.notificacion.findMany({
            where: {
              usuarioId: { in: testAdminUsers.map(u => u.id) },
            },
          });

          // Requirement 6.2: Verificar que el total está presente con formato correcto
          const totalFormateado = factura.total.toFixed(2);
          for (const notificacion of notificaciones) {
            expect(notificacion.mensaje).toContain(totalFormateado);
          }

          // Cleanup
          await prisma.notificacion.deleteMany({
            where: {
              usuarioId: { in: testAdminUsers.map(u => u.id) },
            },
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('debe incluir enlace directo correcto a la factura', async () => {
    await fc.assert(
      fc.asyncProperty(
        facturaWithRelationsArbitrary(),
        async (factura) => {
          // Act
          await service.notifyInvoiceCreated(factura);

          // Assert
          const notificaciones = await prisma.notificacion.findMany({
            where: {
              usuarioId: { in: testAdminUsers.map(u => u.id) },
            },
          });

          // Requirement 6.3: Verificar que el enlace apunta a la factura correcta
          const expectedEnlace = `/facturas/${factura.id}`;
          for (const notificacion of notificaciones) {
            expect(notificacion.enlace).toBe(expectedEnlace);
          }

          // Cleanup
          await prisma.notificacion.deleteMany({
            where: {
              usuarioId: { in: testAdminUsers.map(u => u.id) },
            },
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('debe tener tipo "Sistema" para todas las notificaciones', async () => {
    await fc.assert(
      fc.asyncProperty(
        facturaWithRelationsArbitrary(),
        async (factura) => {
          // Act
          await service.notifyInvoiceCreated(factura);

          // Assert
          const notificaciones = await prisma.notificacion.findMany({
            where: {
              usuarioId: { in: testAdminUsers.map(u => u.id) },
            },
          });

          // Requirement 6.4: Verificar que todas las notificaciones son de tipo "Sistema"
          for (const notificacion of notificaciones) {
            expect(notificacion.tipo).toBe('Sistema');
          }

          // Cleanup
          await prisma.notificacion.deleteMany({
            where: {
              usuarioId: { in: testAdminUsers.map(u => u.id) },
            },
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('debe crear notificaciones para TODOS los usuarios admin', async () => {
    await fc.assert(
      fc.asyncProperty(
        facturaWithRelationsArbitrary(),
        async (factura) => {
          // Act
          await service.notifyInvoiceCreated(factura);

          // Assert
          const notificaciones = await prisma.notificacion.findMany({
            where: {
              usuarioId: { in: testAdminUsers.map(u => u.id) },
            },
          });

          // Requirement 6.1: Debe crear una notificación por cada admin
          expect(notificaciones.length).toBe(testAdminUsers.length);

          // Verificar que cada admin recibió exactamente una notificación
          for (const admin of testAdminUsers) {
            const adminNotifications = notificaciones.filter(
              n => n.usuarioId === admin.id
            );
            expect(adminNotifications.length).toBe(1);
          }

          // Cleanup
          await prisma.notificacion.deleteMany({
            where: {
              usuarioId: { in: testAdminUsers.map(u => u.id) },
            },
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
