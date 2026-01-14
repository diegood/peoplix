# Contexto del Proyecto para Asistentes de IA

Este documento describe la arquitectura, patrones y convenciones del proyecto `workload` para guiar a los agentes de IA en la generación y mantenimiento de código.

## 1. Visión General del Proyecto

*   **Nombre**: Workload Management System
*   **Objetivo**: Gestión de carga de trabajo, asignación de proyectos, matrices RASCI y requerimientos funcionales.
*   **Stack Tecnológico**:
    *   **Backend**: Node.js (Fastify + Mercurius), Prisma ORM, PostgreSQL.
    *   **Frontend**: Vue 3 (Composition API), TailwindCSS.
    *   **Testing**: Vitest.
    *   **Lenguaje**: Javascript (ES Modules).

## 2. Arquitectura del Backend (`/backend`)

El backend sigue una arquitectura en capas (Clean Architecture simplificada):

*   **`src/interfaces/graphql`**: Capa de entrada. Define el esquema GraphQL.
    *   **`typedefs/`**: Definiciones de tipos (`.js` exportando `gql`).
    *   **`resolvers/`**: Lógica de resolución. **No debe contener lógica de negocio compleja**, solo llamar a servicios.
*   **`src/application/services`**: Lógica de negocio pura.
    *   Clases `Service` que orquestan operaciones y validaciones.
    *   Ejemplo: `ResponsibilityService.js`.
*   **`src/infrastructure/repositories`**: Acceso a datos.
    *   Uso directo de Prisma Client.
    *   Patrón Repository para desacoplar la base de datos.
    *   Ejemplo: `PrismaResponsibilityRepository.js`.
*   **`src/infrastructure/database`**: Configuración de clientes (Prisma, PG).

### Convenciones Backend
*   **Prisma Generación**: Al modificar `schema.prisma`, ejecutar `npx prisma generate` y reiniciar el servidor.
*   **Testing**: Tests unitarios en `services/__tests__` y tests de integración de resolvers en `resolvers/__tests__`. Usar `vitest`.
*   **Errores**: Usar excepciones estándar que GraphQL capturará.

## 3. Arquitectura del Frontend (`/frontend`)

El frontend está migrando hacia una arquitectura modular basada en dominios funcionales.

*   **`src/modules/`**: Directorio principal para nuevas funcionalidades.
    *   Estructura de Módulo:
        *   `components/`: Componentes Vue específicos del módulo.
        *   `views/`: Vistas/Páginas principales.
        *   `graphql/`: Queries y Mutations extraídos en archivos `.js`. **No definir queries dentro de componentes .vue**.
        *   `composables/` (Opcional): Lógica reutilizable.
    *   Ejemplo: `src/modules/Rasci/`.
*   **`src/components/`**: Componentes genéricos/compartidos o heredados (Legacy). Evitar agregar nueva lógica de negocio aquí si pertenece a un módulo.

### Convenciones Frontend
*   **Queries GraphQL**:
    *   Definir en `src/modules/[Modulo]/graphql/[archivo].js`.
    *   Importar en el componente Vue.
    *   Usar `useQuery` de `@vue/apollo-composable`.
    *   Manejar errores explícitamente (`onError`).
*   **Componentes**:
    *   `<script setup>`.
    *   TailwindCSS para estilos.
    *   Evitar lógica excesiva en el template.

## 4. Funcionalidades Clave

### Matriz RASCI
*   **Modelo**: `Responsibility` (Prisma). Relaciona `allocation`, `workPackage`, `functionalRequirement` y `role` (Enum: R, A, S, C, I).
*   **Frontend**: `RasciMatrix.vue` (Grid principal) y `RasciCell.vue` (Celda interactiva). Ubicados en `src/modules/Rasci`.

### Jerarquía
*   Gestión de supervisores y subordinados entre `Allocations`.
*   Visualización dual: Arbol y Lista.

## 5. Flujo de Trabajo para el Agente

1.  **Entender la Petición**: Identificar si es Backend, Frontend o ambos.
2.  **Identificar Módulos Afectados**: Buscar en `src/modules` primero.
3.  **Backend Changes**:
    *   Modificar Prisma Schema -> `generate` -> Crear Repository -> Crear/Actualizar Service -> Actualizar GQL TypeDefs y Resolvers -> Tests.
4.  **Frontend Changes**:
    *   Crear/Modificar GQL (js externo) -> Crear/Modificar Componentes (`src/modules`) -> Integrar en Vistas.
5.  **Verificación**:
    *   Ejecutar tests (`pnpm test` en backend).
    *   Verificar linter.
    *   Verificar que los tests de autorización (`auth.directive.test.js` y específicos de entidad) pasen.

## 6. Seguridad y Autorización

El sistema utiliza un sistema de autorización declarativo basado en directivas de esquema GraphQL.

### Directiva `@auth`

*   **Definición**: `directive @auth(requires: AuthRole = ADMIN, sameUser: String) on OBJECT | FIELD_DEFINITION`
*   **Roles (`AuthRole`)**:
    *   `USER`: Usuario autenticado.
    *   `ADMIN`: Administrador de la organización (SystemRole = 1) o Super Admin.
    *   `SUPER_ADMIN`: Super Administrador (Flag `isSuperAdmin`).
*   **Argumentos**:
    *   `requires`: Rol mínimo requerido.
    *   `sameUser`: (Opcional) Permite acceso a usuarios con rol menor si el recurso les pertenece.
        *   Valor: Nombre del argumento de la query/mutation que contiene el ID del usuario.
        *   Ejemplo: `@auth(requires: ADMIN, sameUser: "collaboratorId")` permite a un usuario normal acceder si `args.collaboratorId` coincide con su ID.

### Patrones de Implementación

1.  **Protección por Defecto**: Aplicar `@auth(requires: USER)` a queries y `@auth(requires: ADMIN)` a mutaciones sensibles.
2.  **Validación en Schema**: Evitar validaciones manuales de rol (`checkAdmin`) en resolvers; confiar en la directiva.
3.  **Lógica Compleja**: Para reglas de negocio específicas (ej: desbloquear requerimiento) que dependen del estado del objeto, usar lógica en el Servicio (`Service`) recibiendo el contexto `user`, además de la directiva base.


---
*Documento generado automáticamente para contexto de IA. Mantener actualizado.*
