'use strict';

/**
 * ============================================================
 *  Requerimiento 8 — El docente debe poder registrar alumnos
 *                    de forma individual
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1  – Nombre vacío: el sistema muestra
 *           "Ingresa el nombre del alumno"
 *    E2  – Alumno ya existente: el sistema muestra
 *           "Este alumno ya está registrado en el sistema"
 *    E3  – Caso exitoso: alumno registrado y persistido
 *           correctamente en el servidor
 *
 *  Flujo real en seccionespecifica.js › saveStudent():
 *    const name = document.getElementById('student-name').value.trim();
 *    if (!name)
 *      → showToast('Ingresa el nombre del alumno', 'error');
 *    if (getAllStudentNames().has(name.toLowerCase()))
 *      → showToast('Este alumno ya está registrado en el sistema', 'error');
 *    students.push({ id: uid(), name });
 *    DB.saveStudents(courseId, sectionId, students);  // → PUT /api/db
 *
 *  Nota sobre la clave de alumnos:
 *    DB._sectionGlobalKey() devuelve '${sec.grade}_${sec.letter}' (ej. '3°_A')
 *    por lo que students se almacena bajo esa clave, no bajo courseId_sectionId.
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
// FUNCIONES AUXILIARES
// Replican la lógica de saveStudent() y getAllStudentNames()
// en seccionespecifica.js
// ================================================================

/**
 * Recoge los nombres de todos los alumnos existentes (en minúsculas).
 * Replica: getAllStudentNames() en seccionespecifica.js
 * — agrupa por clave grade_letter para evitar duplicar alumnos
 *   presentes en más de un curso con la misma sección.
 *
 * @param {Array<{name: string}>} alumnos - Lista de alumnos de la sección
 * @returns {Set<string>} Conjunto de nombres en minúsculas
 */
function obtenerNombresExistentes(alumnos) {
  const nombres = new Set();
  alumnos.forEach(a => nombres.add(a.name.toLowerCase()));
  return nombres;
}

/**
 * Valida el formulario de registro individual de un alumno.
 * Sigue el mismo orden de comprobaciones que saveStudent():
 *   1. nombre vacío
 *   2. nombre ya registrado (comparación insensible a mayúsculas)
 *
 * @param {string}     nombre            - Valor del campo "nombre del alumno"
 * @param {Set<string>} nombresExistentes - Nombres actuales en minúsculas
 * @returns {string|null} Mensaje de error, o null si el dato es válido
 */
function validarAlumno(nombre, nombresExistentes) {
  const name = (nombre || '').trim();

  if (!name) return 'Ingresa el nombre del alumno';

  if (nombresExistentes.has(name.toLowerCase()))
    return 'Este alumno ya está registrado en el sistema';

  return null;
}

// ================================================================
// DATOS DE PRUEBA
// ================================================================

const CURSO_ID    = 'curso_1';
const SECCION_ID  = 'sec_1';
const CLAVE_SALON = '3°_A';   // grade_letter → clave real en students

// Alumnos ya registrados en la sección
const ALUMNOS_EXISTENTES = [
  { id: 'alu_1', name: 'Ana Torres' },
  { id: 'alu_2', name: 'Luis Pérez' },
];

// Cuerpo válido para PUT /api/db con el nuevo alumno incluido
const DB_CON_ALUMNO_NUEVO = {
  courses: [{ id: CURSO_ID, name: 'Matemáticas', color: '#3B6FA0', competencias: {} }],
  sections: {
    [CURSO_ID]: [{ id: SECCION_ID, grade: '3°', letter: 'A', competencias: {} }],
  },
  students: {
    [CLAVE_SALON]: [
      ...ALUMNOS_EXISTENTES,
      { id: 'alu_nuevo_001', name: 'María García' },
    ],
  },
  activities:        {},
  grades:            {},
  users:             [],
  scheduleReference: { days: [], timeSlots: [] },
};

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 8 — Registro individual de alumno', () => {

  // --------------------------------------------------------------
  // E1 — Nombre vacío
  // Capa: frontend (seccionespecifica.js › saveStudent)
  // --------------------------------------------------------------
  describe('E1 — Nombre vacío', () => {
    test('muestra "Ingresa el nombre del alumno" cuando el campo está vacío', () => {
      // Arrange
      const nombre            = '';
      const nombresExistentes = obtenerNombresExistentes(ALUMNOS_EXISTENTES);

      // Act
      const resultado = validarAlumno(nombre, nombresExistentes);

      // Assert
      expect(resultado).toBe('Ingresa el nombre del alumno');
    });

    test('muestra el error también cuando el nombre contiene solo espacios', () => {
      // Arrange
      const nombre            = '   ';
      const nombresExistentes = obtenerNombresExistentes(ALUMNOS_EXISTENTES);

      // Act
      const resultado = validarAlumno(nombre, nombresExistentes);

      // Assert
      expect(resultado).toBe('Ingresa el nombre del alumno');
    });
  });

  // --------------------------------------------------------------
  // E2 — Alumno ya existente
  // Capa: frontend (seccionespecifica.js › saveStudent)
  // --------------------------------------------------------------
  describe('E2 — Alumno ya existente', () => {
    test('muestra "Este alumno ya está registrado en el sistema" con nombre exacto duplicado', () => {
      // Arrange
      const nombre            = 'Ana Torres';   // ya existe en la sección
      const nombresExistentes = obtenerNombresExistentes(ALUMNOS_EXISTENTES);

      // Act
      const resultado = validarAlumno(nombre, nombresExistentes);

      // Assert
      expect(resultado).toBe('Este alumno ya está registrado en el sistema');
    });

    test('la comparación es insensible a mayúsculas y minúsculas', () => {
      // Arrange — mismo nombre pero en mayúsculas
      const nombre            = 'ANA TORRES';
      const nombresExistentes = obtenerNombresExistentes(ALUMNOS_EXISTENTES);

      // Act
      const resultado = validarAlumno(nombre, nombresExistentes);

      // Assert
      expect(resultado).toBe('Este alumno ya está registrado en el sistema');
    });

    test('detecta el duplicado aunque el nombre tenga espacios al inicio o al final', () => {
      // Arrange
      const nombre            = '  Luis Pérez  ';
      const nombresExistentes = obtenerNombresExistentes(ALUMNOS_EXISTENTES);

      // Act
      const resultado = validarAlumno(nombre, nombresExistentes);

      // Assert
      expect(resultado).toBe('Este alumno ya está registrado en el sistema');
    });
  });

  // --------------------------------------------------------------
  // E3 — Caso exitoso
  // Capa: frontend (validación) + servidor (PUT /api/db)
  // --------------------------------------------------------------
  describe('E3 — Caso exitoso', () => {
    test('no retorna error cuando el nombre es nuevo y no está vacío', () => {
      // Arrange
      const nombre            = 'María García';   // nombre nuevo
      const nombresExistentes = obtenerNombresExistentes(ALUMNOS_EXISTENTES);

      // Act
      const resultado = validarAlumno(nombre, nombresExistentes);

      // Assert
      expect(resultado).toBeNull();
    });

    test('el servidor recibe y guarda la lista de alumnos con el nuevo alumno incluido', async () => {
      // Arrange
      saveDbJson.mockResolvedValue(undefined);

      // Act — el frontend llama a PUT /api/db tras añadir el alumno
      const respuesta = await request(app)
        .put('/api/db')
        .set('x-user-id', 'user_001')
        .send(DB_CON_ALUMNO_NUEVO);

      // Assert
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.ok).toBe(true);

      // Verifica que el nuevo alumno fue incluido en los datos guardados
      const [, datosGuardados] = saveDbJson.mock.calls[0];
      const alumnos = datosGuardados.students[CLAVE_SALON];
      expect(alumnos).toHaveLength(3);
      expect(alumnos[2].name).toBe('María García');
    });

    test('los alumnos anteriores permanecen intactos tras agregar uno nuevo', async () => {
      // Arrange
      saveDbJson.mockResolvedValue(undefined);

      // Act
      await request(app)
        .put('/api/db')
        .set('x-user-id', 'user_001')
        .send(DB_CON_ALUMNO_NUEVO);

      // Assert
      const [, datosGuardados] = saveDbJson.mock.calls[0];
      const alumnos = datosGuardados.students[CLAVE_SALON];
      expect(alumnos[0].name).toBe('Ana Torres');
      expect(alumnos[1].name).toBe('Luis Pérez');
    });
  });

});
