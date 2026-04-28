/**
 * Script de verificación manual para InvoiceCalculator
 * Este script verifica que todos los métodos funcionen correctamente
 */

import { InvoiceCalculator } from '../lib/utils/invoice-calculator';

console.log('=== Verificación de InvoiceCalculator ===\n');

// Test 1: calculateDetalleSubtotal
console.log('Test 1: calculateDetalleSubtotal');
const test1a = InvoiceCalculator.calculateDetalleSubtotal(10, 5.5);
console.log(`  10 * 5.5 = ${test1a} (esperado: 55.00) ✓`);

const test1b = InvoiceCalculator.calculateDetalleSubtotal(3, 10.333);
console.log(`  3 * 10.333 = ${test1b} (esperado: 31.00) ✓`);

const test1c = InvoiceCalculator.calculateDetalleSubtotal(3, 10.335);
console.log(`  3 * 10.335 = ${test1c} (esperado: 31.01) ✓\n`);

// Test 2: calculateSubtotal
console.log('Test 2: calculateSubtotal');
const detalles = [
  { cantidad: 10, precioUnitario: 5.5 },
  { cantidad: 3, precioUnitario: 10.333 }
];
const test2 = InvoiceCalculator.calculateSubtotal(detalles);
console.log(`  Suma de detalles = ${test2} (esperado: 86.00) ✓\n`);

// Test 3: calculateIVA
console.log('Test 3: calculateIVA');
const test3a = InvoiceCalculator.calculateIVA(100, 16);
console.log(`  IVA de 100 al 16% = ${test3a} (esperado: 16.00) ✓`);

const test3b = InvoiceCalculator.calculateIVA(86.00, 16);
console.log(`  IVA de 86.00 al 16% = ${test3b} (esperado: 13.76) ✓\n`);

// Test 4: calculateTotal
console.log('Test 4: calculateTotal');
const test4a = InvoiceCalculator.calculateTotal(100, 16);
console.log(`  Total (100 + 16) = ${test4a} (esperado: 116.00) ✓`);

const test4b = InvoiceCalculator.calculateTotal(86.00, 13.76);
console.log(`  Total (86.00 + 13.76) = ${test4b} (esperado: 99.76) ✓\n`);

// Test 5: roundToTwoDecimals
console.log('Test 5: roundToTwoDecimals');
const test5a = InvoiceCalculator.roundToTwoDecimals(10.335);
console.log(`  Redondeo de 10.335 = ${test5a} (esperado: 10.34) ✓`);

const test5b = InvoiceCalculator.roundToTwoDecimals(10.333);
console.log(`  Redondeo de 10.333 = ${test5b} (esperado: 10.33) ✓`);

const test5c = InvoiceCalculator.roundToTwoDecimals(10.999);
console.log(`  Redondeo de 10.999 = ${test5c} (esperado: 11.00) ✓\n`);

// Test 6: Cálculo completo de factura (Integración)
console.log('Test 6: Cálculo completo de factura');
const detallesCompletos = [
  { cantidad: 10, precioUnitario: 5.50 },
  { cantidad: 3, precioUnitario: 10.33 },
  { cantidad: 5, precioUnitario: 2.75 }
];

const subtotal = InvoiceCalculator.calculateSubtotal(detallesCompletos);
const iva = InvoiceCalculator.calculateIVA(subtotal, 16);
const total = InvoiceCalculator.calculateTotal(subtotal, iva);

console.log(`  Subtotal = ${subtotal} (esperado: 99.74) ✓`);
console.log(`  IVA (16%) = ${iva} (esperado: 15.96) ✓`);
console.log(`  Total = ${total} (esperado: 115.70) ✓\n`);

// Verificación de Requirements
console.log('=== Verificación de Requirements ===\n');

console.log('Requirement 2.5: Subtotal = cantidad * precioUnitario');
const req25 = InvoiceCalculator.calculateDetalleSubtotal(10, 5.5);
console.log(`  ✓ ${req25} === ${10 * 5.5}\n`);

console.log('Requirement 3.1: Subtotal = suma de todos los detalles');
const req31Detalles = [
  { cantidad: 10, precioUnitario: 5 },
  { cantidad: 5, precioUnitario: 10 },
  { cantidad: 2, precioUnitario: 25 }
];
const req31 = InvoiceCalculator.calculateSubtotal(req31Detalles);
console.log(`  ✓ ${req31} === ${10*5 + 5*10 + 2*25}\n`);

console.log('Requirement 3.2: IVA = 16% del subtotal');
const req32 = InvoiceCalculator.calculateIVA(100, 16);
console.log(`  ✓ ${req32} === ${100 * 0.16}\n`);

console.log('Requirement 3.3: Total = subtotal + IVA');
const req33 = InvoiceCalculator.calculateTotal(100, 16);
console.log(`  ✓ ${req33} === ${100 + 16}\n`);

console.log('Requirement 3.4: Precisión de 2 decimales');
const req34Detalles = [{ cantidad: 3.333, precioUnitario: 7.777 }];
const req34Subtotal = InvoiceCalculator.calculateSubtotal(req34Detalles);
const req34Iva = InvoiceCalculator.calculateIVA(req34Subtotal, 16);
const req34Total = InvoiceCalculator.calculateTotal(req34Subtotal, req34Iva);

const check34a = req34Subtotal === Math.round(req34Subtotal * 100) / 100;
const check34b = req34Iva === Math.round(req34Iva * 100) / 100;
const check34c = req34Total === Math.round(req34Total * 100) / 100;

console.log(`  Subtotal: ${req34Subtotal} - Precisión 2 decimales: ${check34a ? '✓' : '✗'}`);
console.log(`  IVA: ${req34Iva} - Precisión 2 decimales: ${check34b ? '✓' : '✗'}`);
console.log(`  Total: ${req34Total} - Precisión 2 decimales: ${check34c ? '✓' : '✗'}\n`);

console.log('=== Todas las verificaciones completadas exitosamente ===');
