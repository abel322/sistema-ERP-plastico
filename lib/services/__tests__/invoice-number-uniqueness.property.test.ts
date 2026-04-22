/**
 * Property-Based Tests for Invoice Number Uniqueness and Sequentiality
 * 
 * Feature: automatic-invoicing
 * Property 2: Unicidad y Secuencialidad de Números de Factura
 * 
 * **Validates: Requirements 1.2**
 * 
 * Para cualquier conjunto de facturas creadas, todos los números de factura
 * deben ser únicos y seguir una secuencia incremental sin gaps.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { AutoInvoiceService } from '../auto-invoice.service';
import { prisma } from '../../db';
import { Cliente } from '@prisma/client';

describe('Property 2: Unicidad y Secuencialidad de Números de Factura', () => {
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
   * Generador de despacho válido con precio unitario
   */
  const despachoArbitrary = () => {
    return fc.record({
      cantidadDespachada: fc.float({ min: Math.fround(1), max: Math.fround(1000), noNaN: true }),
      unidad: fc.constantFrom('Unidades', 'Kilogramos', 'Metros'),
      precioUnitario: fc.float({ min: Math.fround(1), max: Math.fround(100), noNaN: true }),
    });
  };

  it('debe generar números de factura únicos para cualquier conjunto de facturas', { timeout: 30000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generar entre 2 y 10 despachos para crear múltiples facturas
        fc.array(despachoArbitrary(), { minLength: 2, maxLength: 10 }),
        async (despachosData) => {
          const numerosFactura: string[] = [];

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
            numerosFactura.push(factura.numero);
          }

          // Property: Todos los números de factura deben ser únicos
          const uniqueNumeros = new Set(numerosFactura);
          expect(uniqueNumeros.size).toBe(numerosFactura.length);

          // Verificar que no hay duplicados
          for (let i = 0; i < numerosFactura.length; i++) {
            for (let j = i + 1; j < numerosFactura.length; j++) {
              expect(numerosFactura[i]).not.toBe(numerosFactura[j]);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('debe seguir el formato FAC-YYYYMMDD-NNNN para todos los números generados', { timeout: 30000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(despachoArbitrary(), { minLength: 1, maxLength: 5 }),
        async (despachosData) => {
          const numerosFactura: string[] = [];

          // Crear despachos y generar facturas
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
            numerosFactura.push(factura.numero);
          }

          // Property: Todos los números deben seguir el formato FAC-YYYYMMDD-NNNN
          const formatoRegex = /^FAC-\d{8}-\d{4}$/;
          for (const numero of numerosFactura) {
            expect(numero).toMatch(formatoRegex);

            // Verificar que la fecha en el número es válida
            const partes = numero.split('-');
            expect(partes).toHaveLength(3);
            expect(partes[0]).toBe('FAC');

            const fechaParte = partes[1];
            const año = parseInt(fechaParte.substring(0, 4));
            const mes = parseInt(fechaParte.substring(4, 6));
            const dia = parseInt(fechaParte.substring(6, 8));

            // Verificar que la fecha es válida
            expect(año).toBeGreaterThanOrEqual(2000);
            expect(año).toBeLessThanOrEqual(2100);
            expect(mes).toBeGreaterThanOrEqual(1);
            expect(mes).toBeLessThanOrEqual(12);
            expect(dia).toBeGreaterThanOrEqual(1);
            expect(dia).toBeLessThanOrEqual(31);

            // Verificar que el número secuencial es válido (4 dígitos)
            const secuencial = partes[2];
            expect(secuencial).toHaveLength(4);
            const numeroSecuencial = parseInt(secuencial);
            expect(numeroSecuencial).toBeGreaterThanOrEqual(1);
            expect(numeroSecuencial).toBeLessThanOrEqual(9999);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('debe generar números secuenciales sin gaps para facturas del mismo día', { timeout: 30000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generar entre 3 y 8 despachos para crear múltiples facturas el mismo día
        fc.array(despachoArbitrary(), { minLength: 3, maxLength: 8 }),
        async (despachosData) => {
          const numerosFactura: string[] = [];
          const fechaHoy = new Date();

          // Crear todos los despachos con la misma fecha
          for (const despachoData of despachosData) {
            const despacho = await prisma.despacho.create({
              data: {
                clienteId: testCliente.id,
                cantidadDespachada: despachoData.cantidadDespachada,
                unidad: despachoData.unidad,
                precioUnitario: despachoData.precioUnitario,
                estado: 'Pendiente',
                fecha: fechaHoy,
              },
            });

            createdDespachos.push(despacho.id);

            const factura = await service.generateFromDespacho(despacho.id);
            createdFacturas.push(factura.id);
            numerosFactura.push(factura.numero);
          }

          // Extraer los números secuenciales de las facturas del mismo día
          const numerosSecuenciales: number[] = [];
          const fechaStr = fechaHoy.toISOString().split('T')[0].replace(/-/g, '');

          for (const numero of numerosFactura) {
            const partes = numero.split('-');
            const fechaParte = partes[1];
            const secuencial = parseInt(partes[2]);

            // Solo considerar facturas del día de hoy
            if (fechaParte === fechaStr) {
              numerosSecuenciales.push(secuencial);
            }
          }

          // Property: Los números secuenciales deben ser consecutivos sin gaps
          if (numerosSecuenciales.length > 1) {
            // Ordenar los números secuenciales
            numerosSecuenciales.sort((a, b) => a - b);

            // Verificar que son consecutivos (diferencia de 1 entre cada par)
            for (let i = 1; i < numerosSecuenciales.length; i++) {
              const diferencia = numerosSecuenciales[i] - numerosSecuenciales[i - 1];
              expect(diferencia).toBe(1);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('debe mantener secuencia incremental incluso con generación concurrente', { timeout: 30000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(despachoArbitrary(), { minLength: 5, maxLength: 10 }),
        async (despachosData) => {
          // Crear todos los despachos primero
          const despachosIds: string[] = [];
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
            despachosIds.push(despacho.id);
            createdDespachos.push(despacho.id);
          }

          // Generar facturas de forma concurrente (simular carga real)
          const promesasFacturas = despachosIds.map(id => 
            service.generateFromDespacho(id)
          );

          const facturas = await Promise.all(promesasFacturas);
          
          // Guardar IDs para limpieza
          facturas.forEach(f => createdFacturas.push(f.id));

          const numerosFactura = facturas.map(f => f.numero);

          // Property 1: Todos los números deben ser únicos (sin colisiones)
          const uniqueNumeros = new Set(numerosFactura);
          expect(uniqueNumeros.size).toBe(numerosFactura.length);

          // Property 2: Todos deben seguir el formato correcto
          const formatoRegex = /^FAC-\d{8}-\d{4}$/;
          for (const numero of numerosFactura) {
            expect(numero).toMatch(formatoRegex);
          }

          // Property 3: Los números del mismo día deben ser secuenciales
          const numerosPorDia = new Map<string, number[]>();
          
          for (const numero of numerosFactura) {
            const partes = numero.split('-');
            const fechaParte = partes[1];
            const secuencial = parseInt(partes[2]);

            if (!numerosPorDia.has(fechaParte)) {
              numerosPorDia.set(fechaParte, []);
            }
            numerosPorDia.get(fechaParte)!.push(secuencial);
          }

          // Verificar secuencialidad para cada día
          for (const [, secuenciales] of numerosPorDia) {
            if (secuenciales.length > 1) {
              secuenciales.sort((a, b) => a - b);
              
              // Verificar que son consecutivos
              for (let i = 1; i < secuenciales.length; i++) {
                const diferencia = secuenciales[i] - secuenciales[i - 1];
                expect(diferencia).toBe(1);
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
