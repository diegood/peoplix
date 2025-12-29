# Frontend Workload Management

Interfaz de usuario para el sistema de gestión de cargas de trabajo. Construido con Vue 3, Vite, TailwindCSS y Pinia.

## Configuración y Ejecución

1.  **Instalar Dependencias:**
    ```bash
    pnpm install
    ```

2.  **Iniciar Servidor de Desarrollo:**
    ```bash
    pnpm dev
    ```
    Disponible en `http://localhost:5173`.

3.  **Ejecutar Tests:**
    ```bash
    pnpm test
    ```

## Sistema de Cálculo de Estimaciones

El sistema de Gantt y estimaciones utiliza una lógica avanzada para calcular las fechas de finalización de las tareas basándose en la capacidad real de los colaboradores.

### Lógica Principal (`src/helper/Date.js` y `EstimationGantt.vue`)

1.  **Jornada Laboral y Capacidad:**
    *   Cada colaborador tiene un horario (`workingSchedule`) que define sus horas activas por día (ej. Lunes 09:00-18:00).
    *   Si no tiene horario personalizado, hereda el de la Organización.
    *   **Cálculo de Horas Reales**: Una tarea de "8 horas" no significa simplemente "hora inicio + 8 horas de reloj". El sistema "llena" los huecos disponibles en el horario del colaborador.
    *   *Ejemplo:* Si Juan trabaja de 09:00 a 13:00 (4h) los viernes. Una tarea de 8 horas que empieza el viernes a las 09:00, consumirá las 4 horas del viernes y continuará el lunes siguiente hasta completar las 4 horas restantes.

2.  **Festivos y Ausencias (`blockedDates`):**
    *   El sistema recupera los calendarios de festivos (nacionales/regionales) y las ausencias personales.
    *   Dichos días se marcan como "bloqueados" y el algoritmo de cálculo (`addWorkingDays`) salta automáticamente estos días sin consumir horas de la tarea.

3.  **Visualización en Gantt (Corrección Visual):**
    *   Aunque una tarea de 8 horas en un horario de 09:00 a 18:00 (con 1h de descanso implícita o rango de 9h) termina matemáticamente a las 17:00, visualmente se extiende hasta el final del día (23:59) para representar una "Jornada Completa".
    *   **Prevención de Solapamiento**: Al arrastrar tareas manualmente ("Drag & Drop"), el sistema detecta si la nueva posición choca con otra tarea existente del mismo colaborador y ajusta automáticamente la fecha de inicio para que sea consecutiva (después de la tarea anterior), evitando superposiciones.

## Estructura de Carpetas

El frontend sigue una arquitectura modular basada en "Modules":

```
frontend/
├── src/
│   ├── assets/             # Recursos estáticos (imágenes, css global)
│   ├── components/         # Componentes UI globales (Toast, Dialogs)
│   ├── config/             # Configuraciones (Apollo Client, Dayjs, Constantes)
│   ├── graphql/            # Queries/Mutations globales (o compartidas)
│   ├── helper/             # Utilidades puras (Date.js es CRÍTICO para cálculos)
│   ├── modules/            # Módulos Funcionales (Core de la app)
│   │   ├── Allocations/    # Gestión de Asignaciones y Estimaciones
│   │   │   ├── components/ # Componentes específicos (Gantt, Tablas)
│   │   │   ├── helpers/    # Lógica de cálculo específica de estimaciones
│   │   │   └── views/      # Vistas principales (Router pages)
│   │   ├── Auth/           # Autenticación y Usuarios
│   │   ├── Collaborators/  # Gestión de Colaboradores
│   │   ├── Configuration/  # Configuración (Estados, Horarios)
│   │   └── Projects/       # Gestión de Proyectos
│   ├── router/             # Definición de rutas (Vue Router)
│   ├── stores/             # Gestión de Estado Global (Pinia)
│   └── views/              # Vistas generales (Login, 404)
├── tests/                  # Configuración de tests
```
