# Gestión Académica

Sistema web para la gestión de alumnos, secciones, actividades y calificaciones. Permite a los docentes organizar sus cursos, registrar notas por bimestre y competencia, importar/exportar datos en Excel y PDF, y gestionar sus cuentas de usuario.

---

## Alcance del Sistema

La plataforma ha sido diseñada para apoyar las actividades que forman parte del trabajo cotidiano del docente en el aula, el cual se enfoca en registrar evidencias de aprendizaje, evaluar competencias, identificar dificultades y realizar un seguimiento al progreso individual de cada estudiante. Tareas como el cálculo y gestión del orden de mérito, por ejemplo, no constituyen como actividades habituales del proceso de enseñanza-aprendizaje desarrollado por el docente, sino una función administrativa que generalmente es realizada por la dirección de la institución educativa mediante sistemas oficiales como SIAGIE, especialmente para la elaboración de reportes institucionales y reconocimientos académicos. Por ello, dicha funcionalidad se encuentra fuera del alcance del sistema propuesto.

---

## Características

- Registro e inicio de sesión con contraseña hasheada (bcrypt)
- Recuperación de contraseña por código de verificación por correo
- Gestión de cursos, secciones y alumnos
- Registro de calificaciones por bimestre y competencia (AD / A / B / C)
- Importación de alumnos desde archivo Excel
- Exportación de reportes a PDF y Excel
- Modo oscuro / modo claro
- Panel de administración: gestión de cuentas y bloqueo de usuarios
- Formulario de contacto con envío por correo
- Rate limiting, CORS y protección de rutas sensibles

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express |
| Base de datos | MySQL 8 |
| Autenticación | bcrypt + sesión por cabecera |
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

### 1. Clonar o descargar el proyecto

```bash
git clone <url-del-repositorio>
```

O descarga el ZIP desde GitHub y extráelo.

### 2. Abrir en Visual Studio Code

1. Abre VS Code
2. Ve a **Archivo → Abrir carpeta** (`Ctrl + K`, `Ctrl + O`)
3. Selecciona la carpeta del proyecto
4. Acepta la confianza del espacio de trabajo si se solicita

### 3. Abrir la terminal integrada

Presiona `` Ctrl + ` `` (acento grave) o ve a **Terminal → Nueva terminal**.

### 4. Instalar dependencias

En la terminal ejecuta:

```bash
npm install
```

### 5. Configurar la base de datos MySQL

#### 5.1 Crear la base de datos

Abre tu cliente MySQL (MySQL Workbench, HeidiSQL, terminal, etc.) y ejecuta:

Un archivo `schema.sql` que se encuntra al descargar el proyecto.

### 6. Configurar las variables de entorno

En el archivo `.env` en la raíz del proyecto con ajusta los valores a tu entorno:

```env
# ─── BASE DE DATOS ─────────────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=gestion_academica

# ─── SERVIDOR ──────────────────────────────────────────
PORT=3000
CORS_ORIGIN=http://localhost:3000

# ─── EMAIL (SMTP) ──────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=xxxx_xxxx_xxxx_xxxx

CONTACT_RECIPIENT=soporte@tu_dominio.com
```

> **Correo con Gmail:** debes crear una [Contraseña de aplicación](https://myaccount.google.com/apppasswords) en tu cuenta de Google y usarla en `SMTP_PASS`. La contraseña normal de Gmail no funciona con SMTP.

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
│   ├── *.html               # Páginas de la aplicación
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
│   │   └── security.js      # Bloqueo de rutas sensibles
│   ├── models/              # Modelos de datos (Usuario, Alumno, etc.)
│   ├── routes/              # Definición de rutas por dominio
│   └── services/            # Lógica de negocio
├── utils/
│   └── mailer.js            # Envío de correos con Nodemailer
├── db/
│   └── mysql.js             # Re-exportación para compatibilidad
├── tests/                   # Tests con Jest y Supertest
├── server.js                # Punto de entrada del servidor
├── package.json
└── .env                     # Variables de entorno (no subir a Git)
```

---

## Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/register` | Crear cuenta |
| POST | `/api/auth/change-password` | Cambiar contraseña |
| POST | `/api/auth/reset-password` | Restablecer contraseña |
| DELETE | `/api/auth/account` | Eliminar cuenta |
| GET | `/api/db` | Obtener datos del usuario |
| PUT | `/api/db` | Guardar datos del usuario |
| POST | `/api/export/excel` | Exportar notas a Excel |
| POST | `/api/import/excel` | Importar alumnos desde Excel |
| POST | `/api/contact` | Enviar mensaje de contacto |
| POST | `/api/send-code` | Enviar código de recuperación |
| GET | `/api/admin/stats` | Estadísticas (solo admin) |
| GET | `/api/admin/accounts` | Listar cuentas (solo admin) |
| PUT | `/api/admin/accounts/:id/status` | Bloquear / desbloquear cuenta (solo admin) |
| DELETE | `/api/admin/accounts/:id` | Eliminar cuenta (solo admin) |

---

## Seguridad

- Las contraseñas se almacenan con hash `bcrypt` (10 rondas)
- Las rutas `/api/admin/*` requieren rol `admin` verificado en base de datos
- Rate limiting: 20 intentos de login por 15 min, 5 envíos de correo por 15 min
- `Helmet` activa cabeceras de seguridad HTTP (CSP, HSTS, etc.)
- Los archivos del servidor (`/src/`, `/.env`, `/server.js`, etc.) no son accesibles desde el navegador
- El archivo `.env` está excluido del repositorio vía `.gitignore`

---

## Solución de problemas frecuentes

**`Error al conectar con MySQL`**
- Verifica que el servicio MySQL esté corriendo
- Comprueba usuario, contraseña y nombre de la base de datos en `.env`
- Asegúrate de que la base de datos `gestion_academica` exista

**Puerto 3000 en uso**
- Cambia el valor de `PORT` en `.env` (por ejemplo, `PORT=3001`) y accede a `http://localhost:3001`
