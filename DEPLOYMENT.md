# Guía de Deployment en Vercel

## ⚠️ SOLUCIÓN AL ERROR: routes-manifest.json

Si obtienes el error `ENOENT: no such file or directory, lstat '/vercel/path0/path0/.next/routes-manifest.json'`:

### Causa del problema:
- El build de Next.js no se completa correctamente
- Prisma client no se genera antes del build
- Configuración incorrecta en vercel.json

### Solución aplicada:

1. **Script de build mejorado**: `scripts/build-vercel.js`
2. **Configuración simplificada**: `vercel.json` y `next.config.js`
3. **Variables de entorno correctas** en Vercel Dashboard

## Variables de Entorno OBLIGATORIAS en Vercel

Ve a tu proyecto en Vercel → Settings → Environment Variables y agrega:

```
DATABASE_URL=postgresql://neondb_owner:npg_2GJXFQmbKhM9@ep-withered-band-an1ie58f-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require
NEXTAUTH_URL=https://tu-proyecto.vercel.app
NEXTAUTH_SECRET=vRGEpoOH2tubpToZXi12YWYmiUwk35C5
ABACUSAI_API_KEY=49a1c579791a47748bc6fe316442c094
```

**IMPORTANTE**: 
- Selecciona Production, Preview Y Development para cada variable
- Reemplaza `tu-proyecto.vercel.app` con tu URL real de Vercel

## Pasos para resolver el error:

### 1. Verificar variables de entorno
```bash
# Verifica que las variables estén configuradas en Vercel Dashboard
vercel env ls
```

### 2. Limpiar y redesplegar
```bash
# Eliminar vinculación actual si hay problemas
rm -rf .vercel

# Vincular al proyecto correcto
vercel link

# Deploy con build limpio
vercel --prod
```

### 3. Si persiste el error:
```bash
# Test local del build
npm run build:local

# Si funciona local, el problema son las variables de entorno en Vercel
```

## Comandos de deployment

```bash
# Para production (recomendado)
npm run deploy

# Para preview
npm run deploy:preview

# Build local para testing
npm run build:local
```

## Estructura de archivos importantes

```
scripts/
└── build-vercel.js     # Script de build robusto

vercel.json             # Configuración simplificada
.vercelignore          # Archivos a ignorar
next.config.js         # Configuración de Next.js
```

## Troubleshooting

### Error: "Prisma client not found"
- Verifica que `DATABASE_URL` esté configurada en Vercel
- El script de build genera automáticamente el cliente

### Error: "Build timeout"
- Las variables de entorno faltantes pueden causar timeouts
- Verifica que todas las variables estén configuradas

### Error: "Multiple projects"
- Elimina proyectos duplicados en Vercel Dashboard
- Usa `vercel link` para vincular al proyecto correcto