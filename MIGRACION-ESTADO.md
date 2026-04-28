# Estado de Migración: Cliente → Cliente + ProductoCliente

## 📅 Fecha: 26 de Abril, 2026
## 🎯 Objetivo: Separar Cliente de ProductoCliente para evitar duplicación

---

## ✅ COMPLETADO

### 1. Tabla ProductoCliente Creada
- ✅ Schema actualizado en `prisma/schema.prisma`
- ✅ Tabla `ProductoCliente` creada en base de datos con `prisma db push`
- ✅ Modelo Cliente mantiene campos antiguos temporalmente (para migración)

### 2. Archivos Creados
- ✅ `scripts/migrate-clientes-to-productos.ts` - Script de migración (CORREGIDO Y EJECUTADO)
- ✅ `scripts/verify-migration.ts` - Script de verificación
- ✅ `prisma/schema.prisma.new` - Backup del schema final
- ✅ `MIGRACION-ESTADO.md` - Este archivo de estado

### 3. Migración de Datos Completada ✅
- ✅ **31 clientes migrados exitosamente a ProductoCliente**
- ✅ Todos los productos tienen un cliente válido
- ✅ Datos verificados correctamente

**Ejemplos de productos migrados:**
- Corporación express - Bolsa transparente (43x72x15µ)
- pego icabaru - Saco blanco de pego 10kg (24x40x9µ)
- cafe la pastora - Café 36x60xC8 (36x60x8µ)
- Alimentos frigovia - bolsa impresa 1
- Alimentos frigovia - bolsa impresa 2 (mismo cliente, producto diferente)

### 3. Estructura Actual

**Cliente (temporal - con campos antiguos):**
```prisma
model Cliente {
  id              String   @id @default(cuid())
  nombre          String
  rif             String   @unique
  contacto        String?
  telefono        String?
  email           String?
  direccion       String?
  observaciones   String?
  
  // CAMPOS ANTIGUOS (se eliminarán después de migración)
  producto        String?
  tipoProducto    TipoProducto
  conImpresion    Boolean
  ancho           Float?
  largo           Float?
  calibre         Float?
  // ... todos los campos técnicos ...
  
  // Relaciones
  pedidos            Pedido[]
  despachos          Despacho[]
  muestras           Muestra[]
  facturas           Factura[]
  productosTerminados ProductoTerminado[]
}
```

**ProductoCliente (nuevo - ya creado):**
```prisma
model ProductoCliente {
  id              String   @id @default(cuid())
  clienteId       String
  nombreProducto  String   // "Bolsa 40cm", "Bolsa 41cm"
  codigoProducto  String?
  activo          Boolean  @default(true)
  
  // Todas las especificaciones técnicas
  tipoProducto    TipoProducto
  conImpresion    Boolean
  ancho           Float?
  largo           Float?
  calibre         Float?
  // ... todos los campos técnicos ...
  
  @@index([clienteId])
  @@index([activo])
}
```

---

## ⚠️ PROBLEMA RESUELTO ✅

### Error en Script de Migración (SOLUCIONADO)
El script `scripts/migrate-clientes-to-productos.ts` fallaba con:
```
ERROR: column "tipoProducto" is of type "TipoProducto" but expression is of type text
HINT: You will need to rewrite or cast the expression.
```

**Causa:** PostgreSQL requiere cast explícito para tipos ENUM cuando se usa SQL raw.

**Solución Aplicada:** ✅ Reescrito usando Prisma Client en lugar de SQL raw para manejar ENUMs automáticamente.

**Resultado:** ✅ 31 clientes migrados exitosamente a ProductoCliente

---

## 📊 DATOS EXISTENTES

- **31 clientes** en la base de datos
- Todos necesitan ser migrados a ProductoCliente
- Ejemplos de clientes:
  - Corporación express - Bolsa transparente
  - pego icabaru - Saco blanco de pego 10kg
  - cafe la pastora - Café 36x60xC8
  - Alimentos frigovia - bolsa impresa 1
  - Alimentos frigovia - bolsa impresa 2 (mismo cliente, producto diferente)

---

## 🔄 PRÓXIMOS PASOS

### ~~Paso 1: Corregir Script de Migración~~ ✅ COMPLETADO
~~Reescribir `scripts/migrate-clientes-to-productos.ts` usando Prisma Client~~

### ~~Paso 2: Ejecutar Migración~~ ✅ COMPLETADO
~~```bash
node --import tsx scripts/migrate-clientes-to-productos.ts
```~~

### ~~Paso 3: Verificar Datos~~ ✅ COMPLETADO
~~```bash
node --import tsx scripts/verify-migration.ts
```~~
**Resultado:** 31 productos migrados correctamente

### ~~Paso 4: Actualizar Referencias~~ ✅ COMPLETADO (NO NECESARIO)
~~Crear script `scripts/update-referencias.ts`~~
**Resultado:** No hay registros existentes en Pedidos, Producción, Despachos, Muestras ni ProductoTerminado. No se requiere actualización.

### ~~Paso 5: Aplicar Schema Final~~ ✅ COMPLETADO
~~```bash
cp prisma/schema.prisma.new prisma/schema.prisma
npx prisma db push --accept-data-loss
npx prisma generate
```~~
**Resultado:** 
- Schema final aplicado exitosamente
- Campos antiguos eliminados de Cliente
- Prisma Client regenerado
- Datos verificados: 31 clientes + 31 productos intactos

### Paso 6: Actualizar Interfaz de Clientes (SIGUIENTE)
Crear script `scripts/update-referencias.ts` para actualizar `productoClienteId` en:
- Pedidos
- Producción
- Despachos
- Muestras
- ProductoTerminado

**Estrategia:**
```typescript
// Para cada Pedido/Produccion/etc:
// 1. Obtener clienteId actual
// 2. Buscar el ProductoCliente correspondiente (primer producto del cliente)
// 3. Actualizar productoClienteId
```

### Paso 5: Aplicar Schema Final
Una vez verificado que todo funciona:
```bash
# Copiar schema final
cp prisma/schema.prisma.new prisma/schema.prisma

# Aplicar cambios (eliminará campos antiguos de Cliente)
npx prisma db push --accept-data-loss

# Regenerar Prisma Client
npx prisma generate
```

### Paso 6: Actualizar Interfaz de Clientes
Crear nueva UI para:
- Gestionar clientes (solo datos generales)
- Gestionar productos de cada cliente
- Selector en cascada: Cliente → Producto

### Paso 7: Actualizar API y Otros Módulos
- `app/api/clientes/route.ts` - API de clientes
- Pedidos, Producción, Despachos, etc. - Selector en cascada

---

## 📁 ARCHIVOS IMPORTANTES

### Schema
- `prisma/schema.prisma` - Schema actual (temporal con ambas estructuras)
- `prisma/schema.prisma.new` - Schema final (Cliente simplificado)

### Scripts
- `scripts/migrate-clientes-to-productos.ts` - Migración de datos (necesita corrección)
- `scripts/update-referencias.ts` - Actualizar referencias (por crear)

### Interfaces
- `app/(protected)/clientes/page.tsx` - UI actual de clientes (por actualizar)
- `app/api/clientes/route.ts` - API de clientes (por actualizar)

---

## 🎯 RESULTADO ESPERADO

### Antes (Actual):
```
Cliente: Frigovia (RIF: J-12345678)
  - Producto: Bolsa 40cm
  - Especificaciones: ancho=40, largo=60, calibre=10...

Cliente: Frigovia (RIF: J-12345678) [DUPLICADO]
  - Producto: Bolsa 41cm
  - Especificaciones: ancho=41, largo=60, calibre=10...
```

### Después (Objetivo):
```
Cliente: Frigovia (RIF: J-12345678)
  - Contacto: Juan Pérez
  - Teléfono: 0414-1234567
  
  Productos:
    1. Bolsa 40cm (ancho=40, largo=60, calibre=10...)
    2. Bolsa 41cm (ancho=41, largo=60, calibre=10...)
```

---

## 🚨 IMPORTANTE

1. **NO eliminar campos de Cliente** hasta completar la migración
2. **Hacer backup** antes de aplicar schema final
3. **Verificar datos** en ProductoCliente antes de continuar
4. **Probar en desarrollo** antes de aplicar en producción

---

## 📞 COMANDOS ÚTILES

```bash
# Ver clientes actuales
npx prisma studio

# Ejecutar migración (después de corregir)
node --import tsx scripts/migrate-clientes-to-productos.ts

# Verificar ProductoCliente
npx prisma studio
# Navegar a tabla ProductoCliente

# Aplicar schema final (SOLO después de verificar)
cp prisma/schema.prisma.new prisma/schema.prisma
npx prisma db push --accept-data-loss
```

---

## 💡 NOTAS

- La migración preserva TODOS los datos
- Cada cliente antiguo se convierte en un ProductoCliente
- Los datos generales del cliente se mantienen en Cliente
- Las relaciones se actualizan para usar productoClienteId
- La UI se actualiza para mostrar cliente → productos

---

**Estado:** ▶️ EN PROGRESO - Paso 6: Actualizar Interfaz de Clientes
**Siguiente acción:** Crear nueva UI para gestionar clientes y sus productos con selector en cascada
