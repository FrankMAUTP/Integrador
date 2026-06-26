'use strict';

/**
 * ============================================================
 *  Requerimiento 5 — Gráficos de rendimiento académico
 *                    de un alumno por competencia y bimestre
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1  – Competencia sin actividades asignadas →
 *           muestra "Sin actividades en esta competencia"
 *    E2  – Caso exitoso: gráfico de barras generado con
 *           actividades y notas correctas
 *
 *  Las funciones evaluadas replican la lógica de:
 *    - openChartModal()   (filtrado de actividades)
 *    - drawGradeChart()   (decisión de renderizar o mostrar aviso)
 *  ambas en seccionespecifica.js
 */

// ================================================================
// MOCKS  (deben declararse antes de cualquier require)
// ================================================================

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
// Replican la lógica de openChartModal() y drawGradeChart()
// en seccionespecifica.js
// ================================================================

/**
 * Filtra las actividades de una competencia específica en un bimestre.
 * Replica: getFilteredActivities(bim, compIdx)
 */
function obtenerActividadesCompetencia(actividades, bimestre, competenciaIdx) {
  return (actividades || []).filter(
    a => a.bimestre === bimestre && a.competenciaIdx === competenciaIdx
  );
}

/**
 * Determina qué se renderiza en el modal del gráfico.
 * Replica: el bloque "Sin actividades" dentro de drawGradeChart()
 * @returns {'Sin actividades en esta competencia'|'grafico'}
 */
function determinarContenidoGrafico(actividades) {
  if (!actividades || actividades.length === 0)
    return 'Sin actividades en esta competencia';
  return 'grafico';
}

/**
 * Prepara los puntos de datos para el gráfico de barras.
 * Replica: el bucle activities.forEach() en drawGradeChart()
 */
const GRADE_VALUE = { AD: 4, A: 3, B: 2.5, C: 1 };

function prepararDatosGrafico(actividades, notasAlumno) {
  return actividades.map(act => ({
    nombre: act.name,
    nota:   notasAlumno[act.id] || '-',
    valor:  GRADE_VALUE[notasAlumno[act.id]] ?? 0,
  }));
}

// ================================================================
// DATOS DE PRUEBA
// ================================================================

const CURSO_ID   = 'curso_1';
const SECCION_ID = 'sec_1';
const CLAVE_SEC  = `${CURSO_ID}_${SECCION_ID}`;

// Actividades: 2 en competencia 0, ninguna en competencia 1
const TODAS_LAS_ACTIVIDADES = [
  { id: 'act_1', name: 'Práctica 1',   bimestre: 1, competenciaIdx: 0, type: 'practica'  },
  { id: 'act_2', name: 'Exposición 1', bimestre: 1, competenciaIdx: 0, type: 'exposicion' },
  { id: 'act_3', name: 'Práctica 2',   bimestre: 2, competenciaIdx: 0, type: 'practica'  },
];

const DB_SIN_ACTIVIDADES = {
  courses: [{ id: CURSO_ID, name: 'Matemáticas', color: '#3B6FA0', competencias: {} }],
  sections: { [CURSO_ID]: [{ id: SECCION_ID, grade: '3°', letter: 'A', competencias: {} }] },
  students:  { '3°_A': [{ id: 'alu_1', name: 'Ana Torres' }] },
  activities: {},
  grades:     {},
  users:      [],
  scheduleReference: { days: [], timeSlots: [] },
};

const DB_COMPLETO = {
  ...DB_SIN_ACTIVIDADES,
  activities: { [CLAVE_SEC]: TODAS_LAS_ACTIVIDADES },
  grades: {
    [CLAVE_SEC]: {
      'alu_1': { 'act_1': 'A', 'act_2': 'AD' },
    },
  },
};

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 5 — Gráficos de rendimiento académico', () => {

  // --------------------------------------------------------------
  // E1 — Competencia sin actividades asignadas
  // Capa: frontend (seccionespecifica.js › drawGradeChart)
  // --------------------------------------------------------------
  describe('E1 — Competencia sin actividades asignadas', () => {
    test('muestra "Sin actividades en esta competencia" cuando el array de actividades está vacío', () => {
      // Arrange
      const actividades = [];

      // Act
      const contenido = determinarContenidoGrafico(actividades);

      // Assert
      expect(contenido).toBe('Sin actividades en esta competencia');
    });

    test('muestra el aviso cuando la competencia seleccionada no tiene actividades en ese bimestre', () => {
      // Arrange — competencia 1 no tiene actividades (solo competencia 0 las tiene)
      const bimestre       = 1;
      const competenciaIdx = 1;

      // Act
      const actsFiltradas = obtenerActividadesCompetencia(
        TODAS_LAS_ACTIVIDADES, bimestre, competenciaIdx
      );
      const contenido = determinarContenidoGrafico(actsFiltradas);

      // Assert
      expect(actsFiltradas).toHaveLength(0);
      expect(contenido).toBe('Sin actividades en esta competencia');
    });

    test('muestra el aviso cuando el bimestre consultado no tiene actividades para esa competencia', () => {
      // Arrange — bimestre 3 no tiene actividades en ninguna competencia
      const bimestre       = 3;
      const competenciaIdx = 0;

      // Act
      const actsFiltradas = obtenerActividadesCompetencia(
        TODAS_LAS_ACTIVIDADES, bimestre, competenciaIdx
      );
      const contenido = determinarContenidoGrafico(actsFiltradas);

      // Assert
      expect(actsFiltradas).toHaveLength(0);
      expect(contenido).toBe('Sin actividades en esta competencia');
    });

    test('la API devuelve activities vacío cuando la sección no tiene actividades creadas', async () => {
      // Arrange
      buildDbJson.mockResolvedValue(DB_SIN_ACTIVIDADES);

      // Act
      const respuesta = await request(app)
        .get('/api/db')
        .set('x-user-id', 'user_001');

      // Assert
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.activities).toEqual({});
    });
  });

  // --------------------------------------------------------------
  // E2 — Caso exitoso: gráfico de barras generado
  // Capa: frontend (filtrado + datos) + servidor (GET /api/db)
  // --------------------------------------------------------------
  describe('E2 — Caso exitoso', () => {
    test('se determina que se debe mostrar el gráfico cuando hay actividades', () => {
      // Arrange
      const actividades = [
        { id: 'act_1', name: 'Práctica 1' },
        { id: 'act_2', name: 'Exposición 1' },
      ];

      // Act
      const contenido = determinarContenidoGrafico(actividades);

      // Assert
      expect(contenido).toBe('grafico');
    });

    test('las actividades se filtran correctamente para la competencia y bimestre seleccionados', () => {
      // Arrange
      const bimestre       = 1;
      const competenciaIdx = 0;

      // Act
      const actsFiltradas = obtenerActividadesCompetencia(
        TODAS_LAS_ACTIVIDADES, bimestre, competenciaIdx
      );

      // Assert
      expect(actsFiltradas).toHaveLength(2);
      expect(actsFiltradas[0].name).toBe('Práctica 1');
      expect(actsFiltradas[1].name).toBe('Exposición 1');
    });

    test('los datos del gráfico se preparan correctamente con las notas del alumno', () => {
      // Arrange
      const actividades = [
        { id: 'act_1', name: 'Práctica 1' },
        { id: 'act_2', name: 'Exposición 1' },
      ];
      const notasAlumno = { 'act_1': 'A', 'act_2': 'AD' };

      // Act
      const datos = prepararDatosGrafico(actividades, notasAlumno);

      // Assert
      expect(datos).toHaveLength(2);
      expect(datos[0]).toMatchObject({ nombre: 'Práctica 1',   nota: 'A',  valor: 3 });
      expect(datos[1]).toMatchObject({ nombre: 'Exposición 1', nota: 'AD', valor: 4 });
    });

    test('la actividad sin nota asignada tiene valor 0 en el gráfico', () => {
      // Arrange
      const actividades = [{ id: 'act_1', name: 'Práctica 1' }];
      const notasAlumno = {};  // sin notas asignadas

      // Act
      const datos = prepararDatosGrafico(actividades, notasAlumno);

      // Assert
      expect(datos[0]).toMatchObject({ nota: '-', valor: 0 });
    });

    test('la API devuelve actividades y notas correctas para renderizar el gráfico', async () => {
      // Arrange
      buildDbJson.mockResolvedValue(DB_COMPLETO);

      // Act
      const respuesta = await request(app)
        .get('/api/db')
        .set('x-user-id', 'user_001');

      // Assert
      expect(respuesta.status).toBe(200);

      const actividades = respuesta.body.activities[CLAVE_SEC];
      const notas       = respuesta.body.grades[CLAVE_SEC];

      expect(actividades).toHaveLength(3);

      // Verificar que las notas del alumno son correctas para el gráfico
      expect(notas['alu_1']['act_1']).toBe('A');
      expect(notas['alu_1']['act_2']).toBe('AD');
    });
  });

});
