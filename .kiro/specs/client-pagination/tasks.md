# Plan de Implementación: Paginación de Clientes

## Resumen

Implementar controles de paginación en la interfaz de clientes para permitir la navegación eficiente a través de los registros. La API ya cuenta con soporte de paginación, por lo que el enfoque principal es agregar los controles de UI y conectarlos con la funcionalidad existente.

## Tareas

- [x] 1. Crear componente de controles de paginación
  - Crear componente reutilizable `PaginationControls` en `components/ui/`
  - Incluir botones de navegación (Primera, Anterior, Siguiente, Última)
  - Incluir selector de tamaño de página (10, 25, 50, 100 registros)
  - Incluir indicador de página actual y total de páginas
  - Mostrar información de registros (ej: "Mostrando 1-10 de 45 registros")
  - Aplicar estilos consistentes con el diseño existente (Tailwind CSS)
  - Hacer el componente responsive para móviles y tablets

- [x] 2. Integrar controles de paginación en la página de clientes
  - [x] 2.1 Agregar componente de paginación después de la tabla de clientes
    - Importar `PaginationControls` en `app/(protected)/clientes/page.tsx`
    - Posicionar controles debajo de la tabla (versión desktop)
    - Posicionar controles debajo de las tarjetas (versión móvil)
    - Pasar props necesarios: `page`, `totalPages`, `limit`, `total`, callbacks
  
  - [x] 2.2 Implementar handlers de navegación
    - Crear función `handlePageChange` para cambiar de página
    - Crear función `handleLimitChange` para cambiar tamaño de página
    - Asegurar que al cambiar el límite, la página se resetee a 1
    - Validar que no se pueda navegar más allá de los límites
  
  - [x] 2.3 Agregar estado para total de registros
    - Agregar estado `total` en el componente ClientesPage
    - Actualizar estado `total` cuando se reciban datos de la API
    - Pasar `total` al componente de paginación

- [x] 3. Mejorar experiencia de usuario durante la navegación
  - [x] 3.1 Agregar indicador de carga durante cambios de página
    - Mostrar spinner o skeleton mientras se cargan nuevos datos
    - Deshabilitar controles de paginación durante la carga
    - Mantener la tabla visible con overlay de carga
  
  - [x] 3.2 Preservar estado de búsqueda al paginar
    - Verificar que la búsqueda se mantenga al cambiar de página
    - Resetear a página 1 cuando cambie el término de búsqueda
    - Actualizar el total de páginas según resultados filtrados

- [x] 4. Checkpoint - Verificar funcionalidad completa
  - Probar navegación entre páginas (Primera, Anterior, Siguiente, Última)
  - Probar cambio de tamaño de página (10, 25, 50, 100)
  - Verificar que la búsqueda funcione correctamente con paginación
  - Verificar responsive en móvil, tablet y desktop
  - Asegurar que todos los controles estén deshabilitados apropiadamente
  - Confirmar que la información de registros sea precisa
  - Preguntar al usuario si hay dudas o ajustes necesarios

## Notas

- La API en `/api/clientes` ya soporta los parámetros `page`, `limit` y `busqueda`
- El componente debe ser reutilizable para otras secciones del sistema
- Los estilos deben seguir el sistema de diseño existente (gradientes purple/indigo)
- La paginación debe funcionar correctamente con la búsqueda existente
- Considerar accesibilidad: navegación por teclado y lectores de pantalla
