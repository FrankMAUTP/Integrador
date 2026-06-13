# Gestión Académica

Sistema web para la gestión de alumnos, secciones, actividades y calificaciones. Permite a los docentes organizar sus cursos, registrar notas por bimestre y competencia, importar/exportar datos en Excel y PDF, y administrar sus cuentas de usuario. Incluye un panel de administración para la gestión de cuentas y bloqueo de usuarios.

---

Alcance del Sistema
La plataforma ha sido diseñada para apoyar las actividades que forman parte del trabajo cotidiano del docente en el aula, el cual se enfoca en registrar evidencias de aprendizaje, evaluar competencias, identificar dificultades y realizar un seguimiento al progreso individual de cada estudiante. Tareas como el cálculo y gestión del orden de mérito, por ejemplo, no constituyen como actividades habituales del proceso de enseñanza-aprendizaje desarrollado por el docente, sino una función administrativa que generalmente es realizada por la dirección de la institución educativa mediante sistemas oficiales como SIAGIE, especialmente para la elaboración de reportes institucionales y reconocimientos académicos. Por ello, dicha funcionalidad se encuentra fuera del alcance del sistema propuesto.

---

## Características

- Registro e inicio de sesión con contraseña hasheada (bcrypt)
- Verificación de cuenta por código de correo electrónico (TTL de 10 minutos)
- Recuperación de contraseña por código de verificación por correo
- Gestión de cursos, secciones, alumnos y horarios
- Registro de calificaciones por bimestre y competencia (AD / A / B / C)
- Importación de alumnos desde archivo Excel
- Exportación de reportes a PDF y Excel
- Modo oscuro / modo claro
- Panel de administración: estadísticas, gestión y bloqueo de cuentas
- Formulario de contacto con envío por correo
- Rate limiting, CORS, Helmet y protección de rutas sensibles

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express |
| Base de datos | MySQL 8 |
| Autenticación | bcrypt + sesión por cabecera (`x-user-id`) |
| Correo | Nodemailer (SMTP) |
| Frontend | HTML, CSS, JavaScript vanilla |
| Exportación | jsPDF + jsPDF-AutoTable, ExcelJS |
| Seguridad | Helmet, express-rate-limit, CORS |
| Tests | Jest + Supertest |

---

## Requisitos previos

Antes de empezar, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) v18 o superior
- [MySQL](https://dev.mysql.com/downloads/mysql/) 8.0 o superior
- [Visual Studio Code](https://code.visualstudio.com/)
- Git (opcional, para clonar el repositorio)

---

## Instalación y ejecución en Visual Studio Code

### 1. descarga el ZIP desde GitHub y extráelo.

### 2. Abrir la carpeta extraida en Visual Studio Code

### 3. Instalar dependencias en la terminal

```bash
npm install
```

### 5. Configurar la base de datos MySQL

#### 5.2 Importar el esquema

El proyecto incluye el archivo `schema.sql` en la raíz con todas las tablas, índices y el usuario administrador por defecto. 

En mySQL Workbench, abre `schema.sql` y ejecútalo.

> **Credenciales por defecto del administrador:** usuario `admin`, contraseña `admin123`.

### 6. Configurar las variables de entorno

En el archivo `.env` en la raíz del proyecto con el siguiente contenido (ajusta los valores a tu entorno):

```env
# ─── BASE DE DATOS ─────────────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=gestion_academica

```


### 7. Ejecutar el servidor

```bash
npm start
```

Si todo está bien, verás en la terminal:

```
Conectado a MySQL: localhost/gestion_academica
Servidor corriendo en http://localhost:3000
```

### 8. Abrir la aplicación

Abre tu navegador y ve a:

```
http://localhost:3000
```

---

## Extensiones recomendadas para VS Code

Instálalas desde la pestaña **Extensiones** (`Ctrl + Shift + X`):

| Extensión | Para qué sirve |
|-----------|---------------|
| **ESLint** | Detección de errores en JavaScript |
| **Prettier** | Formateo automático de código |
| **REST Client** | Probar los endpoints de la API desde VS Code |
| **MySQL** (de cweijan) | Conectarse a la base de datos directamente desde VS Code |
| **DotENV** | Resaltado de sintaxis para archivos `.env` |

---


## Estructura del proyecto

```
├── public/                  # Frontend estático
│   ├── *.html               # Páginas de la aplicación (login, dashboard, secciones, etc.)
│   ├── css/                 # Hojas de estilo
│   ├── js/                  # Lógica del cliente
│   └── libs/                # jsPDF y AutoTable
├── src/
│   ├── app.js               # Configuración de Express
│   ├── config/
│   │   └── database.js      # Pool de conexiones MySQL
│   ├── controllers/         # Lógica de cada endpoint
│   ├── dao/                 # Acceso directo a la base de datos
│   ├── middleware/
│   │   ├── auth.js          # Verificación de rol admin
│   │   ├── rateLimiter.js   # Límite de peticiones por ruta
│   │   └── security.js      # Bloqueo de rutas del servidor
│   ├── models/              # Modelos de datos (Usuario, Alumno, Curso, etc.)
│   ├── routes/              # Definición de rutas por dominio
│   └── services/            # Lógica de negocio
├── utils/
│   └── mailer.js            # Envío de correos con Nodemailer
├── db/
│   └── mysql.js             # Re-exportación del pool para compatibilidad
├── server.js                # Punto de entrada del servidor
├── schema.sql               # Esquema completo de la base de datos
├── package.json
└── .env                     # Variables de entorno (no subir a Git)
```

---

## Páginas del frontend

| Página | Ruta |
|--------|------|
| Inicio de sesión | `/` |
| Dashboard | `/inicio.html` |
| Secciones | `/secciones.html` |
| Detalle de sección | `/seccionespecifica.html` |
| Lista de alumnos | `/alumnos.html` |
| Detalle de alumno | `/alumnoespecifico.html` |
| Horarios | `/horarios.html` |
| Cuenta de usuario | `/cuenta.html` |
| Contacto | `/contactanos.html` |
| Tutorial | `/tutorial.html` |
| Panel de admin | `/admin-dashboard.html` |
| Gestión de cuentas (admin) | `/admin-cuentas.html` |
| Cuentas bloqueadas (admin) | `/admin-bloqueadas.html` |

---

## Endpoints de la API

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/register` | Crear cuenta |
| POST | `/api/auth/change-password` | Cambiar contraseña (autenticado) |
| POST | `/api/auth/reset-password` | Restablecer contraseña tras recuperación |
| POST | `/api/auth/send-register-code` | Enviar código de verificación para registro |
| POST | `/api/auth/verify-register-code` | Verificar código y completar registro |
| POST | `/api/auth/send-recovery-code` | Enviar código de recuperación de contraseña |
| POST | `/api/auth/verify-recovery-code` | Verificar código de recuperación |
| DELETE | `/api/auth/account` | Eliminar cuenta (requiere contraseña) |

### Datos del usuario

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/db` | Obtener cursos, secciones, alumnos, actividades y notas |
| PUT | `/api/db` | Guardar / sincronizar datos del usuario |

### Importación y exportación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/export/excel` | Exportar notas a archivo Excel |
| POST | `/api/import/excel` | Importar alumnos desde archivo Excel |

### Correo y contacto

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/contact` | Enviar mensaje de contacto |
| POST | `/api/send-code` | Enviar código de verificación |

### Administración (solo rol `admin`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/stats` | Estadísticas del sistema |
| GET | `/api/admin/accounts` | Listar todas las cuentas |
| GET | `/api/admin/blocked` | Listar cuentas bloqueadas |
| PUT | `/api/admin/accounts/:id/status` | Bloquear o desbloquear cuenta |
| PUT | `/api/admin/accounts/:id/unblock` | Desbloquear cuenta explícitamente |
| DELETE | `/api/admin/accounts/:id` | Eliminar cuenta |

---

## Esquema de base de datos

Las tablas principales son:

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Cuentas de docentes y administradores |
| `cursos` | Cursos creados por cada docente |
| `competencias_curso` | Competencias por bimestre de cada curso |
| `salones` | Aulas (grado + letra, ej. 3°A) |
| `secciones` | Relación curso–aula con competencias asignadas |
| `horario_secciones` | Días y horarios de cada sección |
| `alumnos` | Estudiantes vinculados a un salón |
| `actividades` | Tareas y evaluaciones por sección y bimestre |
| `notas` | Calificaciones (AD / A / B / C) por alumno y actividad |
| `referencia_dias` | Catálogo de días de la semana |
| `referencia_franjas` | Franjas horarias disponibles (07:00–22:00) |

El esquema completo con índices y datos iniciales está en `schema.sql`.

---

## Seguridad

- Las contraseñas se almacenan con hash `bcrypt` (10–12 rondas)
- Las rutas `/api/admin/*` requieren rol `admin` verificado en base de datos en cada petición
- Bloqueo de cuenta tras 5 intentos de login fallidos (15 minutos de bloqueo)
- Rate limiting: 20 intentos de login por 15 min, 5 envíos de correo por 15 min (desactivado en entorno `test`)
- `Helmet` activa cabeceras de seguridad HTTP (CSP, HSTS, X-Frame-Options, etc.)
- Los archivos del servidor (`/src/`, `/.env`, `/server.js`, etc.) no son accesibles desde el navegador
- El archivo `.env` debe excluirse del repositorio vía `.gitignore`

---

## Solución de problemas frecuentes

**`Error al conectar con MySQL`**
- Verifica que el servicio MySQL esté corriendo
- Comprueba usuario, contraseña y nombre de la base de datos en `.env`
- Asegúrate de que la base de datos `gestion_academica` exista y el esquema esté importado

**Puerto 3000 en uso**
- Cambia el valor de `PORT` en `.env` (por ejemplo, `PORT=3001`) y accede a `http://localhost:3001`

**Error al enviar correos**
- Verifica que `SMTP_USER` y `SMTP_PASS` sean correctos
- Con Gmail, usa una [Contraseña de aplicación](https://myaccount.google.com/apppasswords), no tu contraseña habitual
- Asegúrate de que el acceso SMTP esté habilitado en tu cuenta de correo
