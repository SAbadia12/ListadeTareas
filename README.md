# Mi semana: tareas, contactos y API REST

Aplicación web para organizar tareas y contactos. Las dos listas usan una API creada con Node.js y Express; la información se conserva en `data/store.json` y permanece después de reiniciar el servidor.

## Requisitos

- Node.js 18 o posterior.
- npm.

## Ejecutar

Desde la carpeta del proyecto, instala las dependencias e inicia el servidor:

```bash
# Windows PowerShell
npm.cmd install
npm.cmd start

# macOS/Linux (o Símbolo del sistema de Windows)
npm install
npm start
```

Abre <http://localhost:3000> para ver el menú de inicio y elegir entre tareas y contactos. También puedes abrir directamente <http://localhost:3000/tareas/> o <http://localhost:3000/contactos/>. Mantén la terminal abierta mientras usas la aplicación. En desarrollo también puedes iniciar con `npm.cmd run dev` en PowerShell o `npm run dev` en macOS/Linux; el servidor se reinicia cuando cambian sus archivos.

No abras los archivos HTML directamente: la interfaz necesita el servidor para comunicarse con la API. El archivo `data/store.json` se crea automáticamente y está excluido de Git para no publicar los datos personales guardados.

## API

Todas las respuestas y solicitudes de datos usan JSON. `GET /api` muestra las rutas disponibles.

| Método | Ruta | Acción |
| --- | --- | --- |
| GET | `/api/tasks` | Listar tareas |
| POST | `/api/tasks` | Crear tarea |
| PUT | `/api/tasks/:id` | Reemplazar una tarea |
| DELETE | `/api/tasks/:id` | Eliminar tarea |
| GET | `/api/contacts` | Listar contactos |
| POST | `/api/contacts` | Crear contacto |
| PUT | `/api/contacts/:id` | Reemplazar un contacto |
| DELETE | `/api/contacts/:id` | Eliminar contacto |

Ejemplo de tarea para `POST /api/tasks` y `PUT /api/tasks/:id`:

```json
{
  "title": "Preparar la entrega",
  "dueDate": "2026-11-25",
  "completed": false,
  "steps": [
    { "title": "Revisar los requisitos", "completed": false }
  ]
}
```

Ejemplo de contacto para `POST /api/contacts` y `PUT /api/contacts/:id`:

```json
{
  "firstName": "Ana",
  "lastName": "Pérez",
  "phone": "3001234567",
  "city": "Cali",
  "address": "Calle 1 # 2-3",
  "gender": "femenino"
}
```

Los identificadores los genera el servidor. Las rutas de creación responden con `201`, las de consulta y actualización con `200`, las de eliminación con `204`; los datos inválidos reciben `400` y los identificadores inexistentes `404`.

## Estructura

- `src/server.js`: servidor Express, validación, persistencia y rutas de la API.
- `inicio/`: menú inicial con accesos a tareas y contactos.
- `tareas/`: interfaz y cliente de la lista de tareas.
- `contactos/`: interfaz y cliente de la lista de contactos.
- `data/store.json`: almacenamiento local creado al iniciar el servidor; no se versiona.

## Aprendizajes

- Express permite definir rutas REST con los verbos HTTP `GET`, `POST`, `PUT` y `DELETE`.
- `express.json()` convierte el cuerpo JSON de una petición en datos que puede validar el servidor.
- `fetch` conecta el DOM con la API de forma asíncrona; la interfaz actualiza las listas usando las respuestas del servidor y muestra los errores.
- Validar los datos en el servidor protege la integridad de las tareas y los contactos, aunque el cliente también valide sus formularios.
- Guardar los datos en un archivo JSON permite conservarlos entre reinicios sin configurar una base de datos. Para una aplicación multiusuario o de producción convendría usar una base de datos.

## Uso de inteligencia artificial

Se utilizó GitHub Copilot en VS Code como apoyo para revisar la estructura existente, integrar la API con las interfaces y redactar esta documentación. Las decisiones de implementación se verificaron ejecutando la aplicación y probando las rutas HTTP de tareas y contactos.
