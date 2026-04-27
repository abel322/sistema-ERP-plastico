# Plan de Implementación: Sistema de Facturación Automática

## Overview

Este plan implementa el sistema de facturación automática que genera facturas cuando los despachos son marcados como "Entregado". La implementación incluye modificaciones al schema de Prisma, servicios de lógica de negocio, API endpoints, componentes React, y sistema de estadísticas con testing comprehensivo.

## Tasks

- [x] 1. Configurar schema de base de datos y migraciones
  - Agregar índices de optimización a modelos Factura y DetalleFactura en schema.prisma
  - Ejecutar migración de Prisma para aplicar cambios
  - _Requirements: 10.4_

- [ ] 2. Implementar utilidades de cálculo y validación
  - [x] 2.1 Crear InvoiceCalculator en lib/utils/invoice-calculator.ts
    - Implementar métodos para calcular subtotales, IVA, total y redondeo a 2 decimales
    - _Requirements: 2.5, 3.1, 3.2, 3.3, 3.4_
  
  - [x] 2.2 Escribir property test para InvoiceCalculator
    - **Property 6: Cálculo Correcto de Totales de Factura**
    - **Valida: Requirements 3.1, 3.2, 3.3, 3.4**
  
  - [x] 2.3 Escribir property test para cálculo de subtotales
    - **Property 4: Cálculo Correcto de Subtotales**
    - **Valida: Requirements 2.5**
  
  - [x] 2.4 Crear InvoiceValidator en lib/validators/invoice-validator.ts
    - Implementar validación de cliente existente, permisos de edición y validación de detalles
    - _Requirements: 7.5, 8.1, 8.4_
  
  - [x] 2.5 Escribir unit tests para InvoiceValidator
    - Probar validación de cliente inexistente, estados editables y no editables
    - _Requirements: 7.5, 8.1, 8.4_

- [ ] 3. Implementar servicios de facturación automática
  - [x] 3.1 Crear AutoInvoiceService en lib/services/auto-invoice.service.ts
    - Implementar generateFromDespacho, generateNextInvoiceNumber y validateDespacho
    - Manejar caso especial de despachos sin precioUnitario (estado Borrador)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  
  - [x] 3.2 Escribir property test para generación automática
    - **Property 1: Generación Automática de Factura al Entregar**
    - **Valida: Requirements 1.1, 1.5**
  
  - [x] 3.3 Escribir property test para unicidad de números
    - **Property 2: Unicidad y Secuencialidad de Números de Factura**
    - **Valida: Requirements 1.2**
  
  - [x] 3.4 Escribir property test para mapeo de datos
    - **Property 3: Mapeo Completo de Datos del Despacho**
    - **Valida: Requirements 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.7**
  
  - [x] 3.5 Escribir unit test para edge case de despacho sin precio
    - Verificar creación de factura en estado Borrador con valores en 0
    - _Requirements: 1.5_
  
  - [x] 3.6 Crear InvoiceNotificationService en lib/services/invoice-notification.service.ts
    - Implementar notifyInvoiceCreated, notifyInvoiceError y getAdminUsers
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.3_
  
  - [x] 3.7 Escribir property test para notificaciones
    - **Property 15: Creación de Notificación Completa**
    - **Valida: Requirements 6.1, 6.2, 6.3, 6.4**

- [x] 4. Checkpoint - Verificar servicios y utilidades
  - Ejecutar tests de servicios y utilidades, verificar que todos pasen
  - Preguntar al usuario si hay dudas o ajustes necesarios

- [ ] 5. Implementar API endpoint para actualización de despachos
  - [ ] 5.1 Modificar PUT /api/despachos/[id]/route.ts
    - Integrar AutoInvoiceService para generar factura al marcar como Entregado
    - Implementar transacción con rollback en caso de error
    - Manejar errores y crear notificaciones de error
    - _Requirements: 1.1, 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 5.2 Escribir property test para rollback en error
    - **Property 16: Rollback en Caso de Error**
    - **Valida: Requirements 7.2**
  
  - [ ] 5.3 Escribir property test para registro de errores
    - **Property 17: Registro de Errores**
    - **Valida: Requirements 7.1, 7.3**
  
  - [ ] 5.4 Escribir unit test para validación de cliente
    - **Property 18: Validación de Cliente Existente**
    - **Valida: Requirements 7.5**

- [ ] 6. Implementar API endpoints de facturas
  - [ ] 6.1 Crear GET /api/facturas/route.ts
    - Implementar paginación (50 registros por página)
    - Implementar filtros por estado, cliente y rango de fechas
    - Ordenar por fecha descendente
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 10.2_
  
  - [ ] 6.2 Escribir property test para ordenamiento
    - **Property 7: Ordenamiento de Facturas por Fecha**
    - **Valida: Requirements 4.1**
  
  - [ ] 6.3 Escribir property test para filtrado
    - **Property 8: Filtrado Correcto de Facturas**
    - **Valida: Requirements 4.3, 4.4, 4.5**
  
  - [ ] 6.4 Escribir property test para paginación
    - **Property 23: Paginación Correcta**
    - **Valida: Requirements 10.2**
  
  - [ ] 6.5 Crear POST /api/facturas/route.ts
    - Implementar creación manual de facturas con validaciones
    - Calcular totales automáticamente usando InvoiceCalculator
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 7.5_
  
  - [ ] 6.6 Crear PUT /api/facturas/[id]/route.ts
    - Implementar actualización de facturas con validación de estado
    - Recalcular totales al modificar detalles
    - Registrar modificación en log de actividad
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ] 6.7 Escribir property test para restricción de edición
    - **Property 19: Restricción de Edición por Estado**
    - **Valida: Requirements 8.1, 8.4**
  
  - [ ] 6.8 Escribir property test para recálculo automático
    - **Property 20: Recálculo Automático al Editar**
    - **Valida: Requirements 8.3**
  
  - [ ] 6.9 Escribir unit test para auditoría
    - **Property 21: Auditoría de Modificaciones**
    - **Valida: Requirements 8.5, 9.5**

- [ ] 7. Implementar API de estadísticas
  - [ ] 7.1 Crear GET /api/facturas/estadisticas/route.ts
    - Implementar cálculo de total facturado, número de facturas, promedio
    - Implementar cálculo de pendientes de pago y cliente top
    - Implementar comparación porcentual con período anterior
    - Soportar períodos: mes, trimestre, año, personalizado
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 10.3_
  
  - [ ] 7.2 Escribir property test para total facturado
    - **Property 9: Cálculo Correcto de Total Facturado**
    - **Valida: Requirements 5.1**
  
  - [ ] 7.3 Escribir property test para conteo de facturas
    - **Property 10: Conteo Correcto de Facturas**
    - **Valida: Requirements 5.2**
  
  - [ ] 7.4 Escribir property test para promedio
    - **Property 11: Cálculo Correcto de Promedio**
    - **Valida: Requirements 5.3**
  
  - [ ] 7.5 Escribir property test para pendientes de pago
    - **Property 12: Cálculo Correcto de Pendientes de Pago**
    - **Valida: Requirements 5.4**
  
  - [ ] 7.6 Escribir property test para cliente top
    - **Property 13: Identificación Correcta del Cliente Top**
    - **Valida: Requirements 5.5**
  
  - [ ] 7.7 Escribir property test para variación porcentual
    - **Property 14: Cálculo Correcto de Variación Porcentual**
    - **Valida: Requirements 5.6**

- [ ] 8. Checkpoint - Verificar APIs
  - Ejecutar tests de integración de APIs, verificar respuestas correctas
  - Preguntar al usuario si hay dudas o ajustes necesarios

- [ ] 9. Implementar API de exportación
  - [ ] 9.1 Crear GET /api/facturas/exportar/route.ts
    - Implementar exportación a Excel usando biblioteca apropiada
    - Implementar exportación a PDF usando biblioteca apropiada
    - Respetar filtros aplicados y columnas visibles
    - Registrar acción en log de actividad
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 9.2 Escribir property test para completitud de exportación
    - **Property 22: Completitud de Exportación**
    - **Valida: Requirements 9.3, 9.4**

- [ ] 10. Implementar componentes React de UI
  - [ ] 10.1 Crear TablaFacturas en components/facturas/tabla-facturas.tsx
    - Implementar tabla responsive con columnas especificadas
    - Agregar acciones: ver, editar, cambiar estado, eliminar
    - Mostrar datos formateados (fechas, montos)
    - _Requirements: 4.2, 4.6_
  
  - [ ] 10.2 Crear FiltrosFacturas en components/facturas/filtros-facturas.tsx
    - Implementar filtros por estado, cliente y rango de fechas
    - Agregar botón de limpiar filtros
    - _Requirements: 4.3, 4.4, 4.5_
  
  - [ ] 10.3 Crear EstadisticasFacturacion en components/facturas/estadisticas-facturacion.tsx
    - Implementar tarjetas de métricas con iconos
    - Mostrar indicadores de cambio porcentual (verde/rojo)
    - Agregar selector de período
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.8_
  
  - [ ] 10.4 Crear FormularioFactura en components/facturas/formulario-factura.tsx
    - Implementar formulario para crear/editar facturas
    - Agregar gestión dinámica de líneas de detalle
    - Implementar cálculo automático de totales en tiempo real
    - Agregar validación de campos
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ] 10.5 Crear página principal en app/(protected)/facturas/page.tsx
    - Integrar todos los componentes (estadísticas, filtros, tabla)
    - Implementar paginación con controles
    - Agregar modal para crear/editar facturas
    - Implementar manejo de estados de carga y errores
    - Agregar botones de exportación
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 9.1, 9.2_

- [ ] 11. Implementar generadores para property-based testing
  - [ ] 11.1 Crear arbitraries en __tests__/helpers/invoice-arbitraries.ts
    - Implementar despachoArbitrary para generar despachos válidos
    - Implementar detalleFacturaArbitrary para generar detalles
    - Implementar periodoArbitrary para generar períodos de análisis
    - Configurar fast-check con mínimo 100 iteraciones
    - _Requirements: Testing Strategy_

- [ ] 12. Checkpoint final - Integración completa
  - Ejecutar suite completa de tests (unit + property)
  - Verificar que todas las propiedades pasen con 100 iteraciones
  - Probar flujo completo: crear despacho → marcar entregado → verificar factura → ver estadísticas
  - Preguntar al usuario si hay ajustes finales necesarios

- [ ] 13. Integración y refinamiento
  - [ ] 13.1 Agregar navegación a facturas en menú principal
    - Actualizar componente de navegación para incluir enlace a /facturas
    - _Requirements: 4.1_
  
  - [ ] 13.2 Optimizar consultas de base de datos
    - Verificar uso de índices en queries frecuentes
    - Agregar eager loading donde sea necesario para evitar N+1
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [ ] 13.3 Agregar manejo de errores en UI
    - Implementar toast notifications para errores y éxitos
    - Agregar estados de carga en botones y formularios
    - _Requirements: 7.1, 7.2, 7.3_

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada property test debe ejecutarse con mínimo 100 iteraciones usando fast-check
- Los checkpoints permiten validar progreso incremental y resolver dudas
- La implementación usa TypeScript, Next.js 14 App Router, Prisma y PostgreSQL
- Todos los cálculos monetarios deben redondearse a 2 decimales
- Las transacciones de Prisma garantizan atomicidad en operaciones críticas
- El sistema debe completar la generación de facturas en menos de 2 segundos (Req 10.1)
