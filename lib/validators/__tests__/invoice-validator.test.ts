/**
 * Unit Tests for InvoiceValidator
 * 
 * Tests validation logic for invoice-related operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InvoiceValidator, DetalleFacturaInput } from '../invoice-validator';
import { prisma } from '../../db';
import { Factura, EstadoFactura } from '@prisma/client';

// Mock Prisma
vi.mock('../../db', () => ({
  prisma: {
    cliente: {
      findUnique: vi.fn()
    }
  }
}));

describe('InvoiceValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateClienteExists', () => {
    it('debe retornar true cuando el cliente existe', async () => {
      // Arrange
      (prisma.cliente.findUnique as any).mockResolvedValue({
        id: 'cliente-123'
      });

      // Act
      const result = await InvoiceValidator.validateClienteExists('cliente-123');

      // Assert
      expect(result).toBe(true);
      expect(prisma.cliente.findUnique).toHaveBeenCalledWith({
        where: { id: 'cliente-123' },
        select: { id: true }
      });
    });

    it('debe retornar false cuando el cliente no existe', async () => {
      // Arrange
      (prisma.cliente.findUnique as any).mockResolvedValue(null);

      // Act
      const result = await InvoiceValidator.validateClienteExists('cliente-inexistente');

      // Assert
      expect(result).toBe(false);
    });

    it('debe retornar false cuando hay un error de base de datos', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (prisma.cliente.findUnique as any).mockRejectedValue(
        new Error('Database connection error')
      );

      // Act
      const result = await InvoiceValidator.validateClienteExists('cliente-123');

      // Assert
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('canEdit', () => {
    it('debe permitir editar factura en estado Borrador', () => {
      // Arrange
      const factura = createMockFactura('Borrador');

      // Act
      const result = InvoiceValidator.canEdit(factura);

      // Assert
      expect(result).toBe(true);
    });

    it('debe permitir editar factura en estado Emitida', () => {
      // Arrange
      const factura = createMockFactura('Emitida');

      // Act
      const result = InvoiceValidator.canEdit(factura);

      // Assert
      expect(result).toBe(true);
    });

    it('debe NO permitir editar factura en estado Pagada', () => {
      // Arrange
      const factura = createMockFactura('Pagada');

      // Act
      const result = InvoiceValidator.canEdit(factura);

      // Assert
      expect(result).toBe(false);
    });

    it('debe NO permitir editar factura en estado Anulada', () => {
      // Arrange
      const factura = createMockFactura('Anulada');

      // Act
      const result = InvoiceValidator.canEdit(factura);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('validateDetalles', () => {
    it('debe validar correctamente detalles válidos', () => {
      // Arrange
      const detalles: DetalleFacturaInput[] = [
        {
          descripcion: 'Producto A',
          cantidad: 10,
          unidad: 'Unidades',
          precioUnitario: 5.5
        },
        {
          descripcion: 'Producto B',
          cantidad: 3.5,
          unidad: 'Kilogramos',
          precioUnitario: 10.0
        }
      ];

      // Act
      const result = InvoiceValidator.validateDetalles(detalles);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe rechazar array vacío de detalles', () => {
      // Arrange
      const detalles: DetalleFacturaInput[] = [];

      // Act
      const result = InvoiceValidator.validateDetalles(detalles);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Debe incluir al menos un detalle en la factura');
    });

    it('debe rechazar descripción vacía', () => {
      // Arrange
      const detalles: DetalleFacturaInput[] = [
        {
          descripcion: '',
          cantidad: 10,
          unidad: 'Unidades',
          precioUnitario: 5.5
        }
      ];

      // Act
      const result = InvoiceValidator.validateDetalles(detalles);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Detalle 1: La descripción es requerida');
    });

    it('debe rechazar descripción con solo espacios', () => {
      // Arrange
      const detalles: DetalleFacturaInput[] = [
        {
          descripcion: '   ',
          cantidad: 10,
          unidad: 'Unidades',
          precioUnitario: 5.5
        }
      ];

      // Act
      const result = InvoiceValidator.validateDetalles(detalles);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Detalle 1: La descripción es requerida');
    });

    it('debe rechazar cantidad cero', () => {
      // Arrange
      const detalles: DetalleFacturaInput[] = [
        {
          descripcion: 'Producto A',
          cantidad: 0,
          unidad: 'Unidades',
          precioUnitario: 5.5
        }
      ];

      // Act
      const result = InvoiceValidator.validateDetalles(detalles);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Detalle 1: La cantidad debe ser mayor a 0');
    });

    it('debe rechazar cantidad negativa', () => {
      // Arrange
      const detalles: DetalleFacturaInput[] = [
        {
          descripcion: 'Producto A',
          cantidad: -5,
          unidad: 'Unidades',
          precioUnitario: 5.5
        }
      ];

      // Act
      const result = InvoiceValidator.validateDetalles(detalles);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Detalle 1: La cantidad debe ser mayor a 0');
    });

    it('debe rechazar unidad vacía', () => {
      // Arrange
      const detalles: DetalleFacturaInput[] = [
        {
          descripcion: 'Producto A',
          cantidad: 10,
          unidad: '',
          precioUnitario: 5.5
        }
      ];

      // Act
      const result = InvoiceValidator.validateDetalles(detalles);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Detalle 1: La unidad es requerida');
    });

    it('debe rechazar precio unitario negativo', () => {
      // Arrange
      const detalles: DetalleFacturaInput[] = [
        {
          descripcion: 'Producto A',
          cantidad: 10,
          unidad: 'Unidades',
          precioUnitario: -5.5
        }
      ];

      // Act
      const result = InvoiceValidator.validateDetalles(detalles);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Detalle 1: El precio unitario debe ser mayor o igual a 0');
    });

    it('debe aceptar precio unitario cero (para facturas borrador)', () => {
      // Arrange
      const detalles: DetalleFacturaInput[] = [
        {
          descripcion: 'Producto A',
          cantidad: 10,
          unidad: 'Unidades',
          precioUnitario: 0
        }
      ];

      // Act
      const result = InvoiceValidator.validateDetalles(detalles);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe rechazar cantidad NaN', () => {
      // Arrange
      const detalles: DetalleFacturaInput[] = [
        {
          descripcion: 'Producto A',
          cantidad: NaN,
          unidad: 'Unidades',
          precioUnitario: 5.5
        }
      ];

      // Act
      const result = InvoiceValidator.validateDetalles(detalles);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Detalle 1: La cantidad no es un número válido');
    });

    it('debe rechazar precio unitario Infinity', () => {
      // Arrange
      const detalles: DetalleFacturaInput[] = [
        {
          descripcion: 'Producto A',
          cantidad: 10,
          unidad: 'Unidades',
          precioUnitario: Infinity
        }
      ];

      // Act
      const result = InvoiceValidator.validateDetalles(detalles);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Detalle 1: El precio unitario no es un número válido');
    });

    it('debe reportar múltiples errores en diferentes detalles', () => {
      // Arrange
      const detalles: DetalleFacturaInput[] = [
        {
          descripcion: '',
          cantidad: 10,
          unidad: 'Unidades',
          precioUnitario: 5.5
        },
        {
          descripcion: 'Producto B',
          cantidad: -3,
          unidad: '',
          precioUnitario: 10.0
        }
      ];

      // Act
      const result = InvoiceValidator.validateDetalles(detalles);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('Detalle 1: La descripción es requerida');
      expect(result.errors).toContain('Detalle 2: La cantidad debe ser mayor a 0');
      expect(result.errors).toContain('Detalle 2: La unidad es requerida');
    });

    it('debe validar correctamente detalles con valores decimales', () => {
      // Arrange
      const detalles: DetalleFacturaInput[] = [
        {
          descripcion: 'Producto A',
          cantidad: 10.5,
          unidad: 'Kilogramos',
          precioUnitario: 5.333
        }
      ];

      // Act
      const result = InvoiceValidator.validateDetalles(detalles);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

// Helper function to create mock Factura
function createMockFactura(estado: EstadoFactura): Factura {
  return {
    id: 'factura-123',
    numero: 'FAC-001',
    clienteId: 'cliente-123',
    fecha: new Date(),
    fechaVencimiento: null,
    subtotal: 100,
    iva: 16,
    total: 116,
    estado,
    metodoPago: null,
    observaciones: null,
    pagadaAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
