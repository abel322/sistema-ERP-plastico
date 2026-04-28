/**
 * Unit Tests for InvoiceNotificationService
 * 
 * Tests notification creation for invoice operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../../db';
import { InvoiceNotificationService, FacturaWithRelations } from '../invoice-notification.service';

describe('InvoiceNotificationService', () => {
  let service: InvoiceNotificationService;
  let testAdminUser: any;
  let testCliente: any;

  beforeEach(async () => {
    service = new InvoiceNotificationService();

    // Crear usuario admin de prueba
    testAdminUser = await prisma.user.create({
      data: {
        email: `admin-${Date.now()}@test.com`,
        password: 'hashedpassword',
        nombre: 'Admin Test',
        rol: 'admin',
        activo: true,
      },
    });

    // Crear cliente de prueba
    testCliente = await prisma.cliente.create({
      data: {
        nombre: 'Cliente Test',
        rif: `J-${Date.now()}`,
        tipoProducto: 'Bolsa',
      },
    });
  });

  afterEach(async () => {
    // Limpiar datos de prueba
    await prisma.notificacion.deleteMany({
      where: { usuarioId: testAdminUser.id },
    });
    await prisma.user.delete({ where: { id: testAdminUser.id } });
    await prisma.cliente.delete({ where: { id: testCliente.id } });
  });

  describe('notifyInvoiceCreated', () => {
    it('debe crear notificación para admin cuando se genera factura', async () => {
      // Arrange
      const factura: FacturaWithRelations = {
        id: 'factura-test-1',
        numero: 'FAC-20240115-0001',
        clienteId: testCliente.id,
        fecha: new Date(),
        fechaVencimiento: null,
        subtotal: 1000,
        iva: 160,
        total: 1160,
        estado: 'Emitida',
        metodoPago: null,
        observaciones: null,
        pagadaAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        cliente: {
          id: testCliente.id,
          nombre: testCliente.nombre,
        },
        detalles: [
          {
            id: 'detalle-1',
            despachoId: 'despacho-1',
          },
        ],
      };

      // Act
      await service.notifyInvoiceCreated(factura);

      // Assert
      const notificaciones = await prisma.notificacion.findMany({
        where: { usuarioId: testAdminUser.id },
      });

      expect(notificaciones).toHaveLength(1);
      expect(notificaciones[0].tipo).toBe('Sistema');
      expect(notificaciones[0].titulo).toBe('Nueva factura generada automáticamente');
      expect(notificaciones[0].mensaje).toContain('FAC-20240115-0001');
      expect(notificaciones[0].mensaje).toContain('Cliente Test');
      expect(notificaciones[0].mensaje).toContain('$1160.00');
      expect(notificaciones[0].enlace).toBe('/facturas/factura-test-1');
      expect(notificaciones[0].leida).toBe(false);
    });

    it('debe incluir número de factura en el mensaje (Req 6.2)', async () => {
      // Arrange
      const factura: FacturaWithRelations = {
        id: 'factura-test-2',
        numero: 'FAC-20240115-0002',
        clienteId: testCliente.id,
        fecha: new Date(),
        fechaVencimiento: null,
        subtotal: 500,
        iva: 80,
        total: 580,
        estado: 'Emitida',
        metodoPago: null,
        observaciones: null,
        pagadaAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        cliente: {
          id: testCliente.id,
          nombre: 'Acme Corp',
        },
        detalles: [],
      };

      // Act
      await service.notifyInvoiceCreated(factura);

      // Assert
      const notificacion = await prisma.notificacion.findFirst({
        where: { usuarioId: testAdminUser.id },
      });

      expect(notificacion?.mensaje).toContain('FAC-20240115-0002');
    });

    it('debe incluir nombre del cliente en el mensaje (Req 6.2)', async () => {
      // Arrange
      const factura: FacturaWithRelations = {
        id: 'factura-test-3',
        numero: 'FAC-20240115-0003',
        clienteId: testCliente.id,
        fecha: new Date(),
        fechaVencimiento: null,
        subtotal: 500,
        iva: 80,
        total: 580,
        estado: 'Emitida',
        metodoPago: null,
        observaciones: null,
        pagadaAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        cliente: {
          id: testCliente.id,
          nombre: 'Acme Corp',
        },
        detalles: [],
      };

      // Act
      await service.notifyInvoiceCreated(factura);

      // Assert
      const notificacion = await prisma.notificacion.findFirst({
        where: { usuarioId: testAdminUser.id },
      });

      expect(notificacion?.mensaje).toContain('Acme Corp');
    });

    it('debe incluir valor total en el mensaje (Req 6.2)', async () => {
      // Arrange
      const factura: FacturaWithRelations = {
        id: 'factura-test-4',
        numero: 'FAC-20240115-0004',
        clienteId: testCliente.id,
        fecha: new Date(),
        fechaVencimiento: null,
        subtotal: 500,
        iva: 80,
        total: 580,
        estado: 'Emitida',
        metodoPago: null,
        observaciones: null,
        pagadaAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        cliente: {
          id: testCliente.id,
          nombre: 'Acme Corp',
        },
        detalles: [],
      };

      // Act
      await service.notifyInvoiceCreated(factura);

      // Assert
      const notificacion = await prisma.notificacion.findFirst({
        where: { usuarioId: testAdminUser.id },
      });

      expect(notificacion?.mensaje).toContain('$580.00');
    });

    it('debe incluir enlace directo a la factura (Req 6.3)', async () => {
      // Arrange
      const factura: FacturaWithRelations = {
        id: 'factura-test-5',
        numero: 'FAC-20240115-0005',
        clienteId: testCliente.id,
        fecha: new Date(),
        fechaVencimiento: null,
        subtotal: 500,
        iva: 80,
        total: 580,
        estado: 'Emitida',
        metodoPago: null,
        observaciones: null,
        pagadaAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        cliente: {
          id: testCliente.id,
          nombre: 'Acme Corp',
        },
        detalles: [],
      };

      // Act
      await service.notifyInvoiceCreated(factura);

      // Assert
      const notificacion = await prisma.notificacion.findFirst({
        where: { usuarioId: testAdminUser.id },
      });

      expect(notificacion?.enlace).toBe('/facturas/factura-test-5');
    });

    it('debe tener tipo "Sistema" (Req 6.4)', async () => {
      // Arrange
      const factura: FacturaWithRelations = {
        id: 'factura-test-6',
        numero: 'FAC-20240115-0006',
        clienteId: testCliente.id,
        fecha: new Date(),
        fechaVencimiento: null,
        subtotal: 500,
        iva: 80,
        total: 580,
        estado: 'Emitida',
        metodoPago: null,
        observaciones: null,
        pagadaAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        cliente: {
          id: testCliente.id,
          nombre: 'Acme Corp',
        },
        detalles: [],
      };

      // Act
      await service.notifyInvoiceCreated(factura);

      // Assert
      const notificacion = await prisma.notificacion.findFirst({
        where: { usuarioId: testAdminUser.id },
      });

      expect(notificacion?.tipo).toBe('Sistema');
    });

    it('debe crear notificaciones para múltiples admins', async () => {
      // Arrange
      const admin2 = await prisma.user.create({
        data: {
          email: `admin2-${Date.now()}@test.com`,
          password: 'hashedpassword',
          nombre: 'Admin Test 2',
          rol: 'admin',
          activo: true,
        },
      });

      const factura: FacturaWithRelations = {
        id: 'factura-test-7',
        numero: 'FAC-20240115-0007',
        clienteId: testCliente.id,
        fecha: new Date(),
        fechaVencimiento: null,
        subtotal: 500,
        iva: 80,
        total: 580,
        estado: 'Emitida',
        metodoPago: null,
        observaciones: null,
        pagadaAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        cliente: {
          id: testCliente.id,
          nombre: 'Acme Corp',
        },
        detalles: [],
      };

      // Act
      await service.notifyInvoiceCreated(factura);

      // Assert
      const notificaciones = await prisma.notificacion.findMany({
        where: {
          usuarioId: { in: [testAdminUser.id, admin2.id] },
        },
      });

      expect(notificaciones).toHaveLength(2);

      // Cleanup
      await prisma.notificacion.deleteMany({
        where: { usuarioId: admin2.id },
      });
      await prisma.user.delete({ where: { id: admin2.id } });
    });

    it('no debe fallar si no hay admins', async () => {
      // Arrange
      await prisma.user.update({
        where: { id: testAdminUser.id },
        data: { rol: 'usuario' },
      });

      const factura: FacturaWithRelations = {
        id: 'factura-test-8',
        numero: 'FAC-20240115-0008',
        clienteId: testCliente.id,
        fecha: new Date(),
        fechaVencimiento: null,
        subtotal: 500,
        iva: 80,
        total: 580,
        estado: 'Emitida',
        metodoPago: null,
        observaciones: null,
        pagadaAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        cliente: {
          id: testCliente.id,
          nombre: 'Acme Corp',
        },
        detalles: [],
      };

      // Act & Assert - no debe lanzar error
      await expect(service.notifyInvoiceCreated(factura)).resolves.not.toThrow();

      // Restaurar rol admin para cleanup
      await prisma.user.update({
        where: { id: testAdminUser.id },
        data: { rol: 'admin' },
      });
    });
  });

  describe('notifyInvoiceError', () => {
    it('debe crear notificación de error para admin', async () => {
      // Arrange
      const despachoId = 'despacho-error-1';
      const errorMessage = 'Cliente no encontrado';

      // Act
      await service.notifyInvoiceError(despachoId, errorMessage);

      // Assert
      const notificaciones = await prisma.notificacion.findMany({
        where: { usuarioId: testAdminUser.id },
      });

      expect(notificaciones).toHaveLength(1);
      expect(notificaciones[0].tipo).toBe('Sistema');
      expect(notificaciones[0].titulo).toBe('Error en generación automática de factura');
      expect(notificaciones[0].mensaje).toContain('despacho-error-1');
      expect(notificaciones[0].mensaje).toContain('Cliente no encontrado');
      expect(notificaciones[0].enlace).toBe('/despachos/despacho-error-1');
      expect(notificaciones[0].leida).toBe(false);
    });

    it('debe incluir ID del despacho en el mensaje (Req 7.3)', async () => {
      // Arrange
      const despachoId = 'despacho-error-2';
      const errorMessage = 'Error de validación';

      // Act
      await service.notifyInvoiceError(despachoId, errorMessage);

      // Assert
      const notificacion = await prisma.notificacion.findFirst({
        where: { usuarioId: testAdminUser.id },
      });

      expect(notificacion?.mensaje).toContain('despacho-error-2');
    });

    it('debe incluir mensaje de error descriptivo (Req 7.3)', async () => {
      // Arrange
      const despachoId = 'despacho-error-3';
      const errorMessage = 'Despacho no tiene cliente asociado';

      // Act
      await service.notifyInvoiceError(despachoId, errorMessage);

      // Assert
      const notificacion = await prisma.notificacion.findFirst({
        where: { usuarioId: testAdminUser.id },
      });

      expect(notificacion?.mensaje).toContain('Despacho no tiene cliente asociado');
    });

    it('debe incluir enlace al despacho con error', async () => {
      // Arrange
      const despachoId = 'despacho-error-4';
      const errorMessage = 'Error de validación';

      // Act
      await service.notifyInvoiceError(despachoId, errorMessage);

      // Assert
      const notificacion = await prisma.notificacion.findFirst({
        where: { usuarioId: testAdminUser.id },
      });

      expect(notificacion?.enlace).toBe('/despachos/despacho-error-4');
    });

    it('debe crear notificaciones de error para múltiples admins', async () => {
      // Arrange
      const admin2 = await prisma.user.create({
        data: {
          email: `admin3-${Date.now()}@test.com`,
          password: 'hashedpassword',
          nombre: 'Admin Test 3',
          rol: 'admin',
          activo: true,
        },
      });

      const despachoId = 'despacho-error-5';
      const errorMessage = 'Error de validación';

      // Act
      await service.notifyInvoiceError(despachoId, errorMessage);

      // Assert
      const notificaciones = await prisma.notificacion.findMany({
        where: {
          usuarioId: { in: [testAdminUser.id, admin2.id] },
        },
      });

      expect(notificaciones).toHaveLength(2);

      // Cleanup
      await prisma.notificacion.deleteMany({
        where: { usuarioId: admin2.id },
      });
      await prisma.user.delete({ where: { id: admin2.id } });
    });

    it('no debe fallar si no hay admins', async () => {
      // Arrange
      await prisma.user.update({
        where: { id: testAdminUser.id },
        data: { rol: 'usuario' },
      });

      const despachoId = 'despacho-error-6';
      const errorMessage = 'Error de validación';

      // Act & Assert - no debe lanzar error
      await expect(
        service.notifyInvoiceError(despachoId, errorMessage)
      ).resolves.not.toThrow();

      // Restaurar rol admin para cleanup
      await prisma.user.update({
        where: { id: testAdminUser.id },
        data: { rol: 'admin' },
      });
    });
  });
});
