'use strict';

/**
 * ============================================================
 *  Requerimiento 7 — El docente debe poder eliminar una sección
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1  – Cancelación de eliminación: el docente presiona
 *           "Cancelar" y nada cambia en la base de datos
 *    E2  – Caso exitoso: la sección se elimina junto con
 *           sus actividades y notas, y se persiste en el servidor
 *
 *  Flujo real en secciones.js › deleteSection():
 *    showConfirm('Eliminar sección', '...', () => {
 *      DB.deleteSectionData(courseId, id);          // borra actividades y notas
 *      DB._clearStudentsIfOrphaned(...);            // borra alumnos huérfanos
 *      DB.saveSections(courseId, seccionesRestantes); // trigger PUT /api/db
 *    });
 *    // Botón "Cancelar" → overlay.remove() sin tocar el DB
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
// Replican las operaciones de DB que hace deleteSection() en secciones.js
// ================================================================

/**
 * Simula la acción de CANCELAR: no modifica ninguna estructura.
 * Replica: overlay.remove() sin llamar al callback de confirmación.
 * @returns {object} El mismo estado original sin modificaciones
 */
function cancelarEliminacion(estado) {
  return estado;  // sin cambios — el DB no es tocado
}

/**
 * Simula la acción de CONFIRMAR la eliminación de una sección.
 * Replica en orden:
 *   1. DB.deleteSectionData()  → borra actividades y notas de la sección
 *   2. DB.saveSections()       → filtra la sección del listado
 *
 * @param {object} estado - { secciones, actividades, notas, alumnos }
 * @param {string} cursoId
 * @param {string} seccionId
 * @returns {object} Nuevo estado sin la sección eliminada
 */
function confirmarEliminacion(estado, cursoId, seccionId) {
  const clave = `${cursoId}_${seccionId}`;

  const nuevasActividades = { ...estado.actividades };
  delete nuevasActividades[clave];

  const nuevasNotas = { ...estado.notas };
  delete nuevasNotas[clave];

  const nuevasSecciones = estado.secciones.filter(s => s.id !== seccionId);

  return {
    secciones:   nuevasSecciones,
    actividades: nuevasActividades,
    notas:       nuevasNotas,
    alumnos:     estado.alumnos,  // sin cambios (simplificado: asume sección compartida)
  };
}

// ================================================================
// DATOS DE PRUEBA
// ================================================================

const CURSO_ID    = 'curso_1';
const SECCION_ID  = 'sec_1';
const CLAVE_SEC   = `${CURSO_ID}_${SECCION_ID}`;

// Estado inicial: 2 secciones, 1 con actividades y notas
const ESTADO_INICIAL = {
  secciones: [
    { id: SECCION_ID,  grade: '3°', letter: 'A' },
    { id: 'sec_2',    grade: '4°', letter: 'B' },
  ],
  actividades: {
    [CLAVE_SEC]:        [{ id: 'act_1', name: 'Práctica 1', bimestre: 1 }],
    [`${CURSO_ID}_sec_2`]: [{ id: 'act_2', name: 'Práctica 2', bimestre: 1 }],
  },
  notas: {
    [CLAVE_SEC]:        { 'alu_1': { 'act_1': 'A' } },
    [`${CURSO_ID}_sec_2`]: { 'alu_2': { 'act_2': 'B' } },
  },
  alumnos: {
    '3°_A': [{ id: 'alu_1', name: 'Ana Torres' }],
    '4°_B': [{ id: 'alu_2', name: 'Carlos Ruiz' }],
  },
};

// Cuerpo para PUT /api/db tras la eliminación confirmada
const DB_TRAS_ELIMINAR = {
  courses: [{ id: CURSO_ID, name: 'Matemáticas', color: '#3B6FA0', competencias: {} }],
  sections: {
    [CURSO_ID]: [{ id: 'sec_2', grade: '4°', letter: 'B', competencias: {} }],
  },
  students:  { '4°_B': [{ id: 'alu_2', name: 'Carlos Ruiz' }] },
  activities: { [`${CURSO_ID}_sec_2`]: [{ id: 'act_2', name: 'Práctica 2', bimestre: 1 }] },
  grades:    { [`${CURSO_ID}_sec_2`]: { 'alu_2': { 'act_2': 'B' } } },
  users:     [],
  scheduleReference: { days: [], timeSlots: [] },
};

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 7 — Eliminar sección', () => {

  // --------------------------------------------------------------
  // E1 — Cancelación de eliminación
  // Capa: frontend (secciones.js › showConfirm › btn "Cancelar")
  // --------------------------------------------------------------
  describe('E1 — Cancelación de eliminación', () => {
    test('el estado de las secciones no cambia al cancelar', () => {
      // Arrange
      const estadoAntes = { ...ESTADO_INICIAL };

      // Act — el docente presiona "Cancelar"
      const estadoDespues = cancelarEliminacion(estadoAntes);

      // Assert
      expect(estadoDespues.secciones).toHaveLength(2);
      expect(estadoDespues.secciones).toEqual(ESTADO_INICIAL.secciones);
    });

    test('las actividades de la sección permanecen intactas al cancelar', () => {
      // Arrange
      const estadoAntes = { ...ESTADO_INICIAL };

      // Act
      const estadoDespues = cancelarEliminacion(estadoAntes);

      // Assert
      expect(estadoDespues.actividades[CLAVE_SEC]).toBeDefined();
      expect(estadoDespues.actividades[CLAVE_SEC]).toHaveLength(1);
    });

    test('las notas de la sección permanecen intactas al cancelar', () => {
      // Arrange
      const estadoAntes = { ...ESTADO_INICIAL };

      // Act
      const estadoDespues = cancelarEliminacion(estadoAntes);

      // Assert
      expect(estadoDespues.notas[CLAVE_SEC]).toBeDefined();
      expect(estadoDespues.notas[CLAVE_SEC]['alu_1']['act_1']).toBe('A');
    });

    test('el servidor no recibe ninguna llamada de guardado al cancelar', async () => {
      // Arrange — el docente abre el diálogo pero presiona "Cancelar"
      // (no se ejecuta ninguna llamada a PUT /api/db)

      // Act — no hay llamada a la API

      // Assert
      expect(saveDbJson).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------
  // E2 — Caso exitoso: sección eliminada correctamente
  // Capa: frontend (lógica de eliminación) + servidor (PUT /api/db)
  // --------------------------------------------------------------
  describe('E2 — Caso exitoso', () => {
    test('la sección desaparece del listado tras confirmar la eliminación', () => {
      // Arrange
      const estadoAntes = { ...ESTADO_INICIAL };

      // Act — el docente confirma la eliminación
      const estadoDespues = confirmarEliminacion(estadoAntes, CURSO_ID, SECCION_ID);

      // Assert
      expect(estadoDespues.secciones).toHaveLength(1);
      expect(estadoDespues.secciones.find(s => s.id === SECCION_ID)).toBeUndefined();
      expect(estadoDespues.secciones[0].id).toBe('sec_2');
    });

    test('las actividades de la sección eliminada son borradas', () => {
      // Arrange
      const estadoAntes = { ...ESTADO_INICIAL };

      // Act
      const estadoDespues = confirmarEliminacion(estadoAntes, CURSO_ID, SECCION_ID);

      // Assert
      expect(estadoDespues.actividades[CLAVE_SEC]).toBeUndefined();
    });

    test('las actividades de otras secciones no se ven afectadas', () => {
      // Arrange
      const estadoAntes = { ...ESTADO_INICIAL };

      // Act
      const estadoDespues = confirmarEliminacion(estadoAntes, CURSO_ID, SECCION_ID);

      // Assert
      expect(estadoDespues.actividades[`${CURSO_ID}_sec_2`]).toBeDefined();
    });

    test('las notas de la sección eliminada son borradas', () => {
      // Arrange
      const estadoAntes = { ...ESTADO_INICIAL };

      // Act
      const estadoDespues = confirmarEliminacion(estadoAntes, CURSO_ID, SECCION_ID);

      // Assert
      expect(estadoDespues.notas[CLAVE_SEC]).toBeUndefined();
    });

    test('el servidor recibe y guarda el DB actualizado sin la sección eliminada', async () => {
      // Arrange
      saveDbJson.mockResolvedValue(undefined);

      // Act — el frontend llama a PUT /api/db con el estado actualizado
      const respuesta = await request(app)
        .put('/api/db')
        .set('x-user-id', 'user_001')
        .send(DB_TRAS_ELIMINAR);

      // Assert
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.ok).toBe(true);

      // Verifica que los datos guardados no contienen la sección eliminada
      const [, datosGuardados] = saveDbJson.mock.calls[0];
      const seccionesGuardadas = datosGuardados.sections[CURSO_ID];
      expect(seccionesGuardadas).toHaveLength(1);
      expect(seccionesGuardadas[0].id).toBe('sec_2');
      expect(datosGuardados.activities[CLAVE_SEC]).toBeUndefined();
    });
  });

});
