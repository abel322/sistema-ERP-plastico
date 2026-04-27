# Guía Rápida: Crear Repositorio en GitHub

## Opción 1: Usando la interfaz web (MÁS FÁCIL)

### Paso 1: Crear el repositorio
1. Ve a: https://github.com/new
2. Completa:
   - **Repository name:** `erp-plasticos`
   - **Description:** `Sistema ERP para gestión de producción de plásticos - Next.js, Prisma, PostgreSQL`
   - **Visibilidad:** Private (recomendado) o Public
   - ⚠️ **NO marques:** README, .gitignore, ni license
3. Clic en **"Create repository"**

### Paso 2: Copiar tu usuario de GitHub
Después de crear el repo, verás una URL como:
```
https://github.com/TU_USUARIO/erp-plasticos.git
```
Copia tu **TU_USUARIO** (ejemplo: utrerabel, abelutrera, etc.)

### Paso 3: Ejecutar comandos
Abre **Git Bash** y ejecuta (reemplaza TU_USUARIO):

```bash
# Configurar Git globalmente (solo una vez)
git config --global user.name "Abel Utrera"
git config --global user.email "utrerabel619@gmail.com"

# Conectar con GitHub (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/erp-plasticos.git

# Renombrar rama a main
git branch -M main

# Subir código a GitHub
git push -u origin main
```

Cuando te pida credenciales:
- **Username:** Tu usuario de GitHub
- **Password:** Usa un **Personal Access Token** (no tu contraseña)

---

## Opción 2: Crear Personal Access Token (si te pide password)

Si Git te pide password al hacer push:

1. Ve a: https://github.com/settings/tokens
2. Clic en **"Generate new token"** → **"Generate new token (classic)"**
3. Configura:
   - **Note:** `ERP Plasticos - Git Access`
   - **Expiration:** 90 days (o lo que prefieras)
   - **Scopes:** Marca `repo` (todos los permisos de repositorio)
4. Clic en **"Generate token"**
5. **COPIA EL TOKEN** (solo se muestra una vez)
6. Usa ese token como password cuando Git te lo pida

---

## Verificar que funcionó

Después del push, ve a:
```
https://github.com/TU_USUARIO/erp-plasticos
```

Deberías ver todos tus archivos subidos.

---

## Comandos útiles después

```bash
# Ver estado del repositorio
git status

# Hacer cambios futuros
git add .
git commit -m "Descripción de los cambios"
git push

# Ver repositorio remoto configurado
git remote -v
```
