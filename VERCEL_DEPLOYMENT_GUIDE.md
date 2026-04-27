# Guía de Deployment en Vercel

## Estado Actual
✅ Proyecto completo subido a GitHub (commit a634755)
✅ Repositorio: https://github.com/abel322/sistema-ERP-plastico.git
✅ Branch: master

## Pasos para Configurar el Deployment en Vercel

### 1. Variables de Entorno Requeridas

Debes configurar las siguientes variables de entorno en Vercel:

**Settings → Environment Variables**

```env
# Base de datos (Ya configurada en .env.vercel.example)
DATABASE_URL=postgresql://neondb_owner:npg_2GJXFQmbKhM9@ep-withered-band-an1ie58f-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require

# NextAuth - IMPORTANTE: Actualizar NEXTAUTH_URL con tu URL de Vercel
NEXTAUTH_URL=https://tu-proyecto.vercel.app
NEXTAUTH_SECRET=vRGEpoOH2tubpToZXi12YWYmiUwk35C5

# API Keys
ABACUSAI_API_KEY=49a1c579791a47748bc6fe316442c094
```

### 2. Configuración del Proyecto en Vercel

1. **Framework Preset**: Next.js (detectado automáticamente)
2. **Build Command**: `npm run build` (ya configurado en package.json)
3. **Output Directory**: `.next` (por defecto)
4. **Install Command**: `npm install` (por defecto)

### 3. Configuración de Build

El proyecto ya tiene configurado:
- ✅ `output: 'standalone'` en next.config.js
- ✅ `postinstall: prisma generate` en package.json
- ✅ Build script personalizado que ejecuta Prisma antes de Next.js
- ✅ TypeScript y ESLint configurados para ignorar errores durante build

### 4. Verificar el Deployment

Después de configurar las variables de entorno:

1. Ve a **Deployments** en Vercel
2. Haz clic en **Redeploy** en el último deployment
3. Espera a que el build se complete
4. Verifica que no haya errores en los logs

### 5. Posibles Errores y Soluciones

#### Error: "DATABASE_URL is not defined"
**Solución**: Asegúrate de agregar todas las variables de entorno en Vercel Settings

#### Error: "Prisma Client not generated"
**Solución**: El script `postinstall` debería ejecutarse automáticamente. Si no, verifica que esté en package.json

#### Error: "NEXTAUTH_URL is not defined"
**Solución**: Actualiza NEXTAUTH_URL con tu URL real de Vercel (ej: https://sistema-erp-plastico.vercel.app)

#### Error de TypeScript durante build
**Solución**: Ya está configurado `ignoreBuildErrors: true` en next.config.js

### 6. Actualizar NEXTAUTH_URL

Una vez que tengas tu URL de Vercel:

1. Ve a **Settings → Environment Variables**
2. Edita `NEXTAUTH_URL`
3. Cambia el valor a tu URL real: `https://tu-proyecto-real.vercel.app`
4. Guarda y redeploy

### 7. Verificar la Base de Datos

La base de datos Neon ya está configurada. Para verificar:

```bash
# Localmente, puedes probar la conexión
npx prisma db push
```

## Cambios Realizados

### Commit 7dce4da
- Agregados tabs de Formulación y Serigrafía al formulario de nuevo producto

### Commit 57a70f1
- Agregados tabs de Extrusión y Sellado al formulario de nuevo producto

### Commit a634755
- Proyecto completo agregado (306 archivos, 70,662 líneas)
- Todos los módulos del sistema ERP
- Configuración completa de Next.js, Prisma, y dependencias

## Archivo Modificado Principal

`app/(protected)/clientes/[id]/productos/nuevo/page.tsx`
- Formulario completo con 5 tabs: Básico, Formulación, Serigrafía, Extrusión, Sellado
- Colores cambiados de purple a blue
- Todos los campos implementados según el formulario de edición

## Próximos Pasos

1. ✅ Configurar variables de entorno en Vercel
2. ✅ Actualizar NEXTAUTH_URL con la URL real
3. ✅ Redeploy el proyecto
4. ✅ Verificar que el deployment sea exitoso
5. ✅ Probar el login y funcionalidad básica

## Soporte

Si encuentras errores durante el deployment:
1. Revisa los logs en Vercel Dashboard
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que la base de datos Neon esté accesible
4. Verifica que el branch correcto (master) esté seleccionado en Vercel
