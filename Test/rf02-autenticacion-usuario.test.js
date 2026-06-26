'use strict';

/**
 * ============================================================
 *  Requerimiento 2 — Autenticación de usuario
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1  – Datos vacíos en el formulario de inicio de sesión
 *    E2  – Cuenta bloqueada tras 5 intentos fallidos
 *    E3  – Cuenta desactivada por el administrador
 *    E4  – Cuenta eliminada (no existe en el sistema)
 *    E5  – Caso exitoso: inicio de sesión correcto
 */

// ================================================================
// MOCKS  (deben declararse antes de cualquier require)
// ================================================================

// Stub de la capa de base de datos — evita conexión real a MySQL
jest.mock('../db/mysql', () => ({
  getPool:     jest.fn(),
  buildDbJson: jest.fn().mockResolvedValue({}),
  saveDbJson:  jest.fn().mockResolvedValue(undefined),
  DB_CONFIG:   { host: 'localhost', database: 'test', user: 'test' },
}));

// Stub de acceso a datos de usuario
jest.mock('../src/dao/UsuarioDAO');

// Stub del módulo de correo — evita inicialización del transporte SMTP
jest.mock('../utils/mailer', () => ({
  transporter:           { verify: jest.fn().mockResolvedValue(true) },
  emailDomainExists:     jest.fn().mockResolvedValue(true),
  sendContactEmail:      jest.fn().mockResolvedValue({}),
  sendRegistrationEmail: jest.fn().mockResolvedValue({}),
  sendRecoveryEmail:     jest.fn().mockResolvedValue({}),
}));

// ================================================================
// IMPORTS
// ================================================================

const request    = require('supertest');
const bcrypt     = require('bcrypt');
const { app }    = require('../server');
const UsuarioDAO = require('../src/dao/UsuarioDAO');
const { getPool } = require('../db/mysql');

// ================================================================
// DATOS BASE DEL DOCENTE (compartidos entre pruebas)
// ================================================================

const USUARIO_BASE = {
  id:               'user_test_001',
  usuario:          'docente1',
  nombre_display:   'Docente Uno',
  correo:           'doc@mail.com',
  contrasena:       null,   // se completa en beforeAll con hash bcrypt
  rol:              'docente',
  activo:           1,
  intentos_fallidos: 0,
  bloqueado_hasta:  null,
};

beforeAll(async () => {
  // Hash con 1 ronda para que las pruebas sean rápidas
  USUARIO_BASE.contrasena = await bcrypt.hash('abc123', 1);
});

// ================================================================
// SETUP — se ejecuta antes de cada prueba
// ================================================================

beforeEach(() => {
  jest.clearAllMocks();

  // Conexión ficticia reutilizada por todos los servicios
  const mockConn = { query: jest.fn(), release: jest.fn() };
  getPool.mockReturnValue({
    getConnection: jest.fn().mockResolvedValue(mockConn),
  });

  // Por defecto: docente activo, sin bloqueos
  UsuarioDAO.findByUsername.mockResolvedValue({ ...USUARIO_BASE });
  UsuarioDAO.resetLoginAttempts.mockResolvedValue(undefined);
  UsuarioDAO.incrementFailedAttempts.mockResolvedValue(undefined);
  UsuarioDAO.updateLoginAttempts.mockResolvedValue(undefined);
  UsuarioDAO.updatePassword.mockResolvedValue(undefined);
});

// ================================================================
// FUNCIÓN AUXILIAR DE VALIDACIÓN DEL FORMULARIO
// Replica la lógica de doLogin() en login.js (capa frontend).
// Esta validación se ejecuta en el cliente ANTES de llamar a la API.
// ================================================================

/**
 * Valida los campos del formulario de inicio de sesión.
 * @returns {string|null} Mensaje de error, o null si todo es correcto.
 */
function validarFormularioLogin(username, password) {
  if (!username || !password) return 'Completa todos los campos';
  return null;
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 2 — Autenticación de usuario', () => {

  // --------------------------------------------------------------
  // E1 — Datos vacíos
  // Capa: frontend (login.js › doLogin)
  // --------------------------------------------------------------
  describe('E1 — Datos vacíos', () => {
    test('muestra "Completa todos los campos" cuando el formulario está vacío', () => {
      // Arrange
      const username = '';
      const password = '';

      // Act
      const resultado = validarFormularioLogin(username, password);

      // Assert
      expect(resultado).toBe('Completa todos los campos');
    });

    test('muestra "Completa todos los campos" cuando solo falta la contraseña', () => {
      // Arrange
      const username = 'docente1';
      const password = '';

      // Act
      const resultado = validarFormularioLogin(username, password);

      // Assert
      expect(resultado).toBe('Completa todos los campos');
    });

    test('muestra "Completa todos los campos" cuando solo falta el usuario', () => {
      // Arrange
      const username = '';
      const password = 'abc123';

      // Act
      const resultado = validarFormularioLogin(username, password);

      // Assert
      expect(resultado).toBe('Completa todos los campos');
    });
  });

  // --------------------------------------------------------------
  // E2 — Cuenta bloqueada tras 5 intentos fallidos
  // Capa: servidor (authService › login)
  // --------------------------------------------------------------
  describe('E2 — Cuenta bloqueada', () => {
    test('bloquea la cuenta en el 5° intento fallido y muestra mensaje de bloqueo', async () => {
      // Arrange: docente con 4 intentos fallidos previos
      UsuarioDAO.findByUsername.mockResolvedValue({
        ...USUARIO_BASE,
        intentos_fallidos: 4,
        bloqueado_hasta:   null,
      });

      // Act: 5° intento con contraseña incorrecta
      const respuesta = await request(app)
        .post('/api/auth/login')
        .send({ username: 'docente1', password: 'claveIncorrecta' });

      // Assert
      expect(respuesta.status).toBe(401);
      expect(respuesta.body.error).toBe('Demasiados intentos. Cuenta bloqueada por 15 minutos.');
    });

    test('rechaza el acceso e indica los minutos restantes cuando la cuenta ya está bloqueada', async () => {
      // Arrange: cuenta con bloqueo activo de 15 minutos
      UsuarioDAO.findByUsername.mockResolvedValue({
        ...USUARIO_BASE,
        intentos_fallidos: 5,
        bloqueado_hasta:   Date.now() + 15 * 60 * 1000,
      });

      // Act: intento de inicio de sesión con cuenta bloqueada
      const respuesta = await request(app)
        .post('/api/auth/login')
        .send({ username: 'docente1', password: 'abc123' });

      // Assert
      expect(respuesta.status).toBe(403);
      expect(respuesta.body.error).toMatch(/Cuenta bloqueada por intentos fallidos\. Intenta en \d+ min\./);
    });
  });

  // --------------------------------------------------------------
  // E3 — Cuenta desactivada por el administrador
  // Capa: servidor (authService › login)
  // --------------------------------------------------------------
  describe('E3 — Cuenta desactivada', () => {
    test('el servidor responde 403 con "Tu cuenta está desactivada. Contacta al administrador."', async () => {
      // Arrange: el administrador desactivó la cuenta del docente
      UsuarioDAO.findByUsername.mockResolvedValue({
        ...USUARIO_BASE,
        activo: 0,
      });

      // Act
      const respuesta = await request(app)
        .post('/api/auth/login')
        .send({ username: 'docente1', password: 'abc123' });

      // Assert
      expect(respuesta.status).toBe(403);
      expect(respuesta.body.error).toBe('Tu cuenta está desactivada. Contacta al administrador.');
    });
  });

  // --------------------------------------------------------------
  // E4 — Cuenta eliminada (no existe en el sistema)
  // Capa: servidor (authService › login)
  // --------------------------------------------------------------
  describe('E4 — Cuenta eliminada', () => {
    test('el servidor responde 401 cuando la cuenta no existe en la base de datos', async () => {
      // Arrange: la cuenta fue eliminada, findByUsername no encuentra ningún registro
      UsuarioDAO.findByUsername.mockResolvedValue(null);

      // Act
      const respuesta = await request(app)
        .post('/api/auth/login')
        .send({ username: 'docenteEliminado', password: 'abc123' });

      // Assert
      expect(respuesta.status).toBe(401);
      expect(respuesta.body.error).toBe('Usuario o contraseña incorrectos');
    });
  });

  // --------------------------------------------------------------
  // E5 — Caso exitoso: inicio de sesión correcto
  // Capa: servidor (authService › login)
  // --------------------------------------------------------------
  describe('E5 — Caso exitoso', () => {
    test('devuelve los datos del usuario cuando las credenciales son correctas', async () => {
      // Arrange: USUARIO_BASE ya tiene el hash de 'abc123' (generado en beforeAll)
      // No se necesita configuración extra — el beforeEach ya lo aplica por defecto

      // Act
      const respuesta = await request(app)
        .post('/api/auth/login')
        .send({ username: 'docente1', password: 'abc123' });

      // Assert
      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toMatchObject({
        id:          'user_test_001',
        username:    'docente1',
        displayName: 'Docente Uno',
        email:       'doc@mail.com',
        rol:         'docente',
      });
    });
  });

});
