# Workload Management System

Sistema monorepo de gestión de cargas de trabajo con backend GraphQL y frontend Vue 3.

## 🚀 Setup Inicial

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd workload
```

### 2. Instalar dependencias

Esto instalará automáticamente Husky en el root:

```bash
pnpm install
```

**Nota:** El script `postinstall` ejecutará automáticamente `husky install` para configurar los Git hooks.

### 3. Instalar dependencias de backend y frontend

```bash
cd backend && pnpm install
cd ../frontend && pnpm install
cd ..
```

O usa el script rápido:

```bash
pnpm run install:all
```

## 🔧 Desarrollo

### Backend

```bash
cd backend
pnpm dev
```

### Frontend

```bash
cd frontend
pnpm dev
```

### Ambos simultáneamente

```bash
pnpm run dev
```

## 📦 Build

### Backend

```bash
cd backend
pnpm run build
```

### Frontend

```bash
cd frontend
pnpm run build
```

### Ambos

```bash
pnpm run build
```

## 🤖 Git Hooks (Husky)

Automáticamente, cada vez que hagas `git commit`, se ejecutarán:

- **Bump de versión patch** en `backend/package.json` y `frontend/package.json`
- Los cambios de versión se agregan automáticamente al commit

Ejemplo:

```bash
git commit -m "Fix login bug"

# Automáticamente:
# 📦 Bumping patch version...
# backend/package.json: 1.0.0 → 1.0.1
# frontend/package.json: 0.0.1 → 0.0.2
# 🎉 Version bumped successfully
```

Para deshabilitar temporalmente (si necesitas):

```bash
git commit --no-verify -m "Mensaje"
```

## 📝 Documentación por componente

- [Backend](./backend/README.md) - GraphQL, Prisma, Logging
- [Frontend](./frontend/README.md) - Vue 3, Vite, Apollo Client

## 📍 Conectarse al Servidor Gcloud

```bash
gcloud compute ssh backend-server-1 --zone=us-central1-c
```
