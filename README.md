# Sebastián Andrés Abadía Sánchez
# Juan Sebastián Almendra Pechene

# Mi semana — Lista de tareas

Aplicación web sencilla para organizar pendientes. Permite agregar, editar y eliminar tareas con fecha límite opcional, desglosarlas en pasos y marcar las tareas y sus pasos como completados.

También incluye una lista de contactos independiente, accesible desde **Lista de contactos**. Guarda nombre, apellido, teléfono, ciudad, dirección y género; permite editar o eliminar contactos y los conserva en el navegador.

## Cómo usar

Abre `tareas/index.html` en un navegador. Escribe una tarea, agrega una fecha si la necesitas y, opcionalmente, escribe sus pasos en el campo **Pasos**, uno por línea. Pulsa **Agregar tarea**. Usa **Editar** para cambiar el nombre, la fecha o los pasos de una tarea, o **Eliminar** y confirma para quitarla de la lista. Puedes marcar cada paso por separado; cuando todos estén completados, la tarea principal también se marcará como completada. Al marcar la tarea principal, todos sus pasos se marcarán a la vez.

## Archivos

- `tareas/index.html`: página de la lista de tareas.
- `tareas/css/styles.css`: estilos y diseño adaptable a celular y escritorio.
- `tareas/js/script.js`: creación, edición y eliminación de tareas y pasos, marcado de completado y actualización del progreso.
- `tareas/img/img.png`: imagen incluida en el panel de inspiración.
- `contactos/index.html`: formulario y lista de contactos.
- `contactos/css/styles.css`: estilos de la lista de contactos.
- `contactos/js/contactos.js`: funciones de contactos y almacenamiento local.

Las tareas se mantienen mientras la página está abierta; al recargar el navegador, la lista vuelve a iniciar vacía.

- Rediseño y estructuración del código con apoyo de Copilot SDK en VS Code, nuestro asistente de inteligencia artificial.