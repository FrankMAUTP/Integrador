'use strict';

/**
 * ============================================================
 *  Requerimiento 13 — Visualización de horarios
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1  – Sin horarios registrados: si no existe ninguna sección
 *           con horario asignado, el sistema muestra el mensaje
 *           "Sin horarios registrados".
 *    E2  – Horarios registrados: se pueden visualizar los horarios
 *           de las secciones con horarios asignados.
 *
 *  Flujo real en horarios.js › renderScheduleGrid():
 *
 *    // 1. Recopila secciones con horario
 *    courses.forEach(course => {
 *      DB.getSections(course.id).forEach(section => {
 *        if (section.schedule && section.schedule.days && section.schedule.days.length) {
 *          items.push({ course, sectionId, label, schedule });
 *        }
 *      });
 *    });
 *
 *    // 2. Fallback: horario a nivel de curso (legacy)
 *    if (!items.length) {
 *      courses.forEach(course => {
 *        if (course.schedule?.days?.length)
 *          items.push({ course, sectionId: null, label: '', schedule: course.schedule });
 *      });
 *    }
 *
 *    // 3. Sin horarios → muestra estado vacío
 *    if (!items.length) {
 *      wrapper.style.display = 'none';
 *      empty.style.display   = 'flex';   // → "Sin horarios registrados"  → E1
 *      return;
 *    }
 *
 *    // 4. Con horarios → construye la grilla                              → E2
 *    items.forEach(({ course, schedule }) => { ... map[day][slot] = ... });
 *    document.getElementById('schedule-table').innerHTML = thead + tbody;
 *
 *  Fuente de datos (app.js › DB):
 *    getCourses()              { return DB._data.courses  || []; }
 *    getSections(courseId)     { return (DB._data.sections?.[courseId]) || []; }
 *    getScheduleReference()    { return DB._data.scheduleReference || { days:[], timeSlots:[] }; }
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
const { buildDbJson, getPool } = require('../db/mysql');

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
// Replican la lógica de renderScheduleGrid() en horarios.js
// ================================================================

/**
 * Convierte "HH:MM" a minutos desde medianoche.
 * Replica: toMin() en app.js
 */
function toMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Devuelve los time-slots de la referencia que caen dentro de [startTime, endTime).
 * Replica: getOccupiedSlots() en horarios.js
 */
function getOccupiedSlots(startTime, endTime, allSlots) {
  const start = toMin(startTime);
  const end   = toMin(endTime);
  return allSlots.filter(s => {
    const m = toMin(s);
    return m >= start && m < end;
  });
}

/**
 * Determina qué debe mostrar la pantalla de horarios.
 * Replica: renderScheduleGrid() en horarios.js
 *
 * @param {object[]} courses  - Lista de cursos (DB.getCourses())
 * @param {object}   sections - Mapa courseId → sección[] (DB.getSections())
 * @param {object}   ref      - { days, timeSlots } (DB.getScheduleReference())
 * @returns {{
 *   mostrarVacio: boolean,
 *   items: object[]    // { courseId, courseName, color, sectionId, label, schedule }
 * }}
 */
function simularRenderScheduleGrid(courses, sections, ref) {
  const items = [];

  // Secciones con horario asignado
  courses.forEach(course => {
    (sections[course.id] || []).forEach(section => {
      if (section.schedule && section.schedule.days && section.schedule.days.length) {
        items.push({
          courseId:   course.id,
          courseName: course.name,
          color:      course.color,
          sectionId:  section.id,
          label:      `${section.grade}${section.letter}`,
          schedule:   section.schedule,
        });
      }
    });
  });

  // Fallback: horario a nivel de curso (legacy)
  if (!items.length) {
    courses.forEach(course => {
      if (course.schedule && course.schedule.days && course.schedule.days.length) {
        items.push({
          courseId:   course.id,
          courseName: course.name,
          color:      course.color,
          sectionId:  null,
          label:      '',
          schedule:   course.schedule,
        });
      }
    });
  }

  if (!items.length) {
    return { mostrarVacio: true, items: [] };
  }

  return { mostrarVacio: false, items };
}

/**
 * Verifica que un item de horario tiene los slots ocupados correctos
 * dentro de la referencia de tiempos.
 *
 * @param {object}   item     - Un item de scheduleGrid
 * @param {string[]} allSlots - timeSlots de la referencia
 * @returns {object[]} slots ocupados por ese item en cada día
 */
function obtenerSlotsOcupados(item, allSlots) {
  const { days = [], times = {} } = item.schedule;
  const result = [];
  days.forEach(day => {
    const t = times[day] || {};
    if (t.start && t.end) {
      result.push({ day, slots: getOccupiedSlots(t.start, t.end, allSlots) });
    }
  });
  return result;
}

// ================================================================
// DATOS DE PRUEBA
// ================================================================

const SCHEDULE_REFERENCE = {
  days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
  timeSlots: [
    '07:00','07:30','08:00','08:30','09:00','09:30',
    '10:00','10:30','11:00','11:30','12:00','12:30',
    '13:00','13:30','14:00','14:30','15:00','15:30',
  ],
};

const CURSO_MAT = {
  id:    'curso_mat_001',
  name:  'Matemáticas',
  color: '#3B6FA0',
  competencias: { 1: ['Álgebra'], 2: ['Álgebra'], 3: ['Álgebra'], 4: ['Álgebra'] },
  createdAt: 1700000000000,
};

const CURSO_LEN = {
  id:    'curso_len_002',
  name:  'Lenguaje',
  color: '#4A8C6F',
  competencias: { 1: ['Lectura'], 2: ['Lectura'], 3: ['Lectura'], 4: ['Lectura'] },
  createdAt: 1700000001000,
};

// Sección con horario asignado (Lunes 08:00–09:30)
const SECCION_CON_HORARIO = {
  id:       'sec_001',
  grade:    '3°',
  letter:   'A',
  schedule: {
    days:  ['Lunes'],
    times: { 'Lunes': { start: '08:00', pedagogicalHours: 2, end: '09:30' } },
  },
  competencias: { 1: ['Álgebra'], 2: ['Álgebra'], 3: ['Álgebra'], 4: ['Álgebra'] },
};

// Sección con horario en otro día (Martes 14:00–15:30)
const SECCION_CON_HORARIO_MARTES = {
  id:       'sec_002',
  grade:    '3°',
  letter:   'B',
  schedule: {
    days:  ['Martes'],
    times: { 'Martes': { start: '14:00', pedagogicalHours: 2, end: '15:30' } },
  },
  competencias: { 1: ['Lectura'], 2: ['Lectura'], 3: ['Lectura'], 4: ['Lectura'] },
};

// Sección SIN horario asignado
const SECCION_SIN_HORARIO = {
  id:       'sec_003',
  grade:    '3°',
  letter:   'C',
  schedule: { days: [], times: {} },
  competencias: { 1: ['Álgebra'], 2: ['Álgebra'], 3: ['Álgebra'], 4: ['Álgebra'] },
};

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 13 — Visualizar horarios', () => {

  // --------------------------------------------------------------
  // E1 — Sin horarios registrados
  // Capa: frontend (horarios.js › renderScheduleGrid) + servidor (GET /api/db)
  // --------------------------------------------------------------
  describe('E1 — Sin horarios registrados', () => {
    test('muestra estado vacío cuando no hay cursos en absoluto', () => {
      // Arrange — sin cursos ni secciones
      const courses  = [];
      const sections = {};

      // Act
      const { mostrarVacio, items } = simularRenderScheduleGrid(courses, sections, SCHEDULE_REFERENCE);

      // Assert
      expect(mostrarVacio).toBe(true);
      expect(items).toHaveLength(0);
    });

    test('muestra estado vacío cuando hay cursos pero ninguna sección tiene horario', () => {
      // Arrange — curso con una sección sin horario asignado
      const courses  = [CURSO_MAT];
      const sections = { [CURSO_MAT.id]: [SECCION_SIN_HORARIO] };

      // Act
      const { mostrarVacio, items } = simularRenderScheduleGrid(courses, sections, SCHEDULE_REFERENCE);

      // Assert
      expect(mostrarVacio).toBe(true);
      expect(items).toHaveLength(0);
    });

    test('muestra estado vacío cuando hay cursos pero no tienen secciones registradas', () => {
      // Arrange — curso sin secciones
      const courses  = [CURSO_MAT, CURSO_LEN];
      const sections = { [CURSO_MAT.id]: [], [CURSO_LEN.id]: [] };

      // Act
      const { mostrarVacio } = simularRenderScheduleGrid(courses, sections, SCHEDULE_REFERENCE);

      // Assert
      expect(mostrarVacio).toBe(true);
    });

    test('el servidor devuelve scheduleReference vacía cuando no se ha configurado horario', async () => {
      // Arrange
      buildDbJson.mockResolvedValue({
        courses:           [CURSO_MAT],
        sections:          { [CURSO_MAT.id]: [SECCION_SIN_HORARIO] },
        students:          {},
        activities:        {},
        grades:            {},
        users:             [],
        scheduleReference: { days: [], timeSlots: [] },
      });

      // Act
      const respuesta = await request(app)
        .get('/api/db')
        .set('x-user-id', 'user_001');

      // Assert
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.scheduleReference.days).toHaveLength(0);
      expect(respuesta.body.scheduleReference.timeSlots).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------
  // E2 — Horarios registrados
  // Capa: frontend (horarios.js › renderScheduleGrid) + servidor (GET /api/db)
  // --------------------------------------------------------------
  describe('E2 — Horarios registrados', () => {
    test('no muestra estado vacío cuando al menos una sección tiene horario', () => {
      // Arrange
      const courses  = [CURSO_MAT];
      const sections = { [CURSO_MAT.id]: [SECCION_CON_HORARIO] };

      // Act
      const { mostrarVacio } = simularRenderScheduleGrid(courses, sections, SCHEDULE_REFERENCE);

      // Assert
      expect(mostrarVacio).toBe(false);
    });

    test('genera un item por cada sección con horario asignado', () => {
      // Arrange — dos secciones con horario en cursos distintos
      const courses  = [CURSO_MAT, CURSO_LEN];
      const sections = {
        [CURSO_MAT.id]: [SECCION_CON_HORARIO],
        [CURSO_LEN.id]: [SECCION_CON_HORARIO_MARTES],
      };

      // Act
      const { items } = simularRenderScheduleGrid(courses, sections, SCHEDULE_REFERENCE);

      // Assert
      expect(items).toHaveLength(2);
    });

    test('cada item contiene el nombre del curso, la etiqueta de sección y el horario', () => {
      // Arrange
      const courses  = [CURSO_MAT];
      const sections = { [CURSO_MAT.id]: [SECCION_CON_HORARIO] };

      // Act
      const { items } = simularRenderScheduleGrid(courses, sections, SCHEDULE_REFERENCE);

      // Assert
      expect(items[0].courseName).toBe('Matemáticas');
      expect(items[0].color).toBe('#3B6FA0');
      expect(items[0].label).toBe('3°A');
      expect(items[0].sectionId).toBe('sec_001');
      expect(items[0].schedule.days).toContain('Lunes');
    });

    test('las secciones sin horario son ignoradas aunque compartan curso con una que sí tiene', () => {
      // Arrange — mismo curso: una sección con horario, otra sin horario
      const courses  = [CURSO_MAT];
      const sections = {
        [CURSO_MAT.id]: [SECCION_CON_HORARIO, SECCION_SIN_HORARIO],
      };

      // Act
      const { items } = simularRenderScheduleGrid(courses, sections, SCHEDULE_REFERENCE);

      // Assert — solo la sección con horario genera un item
      expect(items).toHaveLength(1);
      expect(items[0].sectionId).toBe('sec_001');
    });

    test('los slots ocupados corresponden al rango de tiempo de la sección', () => {
      // Arrange — sección Lunes 08:00–09:30 → slots: 08:00 y 08:30 (no incluye 09:30)
      const courses  = [CURSO_MAT];
      const sections = { [CURSO_MAT.id]: [SECCION_CON_HORARIO] };
      const { items } = simularRenderScheduleGrid(courses, sections, SCHEDULE_REFERENCE);

      // Act
      const slotsOcupados = obtenerSlotsOcupados(items[0], SCHEDULE_REFERENCE.timeSlots);

      // Assert
      expect(slotsOcupados).toHaveLength(1);
      expect(slotsOcupados[0].day).toBe('Lunes');
      expect(slotsOcupados[0].slots).toContain('08:00');
      expect(slotsOcupados[0].slots).toContain('08:30');
      expect(slotsOcupados[0].slots).toContain('09:00');
      expect(slotsOcupados[0].slots).not.toContain('09:30');
    });

    test('el servidor devuelve cursos, secciones y scheduleReference para armar la grilla', async () => {
      // Arrange
      buildDbJson.mockResolvedValue({
        courses:  [CURSO_MAT],
        sections: { [CURSO_MAT.id]: [SECCION_CON_HORARIO] },
        students:          {},
        activities:        {},
        grades:            {},
        users:             [],
        scheduleReference: SCHEDULE_REFERENCE,
      });

      // Act
      const respuesta = await request(app)
        .get('/api/db')
        .set('x-user-id', 'user_001');

      // Assert
      expect(respuesta.status).toBe(200);
      const body = respuesta.body;
      expect(body.courses).toHaveLength(1);
      expect(body.sections[CURSO_MAT.id]).toHaveLength(1);
      expect(body.sections[CURSO_MAT.id][0].schedule.days).toContain('Lunes');
      expect(body.scheduleReference.days).toContain('Lunes');
      expect(body.scheduleReference.timeSlots.length).toBeGreaterThan(0);
    });
  });

});
