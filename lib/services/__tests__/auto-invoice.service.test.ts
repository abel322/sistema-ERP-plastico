/**
 * Unit tests for AutoInvoiceService
 * 
 * These tests verify the core functionality of automatic invoice generation
 * from despachos, including edge cases and error handling.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AutoInvoiceService } from '../auto-invoice.service';
import { prisma } from '../../db';
import { Cliente, Despacho } from '@prisma/client';

describe('AutoInvoiceService', () => {
  let service: AutoInvoiceService;
  let testCliente: Cliente;
  let testDespacho: Despacho;

  beforeEach(async () => {
    service = new AutoInvoiceService();

    // Crear cliente de prueba
    testCliente = await prisma.cliente.create({
      data: {
        nombre: 'Cliente Test',
        rif: `TEST-${Date.now()}`,
        tipoProducto: 'Bolsa',
        unidadVenta: 'Unidades',
      },
    });
  });

  afterEach(async () => {
    // Limpiar datos de prueba
    if (testDespacho) {
      await prisma.detalleFactura.deleteMany({
        where: { despachoId: testDespacho.id },
      });
      await prisma.factura.deleteMany({
        where: { clienteId: testCliente.id },
      });
      await prisma.despacho.delete({
        where: { id: testDespacho.id },
      }).catch(() => {});
    }
    
    await prisma.cliente.delete({
      where: { id: testCliente.id },
    }).catch(() => {});
  });

  describe('generateNextInvoiceNumber', () => {
    it('debe generar número de factura con formato correcto', async () => {
      const numero = await service.generateNextInvoiceNumber();
      
      // Verificar formato: FAC-YYYYMMDD-NNNN
      expect(numero).toMatch(/^FAC-\d{8}-\d{4}$/);
    });

    it('debe generar números secuenciales', async () => {
      const numero1 = await service.generateNextInvoiceNumber();
      
      // Crear una factura con ese número
      await prisma.factura.create({
        data: {
          numero: numero1,
          clienteId: testCliente.id,
          fecha: new Date(),
          subtotal: 0,
          iva: 0,
          total: 0,
          estado: 'Borrador',
        },
      });

      const numero2 = await service.generateNextInvoiceNumber();
      
      // Extraer secuencias
      const seq1 = parseInt(numero1.split('-')[2], 10);
      const seq2 = parseInt(numero2.split('-')[2], 10);
      
      expect(seq2).toBe(seq1 + 1);
    });
  });

  describe('validateDespacho', () => {
    it('debe retornar error si el despacho no existe', async () => {
      const result = await service.validateDespacho('despacho-inexistente');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Despacho no encontrado');
    });

    it('debe retornar válido para despacho con cliente existente', async () => {
      testDespacho = await prisma.despacho.create({
        data: {
          clienteId: testCliente.id,
          cantidadDespachada: 100,
          unidad: 'Unidades',
          estado: 'EnTransito',
          fecha: new Date(),
        },
      });

      const result = await service.validateDespacho(testDespacho.id);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe retornar error si el despacho ya fue facturado', async () => {
      testDespacho = await prisma.despacho.create({
        data: {
          clienteId: testCliente.id,
          cantidadDespachada: 100,
          unidad: 'Unidades',
          estado: 'Entregado',
          entregadoAt: new Date(),
          fecha: new Date(),
        },
      });

      // Crear factura existente
      const factura = await prisma.factura.create({
        data: {
          numero: 'FAC-TEST-0001',
          clienteId: testCliente.id,
          fecha: new Date(),
          subtotal: 0,
          iva: 0,
          total: 0,
          estado: 'Emitida',
          detalles: {
            create: {
              despachoId: testDespacho.id,
              descripcion: 'Test',
              cantidad: 100,
              unidad: 'Unidades',
              precioUnitario: 10,
              subtotal: 1000,
            },
          },
        },
      });

      const result = await service.validateDespacho(testDespacho.id);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('ya fue facturado'))).toBe(true);
    });
  });

  describe('generateFromDespacho', () => {
    it('debe crear factura con estado Emitida cuando despacho tiene precio', async () => {
      testDespacho = await prisma.despacho.create({
        data: {
          clienteId: testCliente.id,
          cantidadDespachada: 100,
          unidad: 'Unidades',
          precioUnitario: 10.50,
          estado: 'Entregado',
          entregadoAt: new Date(),
          fecha: new Date(),
        },
      });

      const factura = await service.generateFromDespacho(testDespacho.id);

      expect(factura).toBeDefined();
      expect(factura.estado).toBe('Emitida');
      expect(factura.clienteId).toBe(testCliente.id);
      expect(factura.subtotal).toBe(1050); // 100 * 10.50
      expect(factura.iva).toBe(168); // 1050 * 0.16
      expect(factura.total).toBe(1218); // 1050 + 168
      expect(factura.numero).toMatch(/^FAC-\d{8}-\d{4}$/);
    });

    it('debe crear factura con estado Borrador cuando despacho no tiene precio', async () => {
      testDespacho = await prisma.despacho.create({
        data: {
          clienteId: testCliente.id,
          cantidadDespachada: 100,
          unidad: 'Unidades',
          precioUnitario: null,
          estado: 'Entregado',
          entregadoAt: new Date(),
          fecha: new Date(),
        },
      });

      const factura = await service.generateFromDespacho(testDespacho.id);

      expect(factura).toBeDefined();
      expect(factura.estado).toBe('Borrador');
      expect(factura.subtotal).toBe(0);
      expect(factura.iva).toBe(0);
      expect(factura.total).toBe(0);
    });

    /**
     * Edge case test: Despacho sin precio unitario
     * **Validates: Requirements 1.5**
     * 
     * Verifica que cuando un despacho no tiene precioUnitario definido,
     * se crea una factura en estado Borrador con todos los valores en 0,
     * incluyendo el precioUnitario en el detalle.
     */
    it('debe crear factura Borrador con valores en 0 cuando despacho sin precioUnitario', async () => {
      // Arrange: Crear despacho sin precio unitario
      testDespacho = await prisma.despacho.create({
        data: {
          clienteId: testCliente.id,
          cantidadDespachada: 150,
          unidad: 'Kilogramos',
          precioUnitario: null,
          estado: 'Entregado',
          entregadoAt: new Date(),
          fecha: new Date(),
        },
      });

      // Act: Generar factura desde despacho
      const factura = await service.generateFromDespacho(testDespacho.id);

      // Assert: Verificar estado Borrador
      expect(factura.estado).toBe('Borrador');

      // Assert: Verificar valores en 0
      expect(factura.subtotal).toBe(0);
      expect(factura.iva).toBe(0);
      expect(factura.total).toBe(0);

      // Assert: Verificar detalle con precioUnitario = 0
      const detalles = await prisma.detalleFactura.findMany({
        where: { facturaId: factura.id },
      });

      expect(detalles).toHaveLength(1);
      
      const detalle = detalles[0];
      expect(detalle.despachoId).toBe(testDespacho.id);
      expect(detalle.cantidad).toBe(150);
      expect(detalle.unidad).toBe('Kilogramos');
      expect(detalle.precioUnitario).toBe(0);
      expect(detalle.subtotal).toBe(0);
    });

    it('debe crear detalle de factura con datos del despacho', async () => {
      testDespacho = await prisma.despacho.create({
        data: {
          clienteId: testCliente.id,
          cantidadDespachada: 50,
          unidad: 'Kilogramos',
          precioUnitario: 25.75,
          estado: 'Entregado',
          entregadoAt: new Date(),
          fecha: new Date(),
        },
      });

      const factura = await service.generateFromDespacho(testDespacho.id);

      // Obtener detalles de la factura
      const detalles = await prisma.detalleFactura.findMany({
        where: { facturaId: factura.id },
      });

      expect(detalles).toHaveLength(1);
      
      const detalle = detalles[0];
      expect(detalle.despachoId).toBe(testDespacho.id);
      expect(detalle.cantidad).toBe(50);
      expect(detalle.unidad).toBe('Kilogramos');
      expect(detalle.precioUnitario).toBe(25.75);
      expect(detalle.subtotal).toBe(1287.5); // 50 * 25.75
      expect(detalle.descripcion).toContain(testCliente.nombre);
    });

    it('debe lanzar error si el despacho no existe', async () => {
      await expect(
        service.generateFromDespacho('despacho-inexistente')
      ).rejects.toThrow('Validación fallida');
    });

    it('debe usar la fecha de entrega del despacho como fecha de factura', async () => {
      const fechaEntrega = new Date('2024-01-15T10:00:00Z');
      
      testDespacho = await prisma.despacho.create({
        data: {
          clienteId: testCliente.id,
          cantidadDespachada: 100,
          unidad: 'Unidades',
          precioUnitario: 10,
          estado: 'Entregado',
          entregadoAt: fechaEntrega,
          fecha: new Date(),
        },
      });

      const factura = await service.generateFromDespacho(testDespacho.id);

      expect(factura.fecha.toISOString()).toBe(fechaEntrega.toISOString());
    });
  });

  describe('Transaction support', () => {
    it('debe soportar transacciones para rollback', async () => {
      testDespacho = await prisma.despacho.create({
        data: {
          clienteId: testCliente.id,
          cantidadDespachada: 100,
          unidad: 'Unidades',
          precioUnitario: 10,
          estado: 'Entregado',
          entregadoAt: new Date(),
          fecha: new Date(),
        },
      });

      // Intentar crear factura dentro de transacción que falla
      try {
        await prisma.$transaction(async (tx) => {
          const factura = await service.generateFromDespacho(testDespacho.id, tx);
          expect(factura).toBeDefined();
          
          // Forzar error para rollback
          throw new Error('Rollback test');
        });
      } catch (error) {
        // Esperado
      }

      // Verificar que no se creó la factura (rollback exitoso)
      const facturas = await prisma.factura.findMany({
        where: { clienteId: testCliente.id },
      });

      expect(facturas).toHaveLength(0);
    });
  });
});
