'use strict';

/**
 * ============================================================
 *  Requerimiento 11 — El docente debe poder crear secciones
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1  – Sección ya existente: la combinación grado+letra ya
 *           está registrada → "Esa sección ya existe"
 *    E2  – Cruce de horarios: el nuevo horario se solapa con
 *           uno existente → "Conflicto de horario → <detalle>"
 *    E3  – Caso exitoso: sección nueva creada y persistida
 *
 *  Flujo real en secciones.js › saveSection():
 *    // (Modo creación — sin editingSectionId)
 *    const exists = sections.find(s => s.grade === grade && s.letter === letter);
 *    if (exists) showToast('Esa sección ya existe', 'error');            → E1
 *
 *    const conflicts = getScheduleConflicts(schedule, null);
 *    if (conflicts.length)
 *      showToast(`Conflicto de horario → ${detail}`, 'error', 5000);    → E2
 *
 *    sections.push({ id, grade, letter, schedule, competencias, ... });
 *    DB.saveSections(courseId, sections);  // → PUT /api/db              → E3
 *
 *  Lógica de solapamiento (getScheduleConflicts):
 *    const s1 = toMin(t1.start), e1 = toMin(t1.end);
 *    const s2 = toMin(t2.start), e2 = toMin(t2.end);
 *    if (s1 < e2 && s2 < e1)  → hay conflicto
 *
 *  toMin('HH:MM') → horas*60 + minutos
 *  calcEndTime: endMin = toMin(start) + pedagogicalHours * 45
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
// Replican la lógica de saveSection() y getScheduleConflicts()
// en secciones.js
// ================================================================

/**
 * Convierte una hora "HH:MM" a minutos totales desde medianoche.
 * Replica: toMin() en app.js
 */
function toMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Verifica si una sección con el mismo grado y letra ya existe en el curso.
 * Replica: sections.find(s => s.grade === grade && s.letter === letter)
 *          → showToast('Esa sección ya existe', 'error')  en saveSection()
 *
 * @param {string}   grade               - Grado seleccionado (ej. '3°')
 * @param {string}   letter              - Letra seleccionada (ej. 'A')
 * @param {object[]} seccionesExistentes - Secciones ya registradas en el curso
 * @returns {string|null} Mensaje de error o null si la sección es nueva
 */
function validarSeccionDuplicada(grade, letter, seccionesExistentes) {
  const existe = seccionesExistentes.find(
    s => s.grade === grade && s.letter === letter
  );
  if (existe) return 'Esa sección ya existe';
  return null;
}

/**
 * Detecta solapamientos de horario entre una sección nueva y las existentes.
 * Replica: getScheduleConflicts(schedule, excludeSectionId) en secciones.js
 *
 * Condición de solapamiento: s1 < e2 && s2 < e1
 *
 * @param {object}   scheduleNuevo       - { days, times: { day: { start, end } } }
 * @param {object[]} seccionesExistentes - Secciones con su campo `schedule`
 * @returns {object[]} Array de conflictos { day, sectionLabel, time }
 */
function detectarConflictosHorario(scheduleNuevo, seccionesExistentes) {
  const conflicts = [];
  const { days = [], times = {} } = scheduleNuevo;
  if (!days.length) return conflicts;

  seccionesExistentes.forEach(sec => {
    if (!sec.schedule?.days?.length) return;

    days.forEach(day => {
      if (!sec.schedule.days.includes(day)) return;

      const t1 = times[day];
      const t2 = sec.schedule.times?.[day];
      if (!t1?.start || !t1?.end || !t2?.start || !t2?.end) return;

      const s1 = toMin(t1.start), e1 = toMin(t1.end);
      const s2 = toMin(t2.start), e2 = toMin(t2.end);

      if (s1 < e2 && s2 < e1) {
        conflicts.push({
          day,
          sectionLabel: `${sec.grade} "${sec.letter}"`,
          time: `${t2.start}–${t2.end}`,
        });
      }
    });
  });

  return conflicts;
}

/**
 * Construye el mensaje de toast cuando hay conflictos de horario.
 * Replica: `Conflicto de horario → ${detail}` en saveSection()
 */
function mensajeConflicto(conflicts) {
  const detail = conflicts
    .map(c => `${c.day}: ${c.sectionLabel} (${c.time})`)
    .join(' | ');
  return `Conflicto de horario → ${detail}`;
}

// ================================================================
// DATOS DE PRUEBA
// ================================================================

const CURSO_ID = 'curso_1';

// Horario mañana: Lunes 08:00 → 08:00 + 2*45min = 09:30
const HORARIO_LUNES_MANANA = {
  days: ['Lunes'],
  times: { 'Lunes': { start: '08:00', pedagogicalHours: 2, end: '09:30' } },
};

// Horario tarde: Lunes 14:00 → 14:00 + 2*45min = 15:30 (sin solapamiento)
const HORARIO_LUNES_TARDE = {
  days: ['Lunes'],
  times: { 'Lunes': { start: '14:00', pedagogicalHours: 2, end: '15:30' } },
};

// Secciones existentes en el curso
const SECCIONES_EXISTENTES = [
  {
    id:      'sec_1',
    grade:   '3°',
    letter:  'A',
    schedule: HORARIO_LUNES_MANANA,
    competencias: { 1: ['C1'], 2: ['C1'], 3: ['C1'], 4: ['C1'] },
  },
];

// Cuerpo para PUT /api/db con la sección nueva incluida
const DB_CON_SECCION_NUEVA = {
  courses: [{ id: CURSO_ID, name: 'Matemáticas', color: '#3B6FA0', competencias: {} }],
  sections: {
    [CURSO_ID]: [
      ...SECCIONES_EXISTENTES,
      {
        id:       'sec_nueva_001',
        grade:    '3°',
        letter:   'B',
        schedule:  HORARIO_LUNES_TARDE,
        competencias: { 1: ['C1'], 2: ['C1'], 3: ['C1'], 4: ['C1'] },
        createdAt: 1700000000000,
      },
    ],
  },
  students:          { '3°_A': [] },
  activities:        {},
  grades:            {},
  users:             [],
  scheduleReference: { days: [], timeSlots: [] },
};

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 11 — Crear sección', () => {

  // --------------------------------------------------------------
  // E1 — Sección ya existente
  // Capa: frontend (secciones.js › saveSection)
  // --------------------------------------------------------------
  describe('E1 — Sección ya existente', () => {
    test('muestra "Esa sección ya existe" al intentar crear una sección con grado y letra iguales', () => {
      // Arrange — ya existe '3° A'
      const grade  = '3°';
      const letter = 'A';

      // Act
      const resultado = validarSeccionDuplicada(grade, letter, SECCIONES_EXISTENTES);

      // Assert
      expect(resultado).toBe('Esa sección ya existe');
    });

    test('la comparación es exacta: grado diferente no produce error', () => {
      // Arrange — existe '3° A', se intenta crear '4° A'
      const grade  = '4°';
      const letter = 'A';

      // Act
      const resultado = validarSeccionDuplicada(grade, letter, SECCIONES_EXISTENTES);

      // Assert
      expect(resultado).toBeNull();
    });

    test('la comparación es exacta: letra diferente no produce error', () => {
      // Arrange — existe '3° A', se intenta crear '3° B'
      const grade  = '3°';
      const letter = 'B';

      // Act
      const resultado = validarSeccionDuplicada(grade, letter, SECCIONES_EXISTENTES);

      // Assert
      expect(resultado).toBeNull();
    });
  });

  // --------------------------------------------------------------
  // E2 — Cruce de horarios
  // Capa: frontend (secciones.js › getScheduleConflicts)
  // --------------------------------------------------------------
  describe('E2 — Cruce de horarios', () => {
    test('detecta conflicto cuando el nuevo horario se solapa con uno existente', () => {
      // Arrange — nueva sección quiere Lunes 08:00-09:30 (igual que sec_1)
      const scheduleNuevo = HORARIO_LUNES_MANANA;

      // Act
      const conflicts = detectarConflictosHorario(scheduleNuevo, SECCIONES_EXISTENTES);

      // Assert
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].day).toBe('Lunes');
    });

    test('detecta conflicto cuando los horarios se solapan parcialmente', () => {
      // Arrange — nueva sección: Lunes 09:00-10:30 (se solapa con 08:00-09:30)
      const scheduleNuevo = {
        days: ['Lunes'],
        times: { 'Lunes': { start: '09:00', pedagogicalHours: 2, end: '10:30' } },
      };

      // Act
      const conflicts = detectarConflictosHorario(scheduleNuevo, SECCIONES_EXISTENTES);

      // Assert
      expect(conflicts).toHaveLength(1);
    });

    test('el mensaje de conflicto comienza con "Conflicto de horario →"', () => {
      // Arrange
      const scheduleNuevo = HORARIO_LUNES_MANANA;
      const conflicts     = detectarConflictosHorario(scheduleNuevo, SECCIONES_EXISTENTES);

      // Act
      const mensaje = mensajeConflicto(conflicts);

      // Assert
      expect(mensaje).toMatch(/^Conflicto de horario →/);
      expect(mensaje).toContain('Lunes');
    });

    test('no hay conflicto cuando el nuevo horario es en un día diferente', () => {
      // Arrange — nueva sección: Martes 08:00-09:30 (la existente es solo Lunes)
      const scheduleNuevo = {
        days: ['Martes'],
        times: { 'Martes': { start: '08:00', pedagogicalHours: 2, end: '09:30' } },
      };

      // Act
      const conflicts = detectarConflictosHorario(scheduleNuevo, SECCIONES_EXISTENTES);

      // Assert
      expect(conflicts).toHaveLength(0);
    });

    test('no hay conflicto cuando los horarios no se solapan (tarde vs mañana)', () => {
      // Arrange — nueva sección: Lunes 14:00-15:30, existente: Lunes 08:00-09:30
      const scheduleNuevo = HORARIO_LUNES_TARDE;

      // Act
      const conflicts = detectarConflictosHorario(scheduleNuevo, SECCIONES_EXISTENTES);

      // Assert
      expect(conflicts).toHaveLength(0);
    });

    test('no hay conflicto cuando la sección nueva no tiene horario asignado', () => {
      // Arrange — sin horario seleccionado (days vacío)
      const scheduleNuevo = { days: [], times: {} };

      // Act
      const conflicts = detectarConflictosHorario(scheduleNuevo, SECCIONES_EXISTENTES);

      // Assert
      expect(conflicts).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------
  // E3 — Caso exitoso
  // Capa: frontend (validaciones pasan) + servidor (PUT /api/db)
  // --------------------------------------------------------------
  describe('E3 — Caso exitoso', () => {
    test('no hay error de duplicado cuando grado y letra son únicos en el curso', () => {
      // Arrange — nueva sección '3° B' (no existe aún)
      const grade  = '3°';
      const letter = 'B';

      // Act
      const resultado = validarSeccionDuplicada(grade, letter, SECCIONES_EXISTENTES);

      // Assert
      expect(resultado).toBeNull();
    });

    test('no hay conflicto de horario cuando el nuevo horario es compatible', () => {
      // Arrange — nueva sección con horario de tarde (sin solapamiento)
      const scheduleNuevo = HORARIO_LUNES_TARDE;

      // Act
      const conflicts = detectarConflictosHorario(scheduleNuevo, SECCIONES_EXISTENTES);

      // Assert
      expect(conflicts).toHaveLength(0);
    });

    test('el servidor recibe y guarda la nueva sección vía PUT /api/db', async () => {
      // Arrange
      saveDbJson.mockResolvedValue(undefined);

      // Act — el frontend llama a PUT /api/db tras crear la sección
      const respuesta = await request(app)
        .put('/api/db')
        .set('x-user-id', 'user_001')
        .send(DB_CON_SECCION_NUEVA);

      // Assert
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.ok).toBe(true);

      // Verifica que las dos secciones fueron guardadas
      const [, datosGuardados] = saveDbJson.mock.calls[0];
      const secciones = datosGuardados.sections[CURSO_ID];
      expect(secciones).toHaveLength(2);
      expect(secciones[1].grade).toBe('3°');
      expect(secciones[1].letter).toBe('B');
    });

    test('la sección original no se ve afectada al agregar una nueva', async () => {
      // Arrange
      saveDbJson.mockResolvedValue(undefined);

      // Act
      await request(app)
        .put('/api/db')
        .set('x-user-id', 'user_001')
        .send(DB_CON_SECCION_NUEVA);

      // Assert
      const [, datosGuardados] = saveDbJson.mock.calls[0];
      const secciones = datosGuardados.sections[CURSO_ID];
      expect(secciones[0].id).toBe('sec_1');
      expect(secciones[0].grade).toBe('3°');
      expect(secciones[0].letter).toBe('A');
    });
  });

});
