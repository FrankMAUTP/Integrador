/**
 * RF01 - Creación de Usuario
 *
 * Archivos analizados:
 *   - src/services/authService.js   → sendRegisterCode(), verifyAndRegister()
 *   - src/controllers/authController.js → sendRegisterCode(), verifyRegisterCode()
 *   - src/routes/authRoutes.js      → POST /api/auth/send-register-code
 *                                     POST /api/auth/verify-register-code
 *   - src/dao/UsuarioDAO.js         → checkUsernameExists(), checkEmailExists()
 *   - public/js/login.js            → doRegister(), doVerifyCode()  (validaciones cliente)
 *
 * Estrategia:
 *   E1–E3, E6–E7, E9 → Validaciones que ocurren en el cliente (login.js).
 *                       Se prueban extrayendo y ejecutando la lógica de validación
 *                       de forma unitaria, tal como está en el código real.
 *   E4, E5           → Validaciones en authService (base de datos).
 *                       Se prueban con mocks sobre UsuarioDAO y db/mysql.
 *   E8               → Validación en authService.verifyAndRegister.
 *                       Se prueba con mock sobre el store interno.
 */

'use strict';

process.env.NODE_ENV = 'test';

// ─────────────────────────────────────────────
// SECCIÓN 1: Lógica de validación del cliente
// Extraída de public/js/login.js → doRegister() y doVerifyCode()
// No se importa el archivo (requiere DOM); se replica la lógica pura.
// ─────────────────────────────────────────────

/**
 * Replica exacta de las validaciones de doRegister() en login.js.
 * Retorna el mensaje de error o null si pasa todas las validaciones.
 */
function validarFormularioRegistro({ username, email, pass, pass2 }) {
  if (!username || !email || !pass || !pass2) return 'Completa todos los campos';
  if (username.length < 3)                    return 'El usuario debe tener al menos 3 caracteres';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'Ingresa un correo electrónico válido';
  if (pass.length < 6)                        return 'La contraseña debe tener al menos 6 caracteres';
  if (pass !== pass2)                         return 'Las contraseñas no coinciden';
  return null;
}

/**
 * Replica exacta de la validación de doVerifyCode() en login.js.
 * Retorna el mensaje de error o null si el código es válido en longitud.
 */
function validarCodigoVerificacion(entered) {
  if (entered.length < 6) return 'Ingresa el código completo de 6 dígitos';
  return null;
}

// ─────────────────────────────────────────────
// SECCIÓN 2: Tests de validaciones del cliente
// ─────────────────────────────────────────────

describe('RF01 – Validaciones del cliente (login.js → doRegister)', () => {

  // E1 ─ Datos vacíos
  test('E1: campos vacíos → "Completa todos los campos"', () => {
    // Arrange
    const datos = { username: '', email: '', pass: '', pass2: '' };

    // Act
    const resultado = validarFormularioRegistro(datos);

    // Assert
    expect(resultado).toBe('Completa todos los campos');
  });

  test('E1: solo algunos campos completados → "Completa todos los campos"', () => {
    // Arrange
    const datos = { username: 'docente1', email: '', pass: '', pass2: '' };

    // Act
    const resultado = validarFormularioRegistro(datos);

    // Assert
    expect(resultado).toBe('Completa todos los campos');
  });

  // E2 ─ Correo inválido
  test('E2: correo sin arroba → "Ingresa un correo electrónico válido"', () => {
    // Arrange
    const datos = { username: 'docente1', email: 'correosinArroba', pass: 'pass123', pass2: 'pass123' };

    // Act
    const resultado = validarFormularioRegistro(datos);

    // Assert
    expect(resultado).toBe('Ingresa un correo electrónico válido');
  });

  test('E2: correo sin dominio → "Ingresa un correo electrónico válido"', () => {
    // Arrange
    const datos = { username: 'docente1', email: 'usuario@', pass: 'pass123', pass2: 'pass123' };

    // Act
    const resultado = validarFormularioRegistro(datos);

    // Assert
    expect(resultado).toBe('Ingresa un correo electrónico válido');
  });

  // E3 ─ Contraseñas no coinciden
  test('E3: contraseñas distintas → "Las contraseñas no coinciden"', () => {
    // Arrange
    const datos = {
      username: 'docente1',
      email:    'docente@colegio.edu.pe',
      pass:     'pass123',
      pass2:    'pass456',
    };

    // Act
    const resultado = validarFormularioRegistro(datos);

    // Assert
    expect(resultado).toBe('Las contraseñas no coinciden');
  });

  // E6 ─ Contraseña demasiado corta
  test('E6: contraseña de 5 caracteres → "La contraseña debe tener al menos 6 caracteres"', () => {
    // Arrange
    const datos = {
      username: 'docente1',
      email:    'docente@colegio.edu.pe',
      pass:     '12345',
      pass2:    '12345',
    };

    // Act
    const resultado = validarFormularioRegistro(datos);

    // Assert
    expect(resultado).toBe('La contraseña debe tener al menos 6 caracteres');
  });

  // E7 ─ Nombre de usuario demasiado corto
  test('E7: usuario de 2 caracteres → "El usuario debe tener al menos 3 caracteres"', () => {
    // Arrange
    const datos = {
      username: 'ab',
      email:    'docente@colegio.edu.pe',
      pass:     'pass123',
      pass2:    'pass123',
    };

    // Act
    const resultado = validarFormularioRegistro(datos);

    // Assert
    expect(resultado).toBe('El usuario debe tener al menos 3 caracteres');
  });

  // Caso positivo: datos válidos no deben retornar error
  test('Datos completos y válidos → sin error (null)', () => {
    // Arrange
    const datos = {
      username: 'docente1',
      email:    'docente@colegio.edu.pe',
      pass:     'pass123',
      pass2:    'pass123',
    };

    // Act
    const resultado = validarFormularioRegistro(datos);

    // Assert
    expect(resultado).toBeNull();
  });
});

describe('RF01 – Validación de código (login.js → doVerifyCode)', () => {

  // E9 ─ Código vacío o incompleto
  test('E9: código de 0 dígitos → "Ingresa el código completo de 6 dígitos"', () => {
    // Arrange
    const entered = '';

    // Act
    const resultado = validarCodigoVerificacion(entered);

    // Assert
    expect(resultado).toBe('Ingresa el código completo de 6 dígitos');
  });

  test('E9: código de 4 dígitos → "Ingresa el código completo de 6 dígitos"', () => {
    // Arrange
    const entered = '1234';

    // Act
    const resultado = validarCodigoVerificacion(entered);

    // Assert
    expect(resultado).toBe('Ingresa el código completo de 6 dígitos');
  });

  test('Código de exactamente 6 dígitos → sin error (null)', () => {
    // Arrange
    const entered = '123456';

    // Act
    const resultado = validarCodigoVerificacion(entered);

    // Assert
    expect(resultado).toBeNull();
  });
});

// ─────────────────────────────────────────────
// SECCIÓN 3: Tests de servicio (authService) con mocks
// Cubre E4, E5, E8 que son validaciones en el backend
// ─────────────────────────────────────────────

// Mock de db/mysql para evitar conexión real a la base de datos
jest.mock('../db/mysql', () => ({
  getPool: jest.fn(),
  DB_CONFIG: {},
}));

// Mock de bcrypt usando bcryptjs (misma API, sin binarios nativos)
jest.mock('bcrypt', () => require('bcryptjs'));

// Mock del servicio de email para no enviar correos reales
jest.mock('../src/services/emailService', () => ({
  sendRegistrationCode: jest.fn().mockResolvedValue(undefined),
  sendRecoveryCode:     jest.fn().mockResolvedValue(undefined),
}));

const { getPool } = require('../db/mysql');
const authService = require('../src/services/authService');

/**
 * Crea un mock de conexión MySQL con comportamiento configurable por método.
 */
function crearMockConexion(respuestasPorQuery = {}) {
  return {
    query: jest.fn(async (sql) => {
      // Buscar por fragmento de SQL
      for (const [fragmento, respuesta] of Object.entries(respuestasPorQuery)) {
        if (sql.includes(fragmento)) return respuesta;
      }
      return [[]]; // por defecto: sin resultados
    }),
    release: jest.fn(),
  };
}

describe('RF01 – authService.sendRegisterCode (E4, E5)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // E4 ─ Correo ya registrado
  test('E4: correo ya registrado → lanza "Ese correo ya está registrado"', async () => {
    // Arrange: la BD devuelve que el correo ya existe
    const mockConn = crearMockConexion({
      'WHERE usuario':  [[]], // username no existe
      'WHERE correo':   [[{ id: 'user_existente' }]], // email sí existe
    });
    getPool.mockReturnValue({ getConnection: jest.fn().mockResolvedValue(mockConn) });

    // Act & Assert
    await expect(
      authService.sendRegisterCode('nuevo_usuario', 'existente@colegio.edu.pe', 'pass123')
    ).rejects.toMatchObject({
      message: 'Ese correo ya está registrado',
      status:  400,
    });
  });

  // E5 ─ Nombre de usuario ya registrado
  test('E5: nombre de usuario ya en uso → lanza "Ese nombre de usuario ya está en uso"', async () => {
    // Arrange: la BD devuelve que el usuario ya existe
    const mockConn = crearMockConexion({
      'WHERE usuario': [[{ id: 'user_tomado' }]], // username ya existe
    });
    getPool.mockReturnValue({ getConnection: jest.fn().mockResolvedValue(mockConn) });

    // Act & Assert
    await expect(
      authService.sendRegisterCode('usuario_tomado', 'nuevo@colegio.edu.pe', 'pass123')
    ).rejects.toMatchObject({
      message: 'Ese nombre de usuario ya está en uso',
      status:  400,
    });
  });

  // Caso positivo: datos únicos → se envía código (sin lanzar error)
  test('Datos únicos → resuelve sin error (código enviado)', async () => {
    // Arrange: la BD devuelve que ninguno existe
    const mockConn = crearMockConexion({
      'WHERE usuario': [[]],
      'WHERE correo':  [[]],
    });
    getPool.mockReturnValue({ getConnection: jest.fn().mockResolvedValue(mockConn) });

    // Act & Assert
    await expect(
      authService.sendRegisterCode('nuevo_usuario', 'nuevo@colegio.edu.pe', 'pass123456')
    ).resolves.toBeUndefined();
  });
});

describe('RF01 – authService.verifyAndRegister (E8)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // E8 ─ Código de verificación incorrecto
  test('E8: código incorrecto → lanza "Código incorrecto"', async () => {
    // Arrange: primero enviamos el código para que quede en el store
    const mockConn = crearMockConexion({
      'WHERE usuario': [[]],
      'WHERE correo':  [[]],
    });
    getPool.mockReturnValue({ getConnection: jest.fn().mockResolvedValue(mockConn) });

    const email = `test_e8_${Date.now()}@colegio.edu.pe`;
    await authService.sendRegisterCode('usuario_e8', email, 'pass123456');

    // Act & Assert: verificar con código erróneo
    await expect(
      authService.verifyAndRegister(email, '000000')
    ).rejects.toMatchObject({
      message: 'Código incorrecto',
      status:  400,
    });
  });

  test('E8: sin verificación pendiente → lanza error de verificación', async () => {
    // Arrange: correo sin código pendiente en el store
    const email = 'sin_pendiente@colegio.edu.pe';

    // Act & Assert
    await expect(
      authService.verifyAndRegister(email, '123456')
    ).rejects.toMatchObject({
      message: 'No hay una verificación pendiente para ese correo',
      status:  400,
    });
  });
});
