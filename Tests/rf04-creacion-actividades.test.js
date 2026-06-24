'use strict';

/**
 * ============================================================
 *  Requerimiento 4 — Creación de actividades calificadas
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1  – Actividad sin nombre
 *    E2  – Actividad sin fecha de vencimiento
 *    E3  – Nombre de actividad ya existente en la sección
 *    E4  – Caso exitoso: actividad creada y guardada correctamente
 *
 *  Nota: E1, E2 y E3 son validaciones de la capa frontend
 *  (saveActivity() en seccionespecifica.js). El caso exitoso
 *  verifica además que la API acepta el guardado vía PUT /api/db.
 */

// ================================================================
// MOCKS  (deben declararse antes de cualquier require)
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
// SETUP — se ejecuta antes de cada prueba
// ================================================================

beforeEach(() => {
  jest.clearAllMocks();

  const mockConn = { query: jest.fn(), release: jest.fn() };
  getPool.mockReturnValue({
    getConnection: jest.fn().mockResolvedValue(mockConn),
  });

  // Por defecto: el guardado en BD no falla
  saveDbJson.mockResolvedValue(undefined);
});

// ================================================================
// FUNCIÓN AUXILIAR DE VALIDACIÓN
// Replica la lógica de saveActivity() en seccionespecifica.js
// ================================================================

/**
 * Valida el formulario de creación de una nueva actividad.
 * Sigue el mismo orden de comprobaciones que saveActivity():
 *   1. nombre vacío
 *   2. fecha de vencimiento vacía
 *   3. nombre duplicado en la sección
 *
 * @param {string}   nombre              - Valor del campo "nombre de actividad"
 * @param {string}   fechaVencimiento    - Valor del campo "fecha de vencimiento" (YYYY-MM-DD)
 * @param {Object[]} actividadesSeccion  - Actividades ya existentes en la sección
 * @returns {string|null} Mensaje de error, o null si todos los datos son válidos
 */
function validarActividad(nombre, fechaVencimiento, actividadesSeccion) {
  const name = (nombre || '').trim();

  if (!name)             return 'Ingresa el nombre de la actividad';
  if (!fechaVencimiento) return 'Selecciona la fecha de vencimiento';

  const duplicada = actividadesSeccion.find(
    a => a.name.toLowerCase() === name.toLowerCase()
  );
  if (duplicada) return 'Ya existe una actividad con ese nombre';

  return null;
}

// ================================================================
// DATOS DE PRUEBA
// ================================================================

// Actividades previas ya guardadas en la sección
const ACTIVIDADES_EXISTENTES = [
  { id: 'act_1', name: 'Práctica 1',  bimestre: 1, competenciaIdx: 0, type: 'practica',  dueDate: '2024-04-10' },
  { id: 'act_2', name: 'Exposición 1', bimestre: 1, competenciaIdx: 0, type: 'exposicion', dueDate: '2024-04-20' },
];

// Cuerpo válido para PUT /api/db con la nueva actividad incluida
const DB_CON_ACTIVIDAD_NUEVA = {
  courses: [{ id: 'curso_1', name: 'Matemáticas', color: '#3B6FA0', competencias: {} }],
  sections: {
    'curso_1': [{ id: 'sec_1', grade: '3°', letter: 'A', competencias: {} }],
  },
  students:  { '3°_A': [{ id: 'alu_1', name: 'Ana Torres' }] },
  activities: {
    'curso_1_sec_1': [
      ...ACTIVIDADES_EXISTENTES,
      { id: 'act_nueva_001', name: 'Práctica 2', bimestre: 1, competenciaIdx: 0,
        type: 'practica', dueDate: '2024-05-15', weight: '' },
    ],
  },
  grades:            {},
  users:             [],
  scheduleReference: { days: [], timeSlots: [] },
};

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 4 — Creación de actividades calificadas', () => {

  // --------------------------------------------------------------
  // E1 — Actividad sin nombre
  // Capa: frontend (seccionespecifica.js › saveActivity)
  // --------------------------------------------------------------
  describe('E1 — Actividad sin nombre', () => {
    test('muestra "Ingresa el nombre de la actividad" cuando el campo nombre está vacío', () => {
      // Arrange
      const nombre           = '';
      const fechaVencimiento = '2024-05-15';
      const actividades      = ACTIVIDADES_EXISTENTES;

      // Act
      const resultado = validarActividad(nombre, fechaVencimiento, actividades);

      // Assert
      expect(resultado).toBe('Ingresa el nombre de la actividad');
    });

    test('muestra el error también cuando el nombre contiene solo espacios', () => {
      // Arrange
      const nombre           = '   ';
      const fechaVencimiento = '2024-05-15';
      const actividades      = ACTIVIDADES_EXISTENTES;

      // Act
      const resultado = validarActividad(nombre, fechaVencimiento, actividades);

      // Assert
      expect(resultado).toBe('Ingresa el nombre de la actividad');
    });
  });

  // --------------------------------------------------------------
  // E2 — Actividad sin fecha de vencimiento
  // Capa: frontend (seccionespecifica.js › saveActivity)
  // --------------------------------------------------------------
  describe('E2 — Actividad sin fecha definida', () => {
    test('muestra "Selecciona la fecha de vencimiento" cuando la fecha está vacía', () => {
      // Arrange
      const nombre           = 'Trabajo Grupal';
      const fechaVencimiento = '';               // sin fecha
      const actividades      = ACTIVIDADES_EXISTENTES;

      // Act
      const resultado = validarActividad(nombre, fechaVencimiento, actividades);

      // Assert
      expect(resultado).toBe('Selecciona la fecha de vencimiento');
    });

    test('muestra el error cuando la fecha es null', () => {
      // Arrange
      const nombre           = 'Trabajo Grupal';
      const fechaVencimiento = null;
      const actividades      = ACTIVIDADES_EXISTENTES;

      // Act
      const resultado = validarActividad(nombre, fechaVencimiento, actividades);

      // Assert
      expect(resultado).toBe('Selecciona la fecha de vencimiento');
    });
  });

  // --------------------------------------------------------------
  // E3 — Nombre de actividad ya existente
  // Capa: frontend (seccionespecifica.js › saveActivity)
  // --------------------------------------------------------------
  describe('E3 — Nombre de actividad duplicado', () => {
    test('muestra "Ya existe una actividad con ese nombre" al repetir un nombre exacto', () => {
      // Arrange
      const nombre           = 'Práctica 1';     // nombre ya usado
      const fechaVencimiento = '2024-05-15';
      const actividades      = ACTIVIDADES_EXISTENTES;

      // Act
      const resultado = validarActividad(nombre, fechaVencimiento, actividades);

      // Assert
      expect(resultado).toBe('Ya existe una actividad con ese nombre');
    });

    test('la comparación de nombres es insensible a mayúsculas y minúsculas', () => {
      // Arrange
      const nombre           = 'PRÁCTICA 1';    // mismo nombre en mayúsculas
      const fechaVencimiento = '2024-05-15';
      const actividades      = ACTIVIDADES_EXISTENTES;

      // Act
      const resultado = validarActividad(nombre, fechaVencimiento, actividades);

      // Assert
      expect(resultado).toBe('Ya existe una actividad con ese nombre');
    });
  });

  // --------------------------------------------------------------
  // E4 — Caso exitoso
  // Capa: frontend (validación) + servidor (PUT /api/db)
  // --------------------------------------------------------------
  describe('E4 — Caso exitoso', () => {
    test('no retorna error cuando el nombre y la fecha son válidos y el nombre es único', () => {
      // Arrange
      const nombre           = 'Práctica 2';    // nombre nuevo
      const fechaVencimiento = '2024-05-15';
      const actividades      = ACTIVIDADES_EXISTENTES;

      // Act
      const resultado = validarActividad(nombre, fechaVencimiento, actividades);

      // Assert
      expect(resultado).toBeNull();
    });

    test('el servidor acepta y guarda la nueva actividad vía PUT /api/db', async () => {
      // Arrange
      saveDbJson.mockResolvedValue(undefined);

      // Act
      const respuesta = await request(app)
        .put('/api/db')
        .set('x-user-id', 'user_001')
        .send(DB_CON_ACTIVIDAD_NUEVA);

      // Assert
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.ok).toBe(true);

      // Verifica que saveDbJson recibió la actividad nueva
      const [, datosGuardados] = saveDbJson.mock.calls[0];
      const actividades = datosGuardados.activities['curso_1_sec_1'];
      expect(actividades).toHaveLength(3);
      expect(actividades[2].name).toBe('Práctica 2');
      expect(actividades[2].dueDate).toBe('2024-05-15');
    });
  });

});
