# Backend Workload Management

Este es el servidor Backend para el sistema de gestión de cargas de trabajo (Workload). Está construido con Node.js, GraphQL (Apollo Server) y Prisma ORM.

## Configuración Inicial

Para levantar el proyecto por primera vez, sigue estos pasos:

1.  **Instalar Dependencias:**
    Accede a la carpeta `backend` y ejecuta:
    ```bash
    pnpm install
    ```

2.  **Configurar Variables de Entorno:**
    Asegúrate de tener un archivo `.env` en la raíz de `backend` con la URL de tu base de datos PostgreSQL:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/workload_db?schema=public"
    ```

3.  **Desplegar Esquema de Base de Datos (Prisma):**
    Este proyecto utiliza Prisma para gestionar la base de datos.
    Para crear las tablas iniciales y aplicar cambios en el esquema:
    ```bash
    npx prisma db push
    ```
    *Nota: `db push` sincroniza el esquema con la base de datos sin necesidad de migraciones formales (ideal para prototipado).*

4.  **Sembrar Datos Iniciales (Seed):**
    Para poblar la base de datos con usuarios, roles y datos esenciales:
    ```bash
    node prisma/seed.js
    ```

5.  **Iniciar el Servidor:**
    ```bash
    pnpm dev
    ```
    El servidor estará disponible en `http://localhost:4000/graphql`.

## Comandos de Prisma

*   **Sincronizar DB con Schema:** `npx prisma db push`
*   **Ver Datos (Prisma Studio):** `npx prisma studio` (Abre una interfaz web en localhost:5555)
*   **Generar Cliente:** `npx prisma generate` (Necesario si cambias el schema pero no lo detecta el código).

## Logging y Monitoreo

El backend utiliza **Pino** como logger (integrado en Fastify) con **pino-pretty** para un formato legible en desarrollo.

### Niveles de Log

- `debug`: Todos los logs (desarrollo)
- `info`: Info + Warnings + Errores (producción por defecto)
- `warn`: Solo warnings y errores
- `error`: Solo errores

### Configurar Logs en Desarrollo

En local, los logs se muestran coloridos y formateados:

```bash
pnpm dev
# Verás logs tipo:
# 📖 QUERY: GetUser
# 🔄 MUTATION: CreateTask
# duration: 45ms
```

Para cambiar nivel de logs en desarrollo (sin reiniciar):

```bash
export LOG_LEVEL=debug    # Máximo detalle
export LOG_LEVEL=info     # Normal
export LOG_LEVEL=warn     # Solo advertencias
```

### PM2 en Producción

Usamos **PM2** para gestionar procesos y logs en producción. La configuración está en `ecosystem.config.js` en la raíz del proyecto.

**Iniciar con PM2:**

```bash
# Con logs en nivel producción (info)
cd /var/logs/peoplix
pm2 start ecosystem.config.js

# Con logs en desarrollo (debug)
pm2 start ecosystem.config.js --env development
```

**Cambiar nivel de logs en vivo (sin reiniciar):**

```bash
# Activar modo debug
pm2 restart backend --update-env -- LOG_LEVEL=debug

# Volver a modo info
pm2 restart backend --update-env -- LOG_LEVEL=info

# Solo errores
pm2 restart backend --update-env -- LOG_LEVEL=error
```

**Ver logs en tiempo real:**

```bash
pm2 logs backend              # Solo backend
pm2 logs backend --lines 100  # Últimas 100 líneas
pm2 logs                      # Todos los procesos
```

**Ver archivos de logs:**

```bash
# Logs de salida (stdout)
tail -f /var/logs/peoplix/logs/backend-out.log

# Logs de error (stderr)
tail -f /var/logs/peoplix/logs/backend-error.log
```

### Llamadas GraphQL en Logs

Todas las llamadas GraphQL (queries, mutations, subscriptions) se logean automáticamente con:

- **Operación**: Nombre de la query/mutation (ej: `GetUser`, `CreateTask`)
- **Tipo**: QUERY | MUTATION | SUBSCRIPTION
- **Usuario**: ID del usuario autenticado (o "Anonymous")
- **Status HTTP**: 200, 400, 500, etc.
- **Duración**: Tiempo total en ms
- **Variables**: Parámetros enviados (en debug)

Ejemplo en logs:

```
ⓘ 2026-01-12T10:30:45.123Z
  operation: "GetUser"
  type: "QUERY"
  user: "User#123"
  status: 200
  duration: "45ms"
  📖 QUERY: GetUser
```

## Estructura de Carpetas

La estructura del backend está organizada para ser modular y escalable usando GraphQL:

```
backend/
├── prisma/                 # Configuración de base de datos
│   ├── schema/             # Definiciones de modelos (Schema) divididos por ficheros
│   │   ├── base.prisma     # Configuración base y generador
│   │   ├── User.prisma     # Modelo de usuario
│   │   ├── ...             # Otros modelos
│   └── seed.js             # Script para datos iniciales
├── src/
│   ├── graphql/            # Definiciones de Tipos (Schemas GraphQL)
│   │   ├── typedefs/       # Type definitions (.js o .graphql)
│   │   └── resolvers/      # Resolvers (Lógica de la API)
│   ├── interfaces/         # Interfaces de entrada (HTTP, etc)
│   │   ├── http/           # Configuración del servidor (Apollo/Express)
│   │   └── graphql/        # (Legacy/Alternativo) Estructura de schemas
│   ├── services/           # Lógica de negocio (opcional, si se separa de resolvers)
│   └── utils/              # Funciones de utilidad
├── tests/                  # Tests unitarios e integración
├── index.js                # Punto de entrada de la aplicación
└── package.json            # Dependencias y scripts
```
