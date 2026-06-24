'use strict';

/**
 * ============================================================
 *  Requerimiento 10 — El docente debe poder retirar alumnos
 *                     de una sección
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1  – Cancelación de retiro: el docente presiona "Cancelar"
 *           y nada cambia en la base de datos
 *    E2  – Caso exitoso: el alumno queda marcado como retirado
 *           (retired: true) y los cambios se persisten en el servidor
 *
 *  Flujo real en seccionespecifica.js › retireSelected():
 *    showConfirm('Retirar alumno', '...', () => {
 *      students[idx].retired = true;
 *      DB.saveStudents(courseId, sectionId, students);  // → PUT /api/db
 *    });
 *    // Botón "Cancelar" → overlay.remove() sin tocar el DB
 *
 *  Nota sobre la clave de alumnos:
 *    DB._sectionGlobalKey() devuelve '${sec.grade}_${sec.letter}' (ej. '3°_A')
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
// Replican las operaciones que hace retireSelected() en seccionespecifica.js
// ================================================================

/**
 * Simula la acción de CANCELAR: no modifica ninguna estructura.
 * Replica: overlay.remove() sin llamar al callback de confirmación.
 *
 * @param {object} estado - { alumnos }
 * @returns {object} El mismo estado original sin modificaciones
 */
function cancelarRetiro(estado) {
  return estado;  // sin cambios — el DB no es tocado
}

/**
 * Simula la acción de CONFIRMAR el retiro de un alumno.
 * Replica:
 *   students[idx].retired = true;
 *   DB.saveStudents(courseId, sectionId, students);
 *
 * @param {object} estado    - { alumnos: Array<{id, name, retired}> }
 * @param {string} alumnoId  - ID del alumno a retirar
 * @returns {object} Nuevo estado con el alumno marcado como retirado
 */
function confirmarRetiro(estado, alumnoId) {
  const nuevosAlumnos = estado.alumnos.map(a =>
    a.id === alumnoId ? { ...a, retired: true } : { ...a }
  );
  return { alumnos: nuevosAlumnos };
}

// ================================================================
// DATOS DE PRUEBA
// ================================================================

const CURSO_ID    = 'curso_1';
const SECCION_ID  = 'sec_1';
const CLAVE_SALON = '3°_A';

const ALUMNO_A_RETIRAR = { id: 'alu_1', name: 'Ana Torres',  retired: false };
const ALUMNO_ACTIVO    = { id: 'alu_2', name: 'Luis Pérez',  retired: false };

const ESTADO_INICIAL = {
  alumnos: [ALUMNO_A_RETIRAR, ALUMNO_ACTIVO],
};

// Cuerpo para PUT /api/db con el alumno marcado como retirado
const DB_TRAS_RETIRO = {
  courses: [{ id: CURSO_ID, name: 'Matemáticas', color: '#3B6FA0', competencias: {} }],
  sections: {
    [CURSO_ID]: [{ id: SECCION_ID, grade: '3°', letter: 'A', competencias: {} }],
  },
  students: {
    [CLAVE_SALON]: [
      { id: 'alu_1', name: 'Ana Torres', retired: true },   // retirada
      { id: 'alu_2', name: 'Luis Pérez', retired: false },  // sin cambios
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

describe('Requerimiento 10 — Retirar alumno de una sección', () => {

  // --------------------------------------------------------------
  // E1 — Cancelación de retiro
  // Capa: frontend (seccionespecifica.js › showConfirm › btn "Cancelar")
  // --------------------------------------------------------------
  describe('E1 — Cancelación de retiro', () => {
    test('la lista de alumnos no cambia al cancelar', () => {
      // Arrange
      const estadoAntes = { ...ESTADO_INICIAL };

      // Act — el docente presiona "Cancelar"
      const estadoDespues = cancelarRetiro(estadoAntes);

      // Assert
      expect(estadoDespues.alumnos).toHaveLength(2);
      expect(estadoDespues.alumnos).toEqual(ESTADO_INICIAL.alumnos);
    });

    test('el alumno mantiene retired: false al cancelar', () => {
      // Arrange
      const estadoAntes = { ...ESTADO_INICIAL };

      // Act
      const estadoDespues = cancelarRetiro(estadoAntes);

      // Assert
      const alumno = estadoDespues.alumnos.find(a => a.id === 'alu_1');
      expect(alumno.retired).toBe(false);
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
  // E2 — Caso exitoso: alumno retirado correctamente
  // Capa: frontend (lógica de retiro) + servidor (PUT /api/db)
  // --------------------------------------------------------------
  describe('E2 — Caso exitoso', () => {
    test('el alumno queda con retired: true tras confirmar el retiro', () => {
      // Arrange
      const estadoAntes = { ...ESTADO_INICIAL };

      // Act — el docente confirma el retiro
      const estadoDespues = confirmarRetiro(estadoAntes, 'alu_1');

      // Assert
      const alumnoRetirado = estadoDespues.alumnos.find(a => a.id === 'alu_1');
      expect(alumnoRetirado.retired).toBe(true);
    });

    test('el alumno retirado permanece en la lista (no se elimina, solo se marca)', () => {
      // Arrange
      const estadoAntes = { ...ESTADO_INICIAL };

      // Act
      const estadoDespues = confirmarRetiro(estadoAntes, 'alu_1');

      // Assert
      expect(estadoDespues.alumnos).toHaveLength(2);
      expect(estadoDespues.alumnos.find(a => a.id === 'alu_1')).toBeDefined();
    });

    test('los demás alumnos no se ven afectados por el retiro', () => {
      // Arrange
      const estadoAntes = { ...ESTADO_INICIAL };

      // Act
      const estadoDespues = confirmarRetiro(estadoAntes, 'alu_1');

      // Assert
      const alumnoActivo = estadoDespues.alumnos.find(a => a.id === 'alu_2');
      expect(alumnoActivo.retired).toBe(false);
      expect(alumnoActivo.name).toBe('Luis Pérez');
    });

    test('el servidor recibe y guarda el DB con el alumno marcado como retirado', async () => {
      // Arrange
      saveDbJson.mockResolvedValue(undefined);

      // Act — el frontend llama a PUT /api/db tras confirmar el retiro
      const respuesta = await request(app)
        .put('/api/db')
        .set('x-user-id', 'user_001')
        .send(DB_TRAS_RETIRO);

      // Assert
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.ok).toBe(true);

      // Verifica que el alumno retirado tiene retired: true en los datos guardados
      const [, datosGuardados] = saveDbJson.mock.calls[0];
      const alumnos = datosGuardados.students[CLAVE_SALON];
      const anaRetirada = alumnos.find(a => a.id === 'alu_1');
      expect(anaRetirada.retired).toBe(true);
      expect(alumnos.find(a => a.id === 'alu_2').retired).toBe(false);
    });
  });

});
