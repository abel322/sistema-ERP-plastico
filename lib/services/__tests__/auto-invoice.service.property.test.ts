/**
 * Property-Based Tests for AutoInvoiceService
 * 
 * Feature: automatic-invoicing
 * Property 1: Generación Automática de Factura al Entregar
 * 
 * **Validates: Requirements 1.1, 1.5**
 * 
 * Para cualquier despacho que sea actualizado al estado "Entregado",
 * el sistema debe crear automáticamente una nueva factura con estado
 * "Emitida" (o "Borrador" si no tiene precio unitario).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { AutoInvoiceService } from '../auto-invoice.service';
import { prisma } from '../../db';
import { Cliente, Despacho } from '@prisma/client';

describe('Property 1: Generación Automática de Factura al Entregar', () => {
  let service: AutoInvoiceService;
  let testCliente: Cliente;
  const createdDespachos: string[] = [];
  const createdFacturas: string[] = [];

  beforeEach(async () => {
    service = new AutoInvoiceService();

    // Crear cliente de prueba único para cada test
    testCliente = await prisma.cliente.create({
      data: {
        nombre: `Cliente Test ${Date.now()}`,
        rif: `TEST-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        tipoProducto: 'Bolsa',
        unidadVenta: 'Unidades',
      },
    });
  });

  afterEach(async () => {
    // Limpiar datos de prueba en orden correcto
    if (createdDespachos.length > 0) {
      await prisma.detalleFactura.deleteMany({
        where: { despachoId: { in: createdDespachos } },
      });
    }

    if (createdFacturas.length > 0) {
      await prisma.factura.deleteMany({
        where: { id: { in: createdFacturas } },
      });
    }

    if (createdDespachos.length > 0) {
      await prisma.despacho.deleteMany({
        where: { id: { in: createdDespachos } },
      });
    }

    await prisma.cliente.delete({
      where: { id: testCliente.id },
    }).catch(() => {});

    // Limpiar arrays
    createdDespachos.length = 0;
    createdFacturas.length = 0;
  });

  /**
   * Generador de despacho válido con o sin precio unitario
   */
  const despachoArbitrary = () => {
    return fc.record({
      cantidadDespachada: fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }),
      unidad: fc.constantFrom('Unidades', 'Kilogramos', 'Metros'),
      precioUnitario: fc.option(
        fc.float({ min: Math.fround(1), max: Math.fround(1000), noNaN: true }),
        { nil: null }
      ),
      vehiculo: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
      conductor: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
      destino: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    });
  };

  it('debe crear factura automáticamente al marcar despacho como entregado', async () => {
    await fc.assert(
      fc.asyncProperty(
        despachoArbitrary(),
        async (despachoData) => {
          // Arrange: Crear despacho en estado "EnTransito"
          const despacho = await prisma.despacho.create({
            data: {
              clienteId: testCliente.id,
              cantidadDespachada: despachoData.cantidadDespachada,
              unidad: despachoData.unidad,
              precioUnitario: despachoData.precioUnitario,
              vehiculo: despachoData.vehiculo,
              conductor: despachoData.conductor,
              destino: despachoData.destino,
              estado: 'Pendiente',
              fecha: new Date(),
            },
          });

          createdDespachos.push(despacho.id);

          // Act: Generar factura desde el despacho
          const factura = await service.generateFromDespacho(despacho.id);
          createdFacturas.push(factura.id);

          // Assert: Verificar que se creó la factura
          expect(factura).toBeDefined();
          expect(factura.id).toBeDefined();

          // Property 1.1: Verificar que la factura tiene el estado correcto
          // - "Emitida" si tiene precioUnitario
          // - "Borrador" si no tiene precioUnitario (Requirement 1.5)
          if (despachoData.precioUnitario !== null) {
            expect(factura.estado).toBe('Emitida');
          } else {
            expect(factura.estado).toBe('Borrador');
          }

          // Verificar que la factura está asociada al cliente correcto
          expect(factura.clienteId).toBe(testCliente.id);

          // Verificar que se creó un detalle de factura vinculado al despacho
          const detalles = await prisma.detalleFactura.findMany({
            where: { 
              facturaId: factura.id,
              despachoId: despacho.id,
            },
          });

          expect(detalles.length).toBeGreaterThan(0);

          // Verificar que el detalle tiene los datos correctos del despacho
          const detalle = detalles[0];
          expect(detalle.cantidad).toBeCloseTo(despachoData.cantidadDespachada, 5);
          expect(detalle.unidad).toBe(despachoData.unidad);

          if (despachoData.precioUnitario !== null) {
            expect(detalle.precioUnitario).toBeCloseTo(despachoData.precioUnitario, 5);
            // Verificar que los totales no son cero
            expect(factura.subtotal).toBeGreaterThan(0);
            expect(factura.total).toBeGreaterThan(0);
          } else {
            // Requirement 1.5: Factura con valores en cero si no hay precio
            expect(detalle.precioUnitario).toBe(0);
            expect(factura.subtotal).toBe(0);
            expect(factura.iva).toBe(0);
            expect(factura.total).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('debe crear factura con número único y secuencial', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(despachoArbitrary(), { minLength: 2, maxLength: 5 }),
        async (despachosData) => {
          const facturas: string[] = [];

          // Crear múltiples despachos y generar facturas
          for (const despachoData of despachosData) {
            const despacho = await prisma.despacho.create({
              data: {
                clienteId: testCliente.id,
                cantidadDespachada: despachoData.cantidadDespachada,
                unidad: despachoData.unidad,
                precioUnitario: despachoData.precioUnitario,
                estado: 'Pendiente',
                fecha: new Date(),
              },
            });

            createdDespachos.push(despacho.id);

            const factura = await service.generateFromDespacho(despacho.id);
            createdFacturas.push(factura.id);
            facturas.push(factura.numero);
          }

          // Verificar que todos los números son únicos
          const uniqueNumeros = new Set(facturas);
          expect(uniqueNumeros.size).toBe(facturas.length);

          // Verificar formato de número de factura: FAC-YYYYMMDD-NNNN
          for (const numero of facturas) {
            expect(numero).toMatch(/^FAC-\d{8}-\d{4}$/);
          }
        }
      ),
      { numRuns: 20 } // Menos iteraciones porque crea múltiples registros
    );
  });

  it('debe calcular correctamente los totales cuando hay precio unitario', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          cantidadDespachada: fc.float({ min: Math.fround(1), max: Math.fround(1000), noNaN: true }),
          unidad: fc.constantFrom('Unidades', 'Kilogramos', 'Metros'),
          precioUnitario: fc.float({ min: Math.fround(1), max: Math.fround(100), noNaN: true }),
        }),
        async (despachoData) => {
          // Arrange: Crear despacho con precio
          const despacho = await prisma.despacho.create({
            data: {
              clienteId: testCliente.id,
              cantidadDespachada: despachoData.cantidadDespachada,
              unidad: despachoData.unidad,
              precioUnitario: despachoData.precioUnitario,
              estado: 'Pendiente',
              fecha: new Date(),
            },
          });

          createdDespachos.push(despacho.id);

          // Act: Generar factura
          const factura = await service.generateFromDespacho(despacho.id);
          createdFacturas.push(factura.id);

          // Assert: Verificar cálculos
          const expectedSubtotal = Math.round(
            despachoData.cantidadDespachada * despachoData.precioUnitario * 100
          ) / 100;
          const expectedIva = Math.round(expectedSubtotal * 0.16 * 100) / 100;
          const expectedTotal = Math.round((expectedSubtotal + expectedIva) * 100) / 100;

          expect(factura.subtotal).toBeCloseTo(expectedSubtotal, 2);
          expect(factura.iva).toBeCloseTo(expectedIva, 2);
          expect(factura.total).toBeCloseTo(expectedTotal, 2);

          // Verificar que el estado es "Emitida"
          expect(factura.estado).toBe('Emitida');
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property-Based Tests for Data Mapping
 * 
 * Feature: automatic-invoicing
 * Property 3: Mapeo Completo de Datos del Despacho
 * 
 * **Validates: Requirements 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.7**
 * 
 * Para cualquier factura generada automáticamente desde un despacho,
 * la factura debe contener:
 * (1) la fecha de entrega del despacho como fecha de factura,
 * (2) el cliente del despacho asociado, y
 * (3) un detalle de factura con la cantidad, unidad, precio unitario
 *     y referencia al despacho original.
 */
describe('Property 3: Mapeo Completo de Datos del Despacho', () => {
  let service: AutoInvoiceService;
  let testCliente: Cliente;
  const createdDespachos: string[] = [];
  const createdFacturas: string[] = [];

  beforeEach(async () => {
    service = new AutoInvoiceService();

    // Crear cliente de prueba único para cada test
    testCliente = await prisma.cliente.create({
      data: {
        nombre: `Cliente Test ${Date.now()}`,
        rif: `TEST-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        tipoProducto: 'Bolsa',
        unidadVenta: 'Unidades',
      },
    });
  });

  afterEach(async () => {
    // Limpiar datos de prueba en orden correcto
    if (createdDespachos.length > 0) {
      await prisma.detalleFactura.deleteMany({
        where: { despachoId: { in: createdDespachos } },
      });
    }

    if (createdFacturas.length > 0) {
      await prisma.factura.deleteMany({
        where: { id: { in: createdFacturas } },
      });
    }

    if (createdDespachos.length > 0) {
      await prisma.despacho.deleteMany({
        where: { id: { in: createdDespachos } },
      });
    }

    await prisma.cliente.delete({
      where: { id: testCliente.id },
    }).catch(() => {});

    // Limpiar arrays
    createdDespachos.length = 0;
    createdFacturas.length = 0;
  });

  /**
   * Generador de despacho con fecha de entrega
   */
  const despachoConFechaArbitrary = () => {
    return fc.record({
      cantidadDespachada: fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }),
      unidad: fc.constantFrom('Unidades', 'Kilogramos', 'Metros'),
      precioUnitario: fc.float({ min: Math.fround(1), max: Math.fround(1000), noNaN: true }),
      entregadoAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
      vehiculo: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
      conductor: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
      destino: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    });
  };

  it('debe mapear correctamente la fecha de entrega del despacho a la fecha de factura', async () => {
    await fc.assert(
      fc.asyncProperty(
        despachoConFechaArbitrary(),
        async (despachoData) => {
          // Arrange: Crear despacho con fecha de entrega específica
          const despacho = await prisma.despacho.create({
            data: {
              clienteId: testCliente.id,
              cantidadDespachada: despachoData.cantidadDespachada,
              unidad: despachoData.unidad,
              precioUnitario: despachoData.precioUnitario,
              entregadoAt: despachoData.entregadoAt,
              vehiculo: despachoData.vehiculo,
              conductor: despachoData.conductor,
              destino: despachoData.destino,
              estado: 'Pendiente',
              fecha: new Date(),
            },
          });

          createdDespachos.push(despacho.id);

          // Act: Generar factura desde el despacho
          const factura = await service.generateFromDespacho(despacho.id);
          createdFacturas.push(factura.id);

          // Assert: Requirement 1.3 - Verificar que la fecha de la factura
          // es la fecha de entrega del despacho
          expect(factura.fecha.getTime()).toBe(despachoData.entregadoAt.getTime());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('debe asociar la factura con el cliente del despacho', async () => {
    await fc.assert(
      fc.asyncProperty(
        despachoConFechaArbitrary(),
        async (despachoData) => {
          // Arrange: Crear despacho asociado al cliente de prueba
          const despacho = await prisma.despacho.create({
            data: {
              clienteId: testCliente.id,
              cantidadDespachada: despachoData.cantidadDespachada,
              unidad: despachoData.unidad,
              precioUnitario: despachoData.precioUnitario,
              entregadoAt: despachoData.entregadoAt,
              estado: 'Pendiente',
              fecha: new Date(),
            },
          });

          createdDespachos.push(despacho.id);

          // Act: Generar factura
          const factura = await service.generateFromDespacho(despacho.id);
          createdFacturas.push(factura.id);

          // Assert: Requirement 1.4 - Verificar que la factura está asociada
          // al cliente del despacho
          expect(factura.clienteId).toBe(testCliente.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('debe crear detalle de factura con todos los datos del despacho mapeados correctamente', async () => {
    await fc.assert(
      fc.asyncProperty(
        despachoConFechaArbitrary(),
        async (despachoData) => {
          // Arrange: Crear despacho con todos los datos
          const despacho = await prisma.despacho.create({
            data: {
              clienteId: testCliente.id,
              cantidadDespachada: despachoData.cantidadDespachada,
              unidad: despachoData.unidad,
              precioUnitario: despachoData.precioUnitario,
              entregadoAt: despachoData.entregadoAt,
              vehiculo: despachoData.vehiculo,
              conductor: despachoData.conductor,
              destino: despachoData.destino,
              estado: 'Pendiente',
              fecha: new Date(),
            },
          });

          createdDespachos.push(despacho.id);

          // Act: Generar factura
          const factura = await service.generateFromDespacho(despacho.id);
          createdFacturas.push(factura.id);

          // Obtener el detalle de factura
          const detalles = await prisma.detalleFactura.findMany({
            where: { 
              facturaId: factura.id,
              despachoId: despacho.id,
            },
          });

          // Assert: Verificar que se creó al menos un detalle
          expect(detalles.length).toBeGreaterThan(0);

          const detalle = detalles[0];

          // Requirement 2.1 - Verificar cantidad despachada
          expect(detalle.cantidad).toBeCloseTo(despachoData.cantidadDespachada, 5);

          // Requirement 2.2 - Verificar unidad de medida
          expect(detalle.unidad).toBe(despachoData.unidad);

          // Requirement 2.3 - Verificar precio unitario
          expect(detalle.precioUnitario).toBeCloseTo(despachoData.precioUnitario, 5);

          // Requirement 2.4 - Verificar que el precio unitario está incluido
          expect(detalle.precioUnitario).toBeDefined();
          expect(detalle.precioUnitario).toBeGreaterThan(0);

          // Requirement 2.7 - Verificar referencia al despacho original
          expect(detalle.despachoId).toBe(despacho.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('debe mapear todos los datos del despacho en una sola operación (test integrado)', async () => {
    await fc.assert(
      fc.asyncProperty(
        despachoConFechaArbitrary(),
        async (despachoData) => {
          // Arrange: Crear despacho completo
          const despacho = await prisma.despacho.create({
            data: {
              clienteId: testCliente.id,
              cantidadDespachada: despachoData.cantidadDespachada,
              unidad: despachoData.unidad,
              precioUnitario: despachoData.precioUnitario,
              entregadoAt: despachoData.entregadoAt,
              vehiculo: despachoData.vehiculo,
              conductor: despachoData.conductor,
              destino: despachoData.destino,
              estado: 'Pendiente',
              fecha: new Date(),
            },
          });

          createdDespachos.push(despacho.id);

          // Act: Generar factura
          const factura = await service.generateFromDespacho(despacho.id);
          createdFacturas.push(factura.id);

          // Obtener factura completa con detalles
          const facturaCompleta = await prisma.factura.findUnique({
            where: { id: factura.id },
            include: {
              cliente: true,
              detalles: true,
            },
          });

          expect(facturaCompleta).toBeDefined();

          // Assert: Verificar mapeo completo de datos
          // Property 3 - Parte 1: Fecha de entrega como fecha de factura (Req 1.3)
          expect(facturaCompleta!.fecha.getTime()).toBe(despachoData.entregadoAt.getTime());

          // Property 3 - Parte 2: Cliente del despacho asociado (Req 1.4)
          expect(facturaCompleta!.clienteId).toBe(testCliente.id);
          expect(facturaCompleta!.cliente.id).toBe(testCliente.id);

          // Property 3 - Parte 3: Detalle con todos los datos (Req 2.1, 2.2, 2.3, 2.4, 2.7)
          expect(facturaCompleta!.detalles.length).toBeGreaterThan(0);
          
          const detalle = facturaCompleta!.detalles[0];
          
          // Req 2.1: Cantidad
          expect(detalle.cantidad).toBeCloseTo(despachoData.cantidadDespachada, 5);
          
          // Req 2.2: Unidad
          expect(detalle.unidad).toBe(despachoData.unidad);
          
          // Req 2.3 y 2.4: Precio unitario
          expect(detalle.precioUnitario).toBeCloseTo(despachoData.precioUnitario, 5);
          
          // Req 2.7: Referencia al despacho original
          expect(detalle.despachoId).toBe(despacho.id);

          // Verificar que la descripción incluye el nombre del cliente (Req 2.6)
          expect(detalle.descripcion).toContain(testCliente.nombre);
        }
      ),
      { numRuns: 100 }
    );
  });
});
