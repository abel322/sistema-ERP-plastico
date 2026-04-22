# 🚀 Guía para Desplegar en Vercel

## Método 1: Desde la Web (MÁS FÁCIL - RECOMENDADO)

### Paso 1: Ir a Vercel
1. Abre tu navegador
2. Ve a: **https://vercel.com**
3. Haz clic en **"Sign Up"** o **"Log In"**
4. Inicia sesión con tu cuenta de **GitHub**

### Paso 2: Importar el Proyecto
1. Una vez dentro, haz clic en **"Add New..."** → **"Project"**
2. Vercel te mostrará tus repositorios de GitHub
3. Busca **"sistema-ERP-plastico"**
4. Haz clic en **"Import"**

### Paso 3: Configurar el Proyecto
Vercel detectará automáticamente que es un proyecto Next.js.

**Framework Preset:** Next.js (detectado automáticamente)
**Root Directory:** ./ (dejar por defecto)
**Build Command:** `npm run build` (dejar por defecto)
**Output Directory:** .next (dejar por defecto)

### Paso 4: Configurar Variables de Entorno (MUY IMPORTANTE)
Antes de hacer clic en "Deploy", necesitas agregar las variables de entorno:

1. Expande la sección **"Environment Variables"**
2. Agrega estas variables una por una:

#### Variable 1: DATABASE_URL
```
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_2GJXFQmbKhM9@ep-withered-band-an1ie58f-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require
```

#### Variable 2: NEXTAUTH_URL
```
Name: NEXTAUTH_URL
Value: https://tu-proyecto.vercel.app
```
⚠️ **IMPORTANTE:** Después del primer deploy, actualiza esto con la URL real que te dé Vercel

#### Variable 3: NEXTAUTH_SECRET
```
Name: NEXTAUTH_SECRET
Value: vRGEpoOH2tubpToZXi12YWYmiUwk35C5
```

#### Variable 4: ABACUSAI_API_KEY
```
Name: ABACUSAI_API_KEY
Value: 49a1c579791a47748bc6fe316442c094
```

### Paso 5: Desplegar
1. Haz clic en **"Deploy"**
2. Espera 2-5 minutos mientras Vercel construye tu aplicación
3. ¡Listo! Vercel te dará una URL como: `https://sistema-erp-plastico.vercel.app`

### Paso 6: Actualizar NEXTAUTH_URL (IMPORTANTE)
1. Copia la URL que te dio Vercel
2. Ve a tu proyecto en Vercel → **Settings** → **Environment Variables**
3. Edita `NEXTAUTH_URL` y pon la URL real (ejemplo: `https://sistema-erp-plastico.vercel.app`)
4. Haz clic en **"Save"**
5. Ve a **"Deployments"** → Haz clic en los 3 puntos del último deployment → **"Redeploy"**

---

## Método 2: Usando Vercel CLI (Alternativo)

### Instalar Vercel CLI
```bash
npm install -g vercel
```

### Desplegar
```bash
# Iniciar sesión
vercel login

# Desplegar
vercel

# Seguir las instrucciones en pantalla
```

---

## ⚙️ Configuración Post-Despliegue

### 1. Sincronizar Base de Datos
Después del primer deploy, necesitas sincronizar el schema de Prisma:

```bash
# Opción A: Desde tu computadora local
npx prisma db push

# Opción B: Desde Vercel (en la terminal de tu proyecto)
# Ve a tu proyecto en Vercel → Settings → General → Build & Development Settings
# Agrega un script post-build
```

### 2. Crear Usuario Administrador
Una vez desplegado, ve a:
```
https://tu-proyecto.vercel.app/registro
```

Regístrate y luego ejecuta localmente:
```bash
npm run make-admin tu-email@ejemplo.com
```

O usa Prisma Studio:
```bash
npx prisma studio
```

---

## 🔧 Solución de Problemas

### Error: "Module not found"
- Verifica que todas las dependencias estén en `package.json`
- Ejecuta `npm install` localmente y haz commit de `package-lock.json`

### Error: "Database connection failed"
- Verifica que `DATABASE_URL` esté correctamente configurada en Vercel
- Asegúrate de que la base de datos Neon esté activa

### Error: "NEXTAUTH_URL is not defined"
- Ve a Settings → Environment Variables en Vercel
- Agrega `NEXTAUTH_URL` con la URL de tu proyecto

### Error de Build
- Revisa los logs en Vercel
- Verifica que `npm run build` funcione localmente

---

## 📊 Monitoreo

### Ver Logs
1. Ve a tu proyecto en Vercel
2. Clic en **"Deployments"**
3. Clic en el deployment activo
4. Ve a **"Functions"** para ver logs en tiempo real

### Analytics
Vercel te da analytics gratis:
- Visitas
- Rendimiento
- Errores

---

## 🔄 Actualizaciones Automáticas

Cada vez que hagas `git push` a tu repositorio de GitHub, Vercel automáticamente:
1. Detecta el cambio
2. Construye la nueva versión
3. Despliega automáticamente

```bash
# Hacer cambios
git add .
git commit -m "Descripción de cambios"
git push

# Vercel desplegará automáticamente
```

---

## 🌐 Dominio Personalizado (Opcional)

Si tienes un dominio propio:
1. Ve a tu proyecto en Vercel → **Settings** → **Domains**
2. Agrega tu dominio
3. Configura los DNS según las instrucciones de Vercel

---

## ✅ Checklist Final

- [ ] Proyecto importado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Primer deploy exitoso
- [ ] NEXTAUTH_URL actualizada con URL real
- [ ] Re-deploy después de actualizar NEXTAUTH_URL
- [ ] Base de datos sincronizada (prisma db push)
- [ ] Usuario administrador creado
- [ ] Aplicación funcionando correctamente

---

## 🆘 Ayuda Adicional

- Documentación de Vercel: https://vercel.com/docs
- Documentación de Next.js: https://nextjs.org/docs
- Documentación de Prisma: https://www.prisma.io/docs

---

**¡Tu aplicación ERP estará disponible 24/7 en la nube! 🎉**
