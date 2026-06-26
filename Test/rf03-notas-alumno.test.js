'use strict';

/**
 * ============================================================
 *  Requerimiento 3 — Observar los datos y notas de un alumno
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1  – Sección sin alumnos → página muestra "Sin alumnos"
 *    E2  – Actividades sin crear → celdas de notas vacías
 *    E3  – Caso exitoso: alumnos, actividades y notas correctamente cargados
 */

// ================================================================
// MOCKS  (deben declararse antes de cualquier require)
// ================================================================

// Stub de la capa de base de datos — buildDbJson devuelve lo que
// cada test necesite sin tocar MySQL
jest.mock('../db/mysql', () => ({
  getPool:     jest.fn(),
  buildDbJson: jest.fn(),
  saveDbJson:  jest.fn().mockResolvedValue(undefined),
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
const { buildDbJson, getPool } = require('../db/mysql');

// ================================================================
// SETUP — se ejecuta antes de cada prueba
// ================================================================

beforeEach(() => {
  jest.clearAllMocks();

  const mockConn = { query: jest.fn(), release: jest.fn() };
  getPool.mockReturnValue({
    getConnection: jest.fn().mockResolvedValue(mockConn),
  });
});

// ================================================================
// DATOS DE PRUEBA REUTILIZABLES
// ================================================================

const CURSO_ID       = 'curso_1';
const SECCION_ID     = 'sec_1';
const CLAVE_SALON    = '3°_A';                        // grade_letter usado como clave de alumnos
const CLAVE_SEC      = `${CURSO_ID}_${SECCION_ID}`;   // clave de actividades y notas

const ESTRUCTURA_BASE = {
  courses: [{
    id: CURSO_ID, name: 'Matemáticas', color: '#3B6FA0',
    competencias: { 1: ['Números y operaciones'] }, createdAt: null,
  }],
  sections: {
    [CURSO_ID]: [{
      id: SECCION_ID, grade: '3°', letter: 'A',
      competencias: {}, createdAt: null,
      schedule: { days: [], times: {} },
    }],
  },
  users:             [],
  scheduleReference: { days: [], timeSlots: [] },
};

// E1 — Sin alumnos en la sección
const DB_SIN_ALUMNOS = {
  ...ESTRUCTURA_BASE,
  students:   {},
  activities: {},
  grades:     {},
};

// E2 — Alumnos existentes, pero sin actividades creadas
const DB_SIN_ACTIVIDADES = {
  ...ESTRUCTURA_BASE,
  students: {
    [CLAVE_SALON]: [
      { id: 'alu_1', name: 'Ana Torres' },
      { id: 'alu_2', name: 'Carlos Ruiz' },
    ],
  },
  activities: {},
  grades:     {},
};

// E3 — Datos completos: alumnos + actividades + notas
const DB_COMPLETO = {
  ...ESTRUCTURA_BASE,
  students: {
    [CLAVE_SALON]: [
      { id: 'alu_1', name: 'Ana Torres' },
      { id: 'alu_2', name: 'Carlos Ruiz' },
    ],
  },
  activities: {
    [CLAVE_SEC]: [
      { id: 'act_1', name: 'Práctica 1', bimestre: 1, competenciaIdx: 0, type: 'practica', dueDate: null, weight: '' },
    ],
  },
  grades: {
    [CLAVE_SEC]: {
      'alu_1': { 'act_1': 'A' },
      'alu_2': { 'act_1': 'B' },
    },
  },
};

// ================================================================
// FUNCIONES AUXILIARES
// Replican la lógica de renderizado de seccionespecifica.js
// (se ejecutan en el cliente al procesar los datos de la API)
// ================================================================

/**
 * Filtra alumnos activos (no retirados) de una sección.
 * Replica: DB.getStudents(courseId, sectionId).filter(s => !s.retired)
 */
function obtenerAlumnosActivos(alumnos) {
  return (alumnos || []).filter(a => !a.retired);
}

/**
 * Devuelve el mensaje "Sin alumnos" si no hay alumnos activos.
 * Replica: if (!allStudents.length) → muestra empty-students
 */
function mensajeParaSeccionVacia(alumnosActivos) {
  return alumnosActivos.length === 0 ? 'Sin alumnos' : null;
}

/**
 * Devuelve las notas de un alumno para cada actividad.
 * Si no hay actividades, retorna array vacío (celdas vacías).
 * Replica la lógica de renderTable() en seccionespecifica.js
 */
function obtenerCeldasNotas(actividades, notasSeccion, alumnoId) {
  if (!actividades || actividades.length === 0) return [];
  const notasAlumno = (notasSeccion || {})[alumnoId] || {};
  return actividades.map(act => notasAlumno[act.id] ?? null);
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 3 — Observar los datos y notas de un alumno', () => {

  // --------------------------------------------------------------
  // E1 — Sección sin alumnos
  // --------------------------------------------------------------
  describe('E1 — Sección sin alumnos', () => {
    test('muestra "Sin alumnos" cuando el array de alumnos de la sección está vacío', () => {
      // Arrange
      const alumnosSeccion = [];

      // Act
      const activos  = obtenerAlumnosActivos(alumnosSeccion);
      const mensaje  = mensajeParaSeccionVacia(activos);

      // Assert
      expect(activos).toHaveLength(0);
      expect(mensaje).toBe('Sin alumnos');
    });

    test('muestra "Sin alumnos" cuando todos los alumnos de la sección están retirados', () => {
      // Arrange
      const alumnosSeccion = [
        { id: 'alu_1', name: 'Juan Pérez',   retired: true },
        { id: 'alu_2', name: 'María López',  retired: true },
      ];

      // Act
      const activos = obtenerAlumnosActivos(alumnosSeccion);
      const mensaje = mensajeParaSeccionVacia(activos);

      // Assert
      expect(activos).toHaveLength(0);
      expect(mensaje).toBe('Sin alumnos');
    });

    test('la API devuelve students vacío cuando la sección no tiene alumnos', async () => {
      // Arrange
      buildDbJson.mockResolvedValue(DB_SIN_ALUMNOS);

      // Act
      const respuesta = await request(app)
        .get('/api/db')
        .set('x-user-id', 'user_001');

      // Assert
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.students).toEqual({});
    });
  });

  // --------------------------------------------------------------
  // E2 — Actividades sin crear
  // --------------------------------------------------------------
  describe('E2 — Actividades sin crear', () => {
    test('las celdas de notas están vacías cuando no hay actividades en la sección', () => {
      // Arrange
      const actividades = [];
      const notas       = {};
      const alumnoId    = 'alu_1';

      // Act
      const celdas = obtenerCeldasNotas(actividades, notas, alumnoId);

      // Assert
      expect(celdas).toHaveLength(0);
    });

    test('la celda queda vacía (null) cuando hay actividad pero el alumno no tiene nota asignada', () => {
      // Arrange
      const actividades = [{ id: 'act_1', name: 'Práctica 1' }];
      const notas       = {};  // ningún alumno tiene notas aún
      const alumnoId    = 'alu_1';

      // Act
      const celdas = obtenerCeldasNotas(actividades, notas, alumnoId);

      // Assert
      expect(celdas).toHaveLength(1);
      expect(celdas[0]).toBeNull();
    });

    test('la API devuelve alumnos pero sin actividades para la sección', async () => {
      // Arrange
      buildDbJson.mockResolvedValue(DB_SIN_ACTIVIDADES);

      // Act
      const respuesta = await request(app)
        .get('/api/db')
        .set('x-user-id', 'user_001');

      // Assert
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.students[CLAVE_SALON]).toHaveLength(2);
      expect(respuesta.body.activities[CLAVE_SEC]).toBeUndefined();
    });
  });

  // --------------------------------------------------------------
  // E3 — Caso exitoso
  // --------------------------------------------------------------
  describe('E3 — Caso exitoso', () => {
    test('la API devuelve correctamente los alumnos, actividades y notas de la sección', async () => {
      // Arrange
      buildDbJson.mockResolvedValue(DB_COMPLETO);

      // Act
      const respuesta = await request(app)
        .get('/api/db')
        .set('x-user-id', 'user_001');

      // Assert
      expect(respuesta.status).toBe(200);

      const alumnos    = respuesta.body.students[CLAVE_SALON];
      const actividades = respuesta.body.activities[CLAVE_SEC];
      const notas      = respuesta.body.grades[CLAVE_SEC];

      expect(alumnos).toHaveLength(2);
      expect(alumnos[0].name).toBe('Ana Torres');
      expect(alumnos[1].name).toBe('Carlos Ruiz');

      expect(actividades).toHaveLength(1);
      expect(actividades[0].name).toBe('Práctica 1');

      expect(notas['alu_1']['act_1']).toBe('A');
      expect(notas['alu_2']['act_1']).toBe('B');
    });

    test('las celdas de notas muestran la nota correcta de cada alumno por actividad', () => {
      // Arrange
      const actividades = DB_COMPLETO.activities[CLAVE_SEC];
      const notas       = DB_COMPLETO.grades[CLAVE_SEC];

      // Act — notas del alumno 1
      const celdasAlu1 = obtenerCeldasNotas(actividades, notas, 'alu_1');
      const celdasAlu2 = obtenerCeldasNotas(actividades, notas, 'alu_2');

      // Assert
      expect(celdasAlu1).toHaveLength(1);
      expect(celdasAlu1[0]).toBe('A');

      expect(celdasAlu2).toHaveLength(1);
      expect(celdasAlu2[0]).toBe('B');
    });
  });

});
