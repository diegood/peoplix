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
