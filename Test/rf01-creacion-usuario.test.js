'use strict';

/**
 * ============================================================
 *  Requerimiento 1 — Creación de usuario
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1  – Campos del formulario vacíos
 *    E2  – Formato de correo inválido
 *    E3  – Contraseñas no coinciden
 *    E4  – Correo ya registrado (validación de servidor)
 *    E5  – Nombre de usuario ya en uso (validación de servidor)
 *    E6  – Contraseña demasiado corta
 *    E7  – Nombre de usuario demasiado corto
 *    E8  – Código de verificación incorrecto (validación de servidor)
 *    E9  – Código de verificación vacío o incompleto
 *    E10 – Caso exitoso: registro completo
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

// Stub del servicio de email — evita envío real de correos
jest.mock('../src/services/emailService');

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

const request      = require('supertest');
const { app }      = require('../server');
const UsuarioDAO   = require('../src/dao/UsuarioDAO');
const emailService = require('../src/services/emailService');
const { getPool }  = require('../db/mysql');

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

  // Por defecto: usuario y correo disponibles en la BD
  UsuarioDAO.checkUsernameExists.mockResolvedValue(false);
  UsuarioDAO.checkEmailExists.mockResolvedValue(false);
  UsuarioDAO.create.mockResolvedValue(undefined);

  // El envío de código no falla por defecto
  emailService.sendRegistrationCode.mockResolvedValue(undefined);
});

// ================================================================
// FUNCIONES AUXILIARES DE VALIDACIÓN DEL FORMULARIO
//
// Replican la lógica de doRegister() y doVerifyCode() en login.js.
// Estas validaciones se ejecutan en el cliente ANTES de llamar a la
// API, por lo que sus mensajes de error no provienen del servidor.
// ================================================================

/**
 * Valida los campos del formulario de registro.
 * @returns {string|null} Mensaje de error, o null si todo es correcto.
 */
function validarFormulario(username, email, pass, pass2) {
  if (!username || !email || !pass || !pass2)
    return 'Completa todos los campos';
  if (username.length < 3)
    return 'El usuario debe tener al menos 3 caracteres';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return 'Ingresa un correo electrónico válido';
  if (pass.length < 6)
    return 'La contraseña debe tener al menos 6 caracteres';
  if (pass !== pass2)
    return 'Las contraseñas no coinciden';
  return null;
}

/**
 * Valida el código de verificación de 6 dígitos.
 * @param {string[]} digitos - Array de 6 entradas individuales.
 * @returns {string|null}
 */
function validarCodigo(digitos) {
  const codigo = digitos.join('');
  if (codigo.length < 6) return 'Ingresa el código completo de 6 dígitos';
  return null;
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 1 — Creación de usuario', () => {

  // --------------------------------------------------------------
  // E1 — Campos del formulario vacíos
  // Capa: frontend (login.js › doRegister)
  // --------------------------------------------------------------
  describe('E1 — Datos vacíos', () => {
    test('muestra "Completa todos los campos" cuando el formulario está completamente vacío', () => {
      // Arrange
      const username = '';
      const email    = '';
      const pass     = '';
      const pass2    = '';

      // Act
      const resultado = validarFormulario(username, email, pass, pass2);

      // Assert
      expect(resultado).toBe('Completa todos los campos');
    });

    test('muestra "Completa todos los campos" cuando falta al menos un campo', () => {
      // Arrange
      const username = 'docente1';
      const email    = 'doc@mail.com';
      const pass     = '';           // contraseña ausente
      const pass2    = '';

      // Act
      const resultado = validarFormulario(username, email, pass, pass2);

      // Assert
      expect(resultado).toBe('Completa todos los campos');
    });
  });

  // --------------------------------------------------------------
  // E2 — Formato de correo inválido
  // Capa: frontend (login.js › doRegister)
  // --------------------------------------------------------------
  describe('E2 — Correo inválido', () => {
    test('muestra "Ingresa un correo electrónico válido" con texto sin arroba', () => {
      // Arrange
      const username = 'docente1';
      const email    = 'correo-invalido';
      const pass     = 'abc123';
      const pass2    = 'abc123';

      // Act
      const resultado = validarFormulario(username, email, pass, pass2);

      // Assert
      expect(resultado).toBe('Ingresa un correo electrónico válido');
    });

    test('muestra error con correo sin extensión de dominio (sin punto final)', () => {
      // Arrange
      const username = 'docente1';
      const email    = 'doc@correo';   // falta la extensión (.com, .pe, …)
      const pass     = 'abc123';
      const pass2    = 'abc123';

      // Act
      const resultado = validarFormulario(username, email, pass, pass2);

      // Assert
      expect(resultado).toBe('Ingresa un correo electrónico válido');
    });
  });

  // --------------------------------------------------------------
  // E3 — Contraseñas no coinciden
  // Capa: frontend (login.js › doRegister)
  // --------------------------------------------------------------
  describe('E3 — Contraseñas no coinciden', () => {
    test('muestra "Las contraseñas no coinciden" cuando los dos campos son distintos', () => {
      // Arrange
      const username = 'docente1';
      const email    = 'doc@mail.com';
      const pass     = 'abc123';
      const pass2    = 'xyz789';       // diferente a pass

      // Act
      const resultado = validarFormulario(username, email, pass, pass2);

      // Assert
      expect(resultado).toBe('Las contraseñas no coinciden');
    });
  });

  // --------------------------------------------------------------
  // E4 — Correo ya registrado
  // Capa: servidor (authService › sendRegisterCode)
  // --------------------------------------------------------------
  describe('E4 — Correo ya registrado', () => {
    test('el servidor responde 400 con "Ese correo ya está registrado"', async () => {
      // Arrange
      UsuarioDAO.checkUsernameExists.mockResolvedValue(false);
      UsuarioDAO.checkEmailExists.mockResolvedValue(true); // correo ya existe en la BD

      // Act
      const respuesta = await request(app)
        .post('/api/auth/send-register-code')
        .send({ username: 'nuevoDocente', email: 'existente@mail.com', password: 'abc123' });

      // Assert
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.error).toBe('Ese correo ya está registrado');
    });
  });

  // --------------------------------------------------------------
  // E5 — Nombre de usuario ya en uso
  // Capa: servidor (authService › sendRegisterCode)
  // --------------------------------------------------------------
  describe('E5 — Nombre de usuario ya registrado', () => {
    test('el servidor responde 400 con "Ese nombre de usuario ya está en uso"', async () => {
      // Arrange
      UsuarioDAO.checkUsernameExists.mockResolvedValue(true); // usuario ya tomado
      UsuarioDAO.checkEmailExists.mockResolvedValue(false);

      // Act
      const respuesta = await request(app)
        .post('/api/auth/send-register-code')
        .send({ username: 'docenteExistente', email: 'nuevo@mail.com', password: 'abc123' });

      // Assert
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.error).toBe('Ese nombre de usuario ya está en uso');
    });
  });

  // --------------------------------------------------------------
  // E6 — Contraseña demasiado corta
  // Capa: frontend (login.js › doRegister)
  // --------------------------------------------------------------
  describe('E6 — Contraseña demasiado corta', () => {
    test('muestra "La contraseña debe tener al menos 6 caracteres" con 5 caracteres', () => {
      // Arrange
      const username = 'docente1';
      const email    = 'doc@mail.com';
      const pass     = 'abc12';        // 5 caracteres — menos del mínimo
      const pass2    = 'abc12';

      // Act
      const resultado = validarFormulario(username, email, pass, pass2);

      // Assert
      expect(resultado).toBe('La contraseña debe tener al menos 6 caracteres');
    });

    test('no muestra error cuando la contraseña tiene exactamente 6 caracteres', () => {
      // Arrange
      const username = 'docente1';
      const email    = 'doc@mail.com';
      const pass     = 'abc123';       // 6 caracteres — cumple el mínimo
      const pass2    = 'abc123';

      // Act
      const resultado = validarFormulario(username, email, pass, pass2);

      // Assert
      expect(resultado).toBeNull();
    });
  });

  // --------------------------------------------------------------
  // E7 — Nombre de usuario demasiado corto
  // Capa: frontend (login.js › doRegister)
  // --------------------------------------------------------------
  describe('E7 — Nombre de usuario demasiado corto', () => {
    test('muestra "El usuario debe tener al menos 3 caracteres" con 2 caracteres', () => {
      // Arrange
      const username = 'ab';           // 2 caracteres — menos del mínimo
      const email    = 'doc@mail.com';
      const pass     = 'abc123';
      const pass2    = 'abc123';

      // Act
      const resultado = validarFormulario(username, email, pass, pass2);

      // Assert
      expect(resultado).toBe('El usuario debe tener al menos 3 caracteres');
    });

    test('no muestra error cuando el nombre de usuario tiene exactamente 3 caracteres', () => {
      // Arrange
      const username = 'abc';          // 3 caracteres — cumple el mínimo
      const email    = 'doc@mail.com';
      const pass     = 'abc123';
      const pass2    = 'abc123';

      // Act
      const resultado = validarFormulario(username, email, pass, pass2);

      // Assert
      expect(resultado).toBeNull();
    });
  });

  // --------------------------------------------------------------
  // E8 — Código de verificación incorrecto
  // Capa: servidor (authService › verifyAndRegister)
  // --------------------------------------------------------------
  describe('E8 — Código de verificación incorrecto', () => {
    test('el servidor responde 400 con "Código incorrecto" al ingresar un código erróneo', async () => {
      // Arrange: enviar un código válido para que el servidor genere y almacene la entrada
      await request(app)
        .post('/api/auth/send-register-code')
        .send({ username: 'docente8', email: 'e8@mail.com', password: 'abc123' });

      // Act: intentar verificar con un código diferente al generado
      const respuesta = await request(app)
        .post('/api/auth/verify-register-code')
        .send({ email: 'e8@mail.com', code: '000000' }); // código incorrecto

      // Assert
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.error).toBe('Código incorrecto');
    });
  });

  // --------------------------------------------------------------
  // E9 — Código de verificación vacío o incompleto
  // Capa: frontend (login.js › doVerifyCode)
  // --------------------------------------------------------------
  describe('E9 — Código de verificación incompleto', () => {
    test('muestra "Ingresa el código completo de 6 dígitos" cuando todos los campos están vacíos', () => {
      // Arrange
      const digitos = ['', '', '', '', '', '']; // ningún dígito ingresado

      // Act
      const resultado = validarCodigo(digitos);

      // Assert
      expect(resultado).toBe('Ingresa el código completo de 6 dígitos');
    });

    test('muestra el error cuando el código tiene solo 4 dígitos ingresados', () => {
      // Arrange
      const digitos = ['1', '2', '3', '4', '', '']; // código incompleto

      // Act
      const resultado = validarCodigo(digitos);

      // Assert
      expect(resultado).toBe('Ingresa el código completo de 6 dígitos');
    });

    test('no muestra error cuando el código tiene los 6 dígitos completos', () => {
      // Arrange
      const digitos = ['1', '2', '3', '4', '5', '6']; // código completo

      // Act
      const resultado = validarCodigo(digitos);

      // Assert
      expect(resultado).toBeNull();
    });
  });

  // --------------------------------------------------------------
  // E10 — Caso exitoso: registro completo
  // Capa: servidor (authService › sendRegisterCode + verifyAndRegister)
  // --------------------------------------------------------------
  describe('E10 — Caso exitoso', () => {
    test('crea la cuenta correctamente con datos válidos y código correcto', async () => {
      // Arrange: interceptar el código generado por el servidor
      let codigoCapturado;
      emailService.sendRegistrationCode.mockImplementation(({ code }) => {
        codigoCapturado = code;
        return Promise.resolve();
      });

      // Act 1: solicitar el envío del código de verificación
      const resSendCode = await request(app)
        .post('/api/auth/send-register-code')
        .send({
          username: 'docenteNuevo',
          email:    'nuevo@mail.com',
          password: 'Segura123',
        });

      // Act 2: verificar el código y completar el registro
      const resVerify = await request(app)
        .post('/api/auth/verify-register-code')
        .send({
          email: 'nuevo@mail.com',
          code:  codigoCapturado, // código real generado por el servidor
        });

      // Assert — paso 1: el servidor confirmó el envío del código
      expect(resSendCode.status).toBe(200);
      expect(resSendCode.body.ok).toBe(true);

      // Assert — paso 2: el servidor creó la cuenta y devolvió los datos del usuario
      expect(resVerify.status).toBe(200);
      expect(resVerify.body).toMatchObject({
        username: 'docenteNuevo',
        email:    'nuevo@mail.com',
        rol:      'docente',
      });
      expect(resVerify.body.id).toBeDefined();
    });
  });

});
