'use strict';

/**
 * ============================================================
 *  Requerimiento 6 — Editar perfil del docente
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1  – Archivo de foto de perfil no válido
 *    E2  – Campos vacíos (nombre display / correo)
 *    E3  – Nombre de display demasiado corto (< 3 caracteres)
 *    E4  – Datos iguales a los actuales (nombre display / correo)
 *    E5  – Formato de correo electrónico no válido
 *    E6  – Caso exitoso: perfil actualizado correctamente
 *
 *  Las funciones auxiliares replican la lógica de cuenta.js:
 *    - handleAvatarFile()  → E1
 *    - saveDisplayName()   → E2, E3, E4 (nombre)
 *    - saveEmail()         → E2, E4, E5 (correo)
 */

// ================================================================
// MOCKS
// ================================================================

jest.mock('../db/mysql', () => ({
  getPool:     jest.fn(),
  buildDbJson: jest.fn().mockResolvedValue({}),
  saveDbJson:  jest.fn(),
  DB_CONFIG:   { host: 'localhost', database: 'test', user: 'test' },
}));

jest.mock('../src/dao/UsuarioDAO');

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

const request                  = require('supertest');
const { app }                  = require('../server');
const { saveDbJson, getPool }  = require('../db/mysql');

// ================================================================
// SETUP
// ================================================================

beforeEach(() => {
  jest.clearAllMocks();

  const mockConn = { query: jest.fn(), release: jest.fn() };
  getPool.mockReturnValue({
    getConnection: jest.fn().mockResolvedValue(mockConn),
  });

  saveDbJson.mockResolvedValue(undefined);
});

// ================================================================
// FUNCIONES AUXILIARES DE VALIDACIÓN
// Replican la lógica de cuenta.js
// ================================================================

/**
 * Valida el archivo seleccionado para la foto de perfil.
 * Replica: handleAvatarFile() en cuenta.js
 * @param {{ type: string, name: string }} file
 * @returns {string|null}
 */
function validarArchivoFoto(file) {
  if (!file) return null;
  if (!file.type.startsWith('image/')) return 'Selecciona un archivo de imagen válido';
  return null;
}

/**
 * Valida el nuevo nombre de visualización.
 * Replica: saveDisplayName() en cuenta.js
 * @param {string} nuevoNombre
 * @param {string} nombreActual - displayName actual del usuario
 * @returns {string|null}
 */
function validarNombreDisplay(nuevoNombre, nombreActual) {
  const nombre = (nuevoNombre || '').trim();
  if (!nombre)          return 'Ingresa el nombre de visualización';
  if (nombre.length < 3) return 'El nombre debe tener al menos 3 caracteres';
  if (nombre === nombreActual) return 'Ese ya es tu nombre de visualización actual';
  return null;
}

/**
 * Valida el nuevo correo electrónico.
 * Replica: saveEmail() en cuenta.js
 * @param {string} nuevoCorreo
 * @param {string} correoActual - correo actual del usuario
 * @returns {string|null}
 */
function validarNuevoCorreo(nuevoCorreo, correoActual) {
  const email = (nuevoCorreo || '').trim().toLowerCase();
  if (!email) return 'Ingresa el nuevo correo';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'Ingresa un correo electrónico válido';
  if (email === correoActual) return 'Ese ya es tu correo actual';
  return null;
}

// ================================================================
// DATOS DE PRUEBA
// ================================================================

const USUARIO_ACTUAL = {
  id:          'user_001',
  username:    'docente1',
  displayName: 'Docente Uno',
  email:       'docente@mail.com',
  rol:         'docente',
  activo:      true,
};

// Cuerpo para PUT /api/db con el perfil actualizado
const DB_PERFIL_ACTUALIZADO = {
  courses:  [],
  sections: {},
  students: {},
  activities: {},
  grades:   {},
  users: [{
    ...USUARIO_ACTUAL,
    displayName: 'Docente Editado',
    email:       'nuevo@mail.com',
  }],
  scheduleReference: { days: [], timeSlots: [] },
};

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 6 — Editar perfil del docente', () => {

  // --------------------------------------------------------------
  // E1 — Archivo de foto de perfil no válido
  // Capa: frontend (cuenta.js › handleAvatarFile)
  // --------------------------------------------------------------
  describe('E1 — Archivo de foto no válido', () => {
    test('muestra "Selecciona un archivo de imagen válido" al elegir un PDF', () => {
      // Arrange
      const archivo = { type: 'application/pdf', name: 'documento.pdf' };

      // Act
      const resultado = validarArchivoFoto(archivo);

      // Assert
      expect(resultado).toBe('Selecciona un archivo de imagen válido');
    });

    test('muestra el error al elegir un archivo de texto plano', () => {
      // Arrange
      const archivo = { type: 'text/plain', name: 'notas.txt' };

      // Act
      const resultado = validarArchivoFoto(archivo);

      // Assert
      expect(resultado).toBe('Selecciona un archivo de imagen válido');
    });

    test('acepta un archivo JPEG como imagen válida', () => {
      // Arrange
      const archivo = { type: 'image/jpeg', name: 'foto.jpg' };

      // Act
      const resultado = validarArchivoFoto(archivo);

      // Assert
      expect(resultado).toBeNull();
    });

    test('acepta un archivo PNG como imagen válida', () => {
      // Arrange
      const archivo = { type: 'image/png', name: 'avatar.png' };

      // Act
      const resultado = validarArchivoFoto(archivo);

      // Assert
      expect(resultado).toBeNull();
    });
  });

  // --------------------------------------------------------------
  // E2 — Campos vacíos
  // Capa: frontend (cuenta.js › saveDisplayName / saveEmail)
  // --------------------------------------------------------------
  describe('E2 — Campos vacíos', () => {
    test('muestra "Ingresa el nombre de visualización" cuando el campo nombre está vacío', () => {
      // Arrange
      const nuevoNombre  = '';
      const nombreActual = USUARIO_ACTUAL.displayName;

      // Act
      const resultado = validarNombreDisplay(nuevoNombre, nombreActual);

      // Assert
      expect(resultado).toBe('Ingresa el nombre de visualización');
    });

    test('muestra "Ingresa el nuevo correo" cuando el campo correo está vacío', () => {
      // Arrange
      const nuevoCorreo  = '';
      const correoActual = USUARIO_ACTUAL.email;

      // Act
      const resultado = validarNuevoCorreo(nuevoCorreo, correoActual);

      // Assert
      expect(resultado).toBe('Ingresa el nuevo correo');
    });
  });

  // --------------------------------------------------------------
  // E3 — Nombre de display demasiado corto
  // Capa: frontend (cuenta.js › saveDisplayName)
  // --------------------------------------------------------------
  describe('E3 — Nombre de display demasiado corto', () => {
    test('muestra "El nombre debe tener al menos 3 caracteres" con 2 caracteres', () => {
      // Arrange
      const nuevoNombre  = 'AB';           // 2 caracteres
      const nombreActual = USUARIO_ACTUAL.displayName;

      // Act
      const resultado = validarNombreDisplay(nuevoNombre, nombreActual);

      // Assert
      expect(resultado).toBe('El nombre debe tener al menos 3 caracteres');
    });

    test('acepta un nombre exactamente de 3 caracteres', () => {
      // Arrange
      const nuevoNombre  = 'Ana';          // 3 caracteres — límite mínimo
      const nombreActual = USUARIO_ACTUAL.displayName;

      // Act
      const resultado = validarNombreDisplay(nuevoNombre, nombreActual);

      // Assert
      expect(resultado).toBeNull();
    });
  });

  // --------------------------------------------------------------
  // E4 — Datos iguales a los actuales
  // Capa: frontend (cuenta.js › saveDisplayName / saveEmail)
  // --------------------------------------------------------------
  describe('E4 — Datos iguales a los actuales', () => {
    test('muestra "Ese ya es tu nombre de visualización actual" al ingresar el mismo nombre', () => {
      // Arrange
      const nuevoNombre  = 'Docente Uno';  // igual al actual
      const nombreActual = USUARIO_ACTUAL.displayName;

      // Act
      const resultado = validarNombreDisplay(nuevoNombre, nombreActual);

      // Assert
      expect(resultado).toBe('Ese ya es tu nombre de visualización actual');
    });

    test('muestra "Ese ya es tu correo actual" al ingresar el mismo correo', () => {
      // Arrange
      const nuevoCorreo  = 'docente@mail.com';  // igual al actual
      const correoActual = USUARIO_ACTUAL.email;

      // Act
      const resultado = validarNuevoCorreo(nuevoCorreo, correoActual);

      // Assert
      expect(resultado).toBe('Ese ya es tu correo actual');
    });
  });

  // --------------------------------------------------------------
  // E5 — Formato de correo no válido
  // Capa: frontend (cuenta.js › saveEmail)
  // --------------------------------------------------------------
  describe('E5 — Formato de correo no válido', () => {
    test('muestra "Ingresa un correo electrónico válido" sin el símbolo @', () => {
      // Arrange
      const nuevoCorreo  = 'correosinArroba';
      const correoActual = USUARIO_ACTUAL.email;

      // Act
      const resultado = validarNuevoCorreo(nuevoCorreo, correoActual);

      // Assert
      expect(resultado).toBe('Ingresa un correo electrónico válido');
    });

    test('muestra el error con correo sin extensión de dominio', () => {
      // Arrange
      const nuevoCorreo  = 'doc@correo';   // falta la extensión (.com, .pe…)
      const correoActual = USUARIO_ACTUAL.email;

      // Act
      const resultado = validarNuevoCorreo(nuevoCorreo, correoActual);

      // Assert
      expect(resultado).toBe('Ingresa un correo electrónico válido');
    });
  });

  // --------------------------------------------------------------
  // E6 — Caso exitoso
  // Capa: frontend (validaciones pasan) + servidor (PUT /api/db)
  // --------------------------------------------------------------
  describe('E6 — Caso exitoso', () => {
    test('el nuevo nombre de display es válido y diferente al actual', () => {
      // Arrange
      const nuevoNombre  = 'Docente Editado';
      const nombreActual = USUARIO_ACTUAL.displayName;

      // Act
      const resultado = validarNombreDisplay(nuevoNombre, nombreActual);

      // Assert
      expect(resultado).toBeNull();
    });

    test('el nuevo correo es válido, tiene formato correcto y es diferente al actual', () => {
      // Arrange
      const nuevoCorreo  = 'nuevo@mail.com';
      const correoActual = USUARIO_ACTUAL.email;

      // Act
      const resultado = validarNuevoCorreo(nuevoCorreo, correoActual);

      // Assert
      expect(resultado).toBeNull();
    });

    test('el servidor guarda el perfil actualizado vía PUT /api/db', async () => {
      // Arrange
      saveDbJson.mockResolvedValue(undefined);

      // Act
      const respuesta = await request(app)
        .put('/api/db')
        .set('x-user-id', 'user_001')
        .send(DB_PERFIL_ACTUALIZADO);

      // Assert
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.ok).toBe(true);

      // Verifica que saveDbJson recibió los datos del usuario actualizados
      const [, datosGuardados] = saveDbJson.mock.calls[0];
      const usuario = datosGuardados.users[0];
      expect(usuario.displayName).toBe('Docente Editado');
      expect(usuario.email).toBe('nuevo@mail.com');
    });
  });

});
