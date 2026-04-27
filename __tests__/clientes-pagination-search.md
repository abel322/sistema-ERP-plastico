# Test de Verificación: Preservación de Estado de Búsqueda en Paginación

## Objetivo
Verificar que la funcionalidad de búsqueda se mantiene correctamente al paginar y que la paginación se resetea al cambiar el término de búsqueda.

## Requisitos Verificados

### 1. La búsqueda se mantiene al cambiar de página ✅
**Implementación:**
- El estado `busqueda` está incluido en el array de dependencias del `useEffect` (línea 197)
- El parámetro `busqueda` se pasa a la API en cada llamada (línea 219)
- Al cambiar de página, el término de búsqueda se mantiene en la URL

**Código relevante:**
```typescript
useEffect(() => {
  fetchClientes();
}, [page, limit, busqueda]);

const fetchClientes = async () => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(busqueda && { busqueda }),
  });
  const res = await fetch(`/api/clientes?${params}`);
  // ...
};
```

### 2. Resetear a página 1 cuando cambie el término de búsqueda ✅
**Implementación:**
- El handler del input de búsqueda resetea la página a 1 (línea 453)

**Código relevante:**
```typescript
onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
```

### 3. Actualizar el total de páginas según resultados filtrados ✅
**Implementación:**
- La API retorna el total correcto basado en el filtro de búsqueda
- El componente actualiza `totalPages` y `total` con los valores de la API

**Código API (app/api/clientes/route.ts):**
```typescript
let whereClause: any = {};

if (busqueda) {
  whereClause = {
    OR: [
      { nombre: { contains: busqueda, mode: 'insensitive' } },
      { rif: { contains: busqueda, mode: 'insensitive' } },
    ],
  };
}

const [clientes, total] = await Promise.all([
  prisma.cliente.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy: { fechaRegistro: 'desc' },
  }),
  prisma.cliente.count({ where: whereClause }),
]);

return NextResponse.json({
  clientes,
  total,
  page,
  totalPages: Math.ceil(total / limit),
});
```

**Código componente:**
```typescript
const data = await res.json();
setClientes(data?.clientes || []);
setTotalPages(data?.totalPages || 1);
setTotal(data?.total || 0);
```

## Pasos de Verificación Manual

### Escenario 1: Búsqueda se mantiene al paginar
1. Abrir la página de clientes
2. Ingresar un término de búsqueda (ej: "empresa")
3. Verificar que se muestren resultados filtrados
4. Hacer clic en "Siguiente página"
5. **Resultado esperado:** Los resultados siguen filtrados por "empresa"

### Escenario 2: Página se resetea al cambiar búsqueda
1. Navegar a la página 2 o 3
2. Cambiar el término de búsqueda
3. **Resultado esperado:** La paginación vuelve a la página 1

### Escenario 3: Total de páginas se actualiza con búsqueda
1. Observar el total de páginas sin búsqueda
2. Ingresar un término de búsqueda que reduzca los resultados
3. **Resultado esperado:** El total de páginas se actualiza para reflejar solo los resultados filtrados

## Conclusión
✅ Todos los requisitos están correctamente implementados en el código.
