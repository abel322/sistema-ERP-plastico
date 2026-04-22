# Requirements Document

## Introduction

Este documento define los requisitos para la funcionalidad de facturación automática en el sistema de gestión de producción. La funcionalidad permitirá generar automáticamente registros de facturación cuando los despachos sean marcados como "Entregado", y mostrará estadísticas avanzadas para análisis financiero.

## Glossary

- **Sistema_Facturación**: El módulo del sistema responsable de gestionar facturas y registros de facturación
- **Sistema_Despachos**: El módulo del sistema responsable de gestionar despachos de productos
- **Despacho**: Registro de envío de productos a un cliente con información de cantidad, destino y estado
- **Factura**: Documento comercial que registra una transacción de venta con detalles de productos, cantidades y valores
- **Detalle_Factura**: Línea individual dentro de una factura que describe un producto o servicio específico
- **Estado_Entregado**: Estado final de un despacho que indica que los productos fueron recibidos por el cliente
- **Estadísticas_Avanzadas**: Métricas calculadas sobre datos de facturación incluyendo totales, promedios y tendencias
- **Valor_Unitario**: Precio por unidad de producto
- **Valor_Total**: Monto total calculado como cantidad multiplicada por valor unitario

## Requirements

### Requirement 1: Generación Automática de Factura

**User Story:** Como usuario del sistema, quiero que se genere automáticamente una factura cuando un despacho sea marcado como entregado, para que no tenga que crear manualmente registros de facturación.

#### Acceptance Criteria

1. WHEN un Despacho es actualizado a Estado_Entregado, THE Sistema_Facturación SHALL crear una nueva Factura con estado "Emitida"
2. WHEN el Sistema_Facturación crea una Factura automática, THE Sistema_Facturación SHALL asignar un número de factura único secuencial
3. WHEN el Sistema_Facturación crea una Factura automática, THE Sistema_Facturación SHALL copiar la fecha de entrega del Despacho como fecha de la Factura
4. WHEN el Sistema_Facturación crea una Factura automática, THE Sistema_Facturación SHALL asociar la Factura con el Cliente del Despacho
5. IF un Despacho no tiene precioUnitario definido, THEN THE Sistema_Facturación SHALL crear la Factura con valores en cero y estado "Borrador"

### Requirement 2: Creación de Detalles de Factura

**User Story:** Como usuario del sistema, quiero que los detalles del despacho se transfieran automáticamente a la factura, para que toda la información relevante esté disponible en el registro de facturación.

#### Acceptance Criteria

1. WHEN el Sistema_Facturación crea una Factura automática, THE Sistema_Facturación SHALL crear un Detalle_Factura asociado
2. THE Detalle_Factura SHALL incluir la cantidad despachada del Despacho
3. THE Detalle_Factura SHALL incluir la unidad de medida del Despacho
4. THE Detalle_Factura SHALL incluir el precioUnitario del Despacho
5. THE Detalle_Factura SHALL calcular el subtotal como cantidad multiplicada por precioUnitario
6. THE Detalle_Factura SHALL incluir una descripción basada en el nombre del Cliente y tipo de producto
7. THE Detalle_Factura SHALL almacenar la referencia al despachoId de origen

### Requirement 3: Cálculo de Totales de Factura

**User Story:** Como usuario del sistema, quiero que los totales de la factura se calculen automáticamente, para que los valores sean precisos y consistentes.

#### Acceptance Criteria

1. WHEN el Sistema_Facturación crea una Factura automática, THE Sistema_Facturación SHALL calcular el subtotal como la suma de todos los subtotales de Detalle_Factura
2. WHEN el Sistema_Facturación calcula totales, THE Sistema_Facturación SHALL calcular el IVA como el 16% del subtotal
3. WHEN el Sistema_Facturación calcula totales, THE Sistema_Facturación SHALL calcular el total como subtotal más IVA
4. THE Sistema_Facturación SHALL almacenar subtotal, IVA y total en la Factura con precisión de dos decimales

### Requirement 4: Visualización de Facturas Generadas

**User Story:** Como usuario del sistema, quiero ver una lista de todas las facturas generadas automáticamente, para que pueda revisar y gestionar los registros de facturación.

#### Acceptance Criteria

1. THE Sistema_Facturación SHALL mostrar una tabla con todas las Facturas ordenadas por fecha descendente
2. THE tabla de Facturas SHALL mostrar las columnas: fecha, número de factura, cliente, cantidad de unidades, valor unitario, valor total y estado
3. THE Sistema_Facturación SHALL permitir filtrar Facturas por rango de fechas
4. THE Sistema_Facturación SHALL permitir filtrar Facturas por Cliente
5. THE Sistema_Facturación SHALL permitir filtrar Facturas por estado
6. WHEN un usuario hace clic en una Factura, THE Sistema_Facturación SHALL mostrar los detalles completos de la Factura

### Requirement 5: Estadísticas Avanzadas de Facturación

**User Story:** Como usuario del sistema, quiero ver estadísticas avanzadas sobre las facturas, para que pueda analizar el desempeño financiero y tomar decisiones informadas.

#### Acceptance Criteria

1. THE Sistema_Facturación SHALL mostrar el total facturado en el período actual en una tarjeta
2. THE Sistema_Facturación SHALL mostrar el número total de facturas emitidas en el período actual en una tarjeta
3. THE Sistema_Facturación SHALL mostrar el valor promedio por factura en el período actual en una tarjeta
4. THE Sistema_Facturación SHALL mostrar el total de facturas pendientes de pago en una tarjeta
5. THE Sistema_Facturación SHALL mostrar el cliente con mayor facturación en el período actual en una tarjeta
6. THE Sistema_Facturación SHALL mostrar la comparación porcentual con el período anterior para cada métrica
7. THE Sistema_Facturación SHALL actualizar las Estadísticas_Avanzadas cada vez que se crea o modifica una Factura
8. THE Sistema_Facturación SHALL permitir seleccionar el período de análisis (mes actual, trimestre, año, personalizado)

### Requirement 6: Notificación de Factura Generada

**User Story:** Como usuario del sistema, quiero recibir una notificación cuando se genere automáticamente una factura, para que esté informado de las nuevas transacciones registradas.

#### Acceptance Criteria

1. WHEN el Sistema_Facturación crea una Factura automática, THE Sistema_Facturación SHALL crear una notificación para usuarios con rol admin
2. THE notificación SHALL incluir el número de factura, nombre del cliente y valor total
3. THE notificación SHALL incluir un enlace directo a la Factura generada
4. THE notificación SHALL tener tipo "Sistema"

### Requirement 7: Manejo de Errores en Generación Automática

**User Story:** Como usuario del sistema, quiero que el sistema maneje correctamente los errores durante la generación automática de facturas, para que no se pierdan datos y pueda corregir problemas.

#### Acceptance Criteria

1. IF la creación de una Factura automática falla, THEN THE Sistema_Facturación SHALL registrar el error en los logs del sistema
2. IF la creación de una Factura automática falla, THEN THE Sistema_Despachos SHALL mantener el estado del Despacho como "EnTransito"
3. IF la creación de una Factura automática falla, THEN THE Sistema_Facturación SHALL crear una notificación de error para usuarios admin
4. WHEN un Despacho sin Cliente asociado es marcado como Entregado, THE Sistema_Facturación SHALL registrar un error y no crear Factura
5. THE Sistema_Facturación SHALL validar que el Cliente existe antes de crear la Factura

### Requirement 8: Edición de Facturas Generadas Automáticamente

**User Story:** Como usuario del sistema, quiero poder editar facturas generadas automáticamente, para que pueda corregir errores o actualizar información.

#### Acceptance Criteria

1. THE Sistema_Facturación SHALL permitir editar Facturas con estado "Borrador" o "Emitida"
2. THE Sistema_Facturación SHALL permitir modificar el precioUnitario en los Detalle_Factura
3. WHEN un usuario modifica un Detalle_Factura, THE Sistema_Facturación SHALL recalcular automáticamente subtotal, IVA y total
4. THE Sistema_Facturación SHALL no permitir editar Facturas con estado "Pagada" o "Anulada"
5. WHEN un usuario edita una Factura, THE Sistema_Facturación SHALL registrar la modificación en el log de actividad

### Requirement 9: Exportación de Datos de Facturación

**User Story:** Como usuario del sistema, quiero exportar los datos de facturación, para que pueda generar reportes externos o compartir información con contabilidad.

#### Acceptance Criteria

1. THE Sistema_Facturación SHALL permitir exportar la lista de Facturas a formato Excel
2. THE Sistema_Facturación SHALL permitir exportar la lista de Facturas a formato PDF
3. THE exportación SHALL incluir todas las columnas visibles en la tabla de Facturas
4. THE exportación SHALL respetar los filtros aplicados por el usuario
5. WHEN un usuario exporta datos, THE Sistema_Facturación SHALL registrar la acción en el log de actividad

### Requirement 10: Rendimiento del Sistema

**User Story:** Como usuario del sistema, quiero que la generación automática de facturas sea rápida, para que no afecte el rendimiento al marcar despachos como entregados.

#### Acceptance Criteria

1. WHEN un Despacho es marcado como Entregado, THE Sistema_Facturación SHALL completar la creación de la Factura en menos de 2 segundos
2. THE Sistema_Facturación SHALL cargar la lista de Facturas con paginación de 50 registros por página
3. THE Sistema_Facturación SHALL calcular las Estadísticas_Avanzadas en menos de 3 segundos
4. THE Sistema_Facturación SHALL utilizar índices de base de datos en las columnas fecha, clienteId y estado para optimizar consultas
