# Debug: Error routes-manifest.json en Vercel

## Problema
```
ENOENT: no such file or directory, lstat '/vercel/path0/path0/.next/routes-manifest.json'
```

## Diagnóstico paso a paso

### 1. Verificar variables de entorno en Vercel
- [ ] DATABASE_URL configurada
- [ ] NEXTAUTH_SECRET configurada  
- [ ] ABACUSAI_API_KEY configurada
- [ ] NEXTAUTH_URL configurada (después del primer deploy)

### 2. Verificar configuración de build
- [ ] vercel.json simplificado
- [ ] next.config.js optimizado para Vercel
- [ ] Scripts de build separados

### 3. Pasos para resolver

#### Opción A: Deployment desde cero
1. Eliminar proyecto actual en Vercel
2. Crear nuevo proyecto con nombre único
3. Configurar variables de entorno
4. Hacer push para triggear build

#### Opción B: Forzar rebuild limpio
1. Ve a Vercel Dashboard → tu proyecto
2. Settings → Functions → Clear all cache
3. Deployments → Redeploy (sin cache)

#### Opción C: Verificar logs específicos
1. Ve a Deployment logs en Vercel
2. Busca errores específicos antes del error de routes-manifest
3. Común: errores de Prisma, variables de entorno, timeout

### 4. Configuración actual aplicada

```json
// vercel.json
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm ci --prefer-offline --no-audit"
}
```

```json
// package.json scripts
{
  "build": "npm run build:prisma && npm run build:next",
  "build:prisma": "prisma generate", 
  "build:next": "next build"
}
```

### 5. Checklist final
- [ ] Build local funciona: `npm run build:local`
- [ ] Variables en Vercel: Production + Preview + Development
- [ ] Proyecto único (no duplicados)
- [ ] Cache limpio en Vercel
- [ ] Logs revisados para errores específicos

### 6. Si nada funciona
Crear proyecto completamente nuevo en Vercel:
1. Nuevo repositorio o branch
2. Proyecto nuevo con nombre único
3. Variables desde cero
4. Deploy limpio