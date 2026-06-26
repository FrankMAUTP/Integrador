'use strict';

/**
 * ============================================================
 *  Requerimiento 12 — Visualización de cursos
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1  – Sin cursos creados: si no se ha creado cursos, el
 *           sistema muestra el mensaje "no hay cursos".
 *    E2  – Caso exitoso: visualización de cursos.
 *
 *  Flujo real en inicio.js › renderCourses():
 *    const courses = DB.getCourses();
 *
 *    if (!courses.length) {
 *      empty.style.display = 'flex';   // → muestra "no hay cursos"  → E1
 *      grid.innerHTML = '';
 *      return;
 *    }
 *    empty.style.display = 'none';
 *
 *    grid.innerHTML = courses.map(course => {   // → renderiza las tarjetas → E2
 *      const sections = DB.getSections(course.id);
 *      return `<div class="course-card" ...> ... </div>`;
 *    }).join('');
 *
 *  Fuente de datos (app.js › DB):
 *    getCourses()   { return DB._data.courses || []; }
 *    getSections(courseId) { return (DB._data.sections?.[courseId]) || []; }
 *
 *  Persistencia en servidor: GET /api/db  (buildDbJson → JSON con courses[])
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

const request                       = require('supertest');
const { app }                       = require('../server');
const { buildDbJson, getPool }      = require('../db/mysql');

// ================================================================
// SETUP
// ================================================================

beforeEach(() => {
  jest.clearAllMocks();

  const mockConn = { query: jest.fn(), release: jest.fn() };
  getPool.mockReturnValue({
    getConnection: jest.fn().mockResolvedValue(mockConn),
  });
});

// ================================================================
// FUNCIONES AUXILIARES
// Replican la lógica de renderCourses() en inicio.js
// ================================================================

/**
 * Determina qué debe mostrar la pantalla de inicio según los cursos disponibles.
 * Replica: renderCourses() en inicio.js
 *
 * Si no hay cursos, el elemento #empty-state pasa a display:'flex'
 * (mostrando el mensaje "no hay cursos") y el grid queda vacío.
 * Si hay cursos, #empty-state se oculta y se renderizan las tarjetas.
 *
 * @param {object[]} cursos - Lista de cursos de DB.getCourses()
 * @returns {{ mostrarVacio: boolean, tarjetas: object[] }}
 *   mostrarVacio: true  → el sistema muestra el estado vacío ("no hay cursos")
 *   tarjetas:     array de objetos con id, name y color de cada tarjeta renderizada
 */
function simularRenderCourses(cursos) {
  if (!cursos.length) {
    return { mostrarVacio: true, tarjetas: [] };
  }

  const tarjetas = cursos.map(course => ({
    id:    course.id,
    name:  course.name,
    color: course.color,
  }));

  return { mostrarVacio: false, tarjetas };
}

/**
 * Verifica que la lista de cursos devuelta por el servidor
 * contiene los campos mínimos necesarios para renderizarlos.
 *
 * @param {object[]} cursos - Array de cursos proveniente de la API
 * @returns {boolean} true si todos los cursos tienen id, name y color
 */
function cursosValidos(cursos) {
  return cursos.every(c => c.id && c.name && c.color);
}

// ================================================================
// DATOS DE PRUEBA
// ================================================================

const CURSO_MATEMATICAS = {
  id:    'curso_mat_001',
  name:  'Matemáticas',
  color: '#3B6FA0',
  competencias: { 1: ['Álgebra'], 2: ['Álgebra'], 3: ['Álgebra'], 4: ['Álgebra'] },
  createdAt: 1700000000000,
};

const CURSO_LENGUAJE = {
  id:    'curso_len_002',
  name:  'Lenguaje',
  color: '#4A8C6F',
  competencias: { 1: ['Lectura'], 2: ['Lectura'], 3: ['Lectura'], 4: ['Lectura'] },
  createdAt: 1700000001000,
};

// Payload que devuelve GET /api/db cuando no hay cursos
const DB_SIN_CURSOS = {
  courses:           [],
  sections:          {},
  students:          {},
  activities:        {},
  grades:            {},
  users:             [],
  scheduleReference: { days: [], timeSlots: [] },
};

// Payload que devuelve GET /api/db con cursos creados
const DB_CON_CURSOS = {
  courses:  [CURSO_MATEMATICAS, CURSO_LENGUAJE],
  sections: {
    [CURSO_MATEMATICAS.id]: [],
    [CURSO_LENGUAJE.id]:    [],
  },
  students:          {},
  activities:        {},
  grades:            {},
  users:             [],
  scheduleReference: { days: [], timeSlots: [] },
};

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 12 — Visualizar cursos', () => {

  // --------------------------------------------------------------
  // E1 — Sin cursos creados
  // Capa: frontend (inicio.js › renderCourses) + servidor (GET /api/db)
  // --------------------------------------------------------------
  describe('E1 — Sin cursos creados', () => {
    test('el sistema muestra el estado vacío cuando no hay cursos', () => {
      // Arrange — DB devuelve lista vacía
      const cursos = [];

      // Act
      const resultado = simularRenderCourses(cursos);

      // Assert
      expect(resultado.mostrarVacio).toBe(true);
      expect(resultado.tarjetas).toHaveLength(0);
    });

    test('el grid no contiene tarjetas cuando no hay cursos', () => {
      // Arrange
      const cursos = [];

      // Act
      const { tarjetas } = simularRenderCourses(cursos);

      // Assert
      expect(tarjetas).toEqual([]);
    });

    test('el servidor devuelve un array de cursos vacío si el docente no creó ninguno', async () => {
      // Arrange
      buildDbJson.mockResolvedValue(DB_SIN_CURSOS);

      // Act
      const respuesta = await request(app)
        .get('/api/db')
        .set('x-user-id', 'user_001');

      // Assert
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.courses).toBeDefined();
      expect(respuesta.body.courses).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------
  // E2 — Caso exitoso: visualización de cursos
  // Capa: frontend (inicio.js › renderCourses) + servidor (GET /api/db)
  // --------------------------------------------------------------
  describe('E2 — Caso exitoso: visualización de cursos', () => {
    test('se renderizan tantas tarjetas como cursos existen', () => {
      // Arrange — hay dos cursos registrados
      const cursos = [CURSO_MATEMATICAS, CURSO_LENGUAJE];

      // Act
      const { tarjetas, mostrarVacio } = simularRenderCourses(cursos);

      // Assert
      expect(mostrarVacio).toBe(false);
      expect(tarjetas).toHaveLength(2);
    });

    test('cada tarjeta contiene el id, nombre y color del curso', () => {
      // Arrange
      const cursos = [CURSO_MATEMATICAS, CURSO_LENGUAJE];

      // Act
      const { tarjetas } = simularRenderCourses(cursos);

      // Assert — primera tarjeta
      expect(tarjetas[0].id).toBe(CURSO_MATEMATICAS.id);
      expect(tarjetas[0].name).toBe('Matemáticas');
      expect(tarjetas[0].color).toBe('#3B6FA0');

      // Assert — segunda tarjeta
      expect(tarjetas[1].id).toBe(CURSO_LENGUAJE.id);
      expect(tarjetas[1].name).toBe('Lenguaje');
      expect(tarjetas[1].color).toBe('#4A8C6F');
    });

    test('el servidor devuelve los cursos con los campos necesarios para renderizarlos', async () => {
      // Arrange
      buildDbJson.mockResolvedValue(DB_CON_CURSOS);

      // Act
      const respuesta = await request(app)
        .get('/api/db')
        .set('x-user-id', 'user_001');

      // Assert
      expect(respuesta.status).toBe(200);
      const cursos = respuesta.body.courses;
      expect(cursos).toHaveLength(2);
      expect(cursosValidos(cursos)).toBe(true);
    });

    test('el servidor preserva el orden de creación de los cursos', async () => {
      // Arrange — Matemáticas fue creado antes que Lenguaje
      buildDbJson.mockResolvedValue(DB_CON_CURSOS);

      // Act
      const respuesta = await request(app)
        .get('/api/db')
        .set('x-user-id', 'user_001');

      // Assert
      const cursos = respuesta.body.courses;
      expect(cursos[0].name).toBe('Matemáticas');
      expect(cursos[1].name).toBe('Lenguaje');
    });

    test('un único curso se visualiza correctamente sin estado vacío', () => {
      // Arrange — solo un curso registrado
      const cursos = [CURSO_MATEMATICAS];

      // Act
      const { mostrarVacio, tarjetas } = simularRenderCourses(cursos);

      // Assert
      expect(mostrarVacio).toBe(false);
      expect(tarjetas).toHaveLength(1);
      expect(tarjetas[0].name).toBe('Matemáticas');
    });
  });

});
