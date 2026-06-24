'use strict';

/**
 * ============================================================
 *  Requerimiento 9 — El docente puede importar una lista de
 *                    alumnos desde un archivo Excel
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1  – Alumnos no encontrados: el Excel está vacío o no
 *           detecta nombres → "No se encontraron nombres en la columna B"
 *    E2  – Archivo erróneo: el formato no es Excel válido →
 *           "No se pudo leer el archivo Excel: <detalle>"
 *    E3  – Nula selección: se detectaron nombres pero el docente
 *           no marca ninguno → "Selecciona al menos un alumno"
 *    E4  – Caso exitoso: nombres importados y alumnos guardados
 *
 *  Flujo real:
 *    Frontend handleExcelFile():
 *      POST /api/import/excel { fileBase64 }
 *        → si !res.ok         → catch → toast 'No se pudo leer el archivo Excel: ...'  (E2)
 *        → si names.length==0 → toast 'No se encontraron nombres en la columna B'      (E1)
 *        → si ok              → renderImportPreview → openModal
 *    Frontend confirmImport():
 *      → si !selected.length  → toast 'Selecciona al menos un alumno'                  (E3)
 *      → si ok                → DB.saveStudents() → PUT /api/db                        (E4)
 *
 *  Backend POST /api/import/excel:
 *    - Sin fileBase64             → 400 'No se recibió el archivo'
 *    - excelService lanza error   → 4xx/500 con { error }
 *    - excelService retorna names → 200 { names }
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

// Mock del servicio de Excel — permite controlar la lectura del archivo
jest.mock('../src/services/excelService', () => ({
  exportToExcel:   jest.fn(),
  importFromExcel: jest.fn(),
}));

// ================================================================
// IMPORTS
// ================================================================

const request                    = require('supertest');
const { app }                    = require('../server');
const { saveDbJson, getPool }    = require('../db/mysql');
const excelService               = require('../src/services/excelService');

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
// Replican la lógica de handleExcelFile() y confirmImport()
// en seccionespecifica.js
// ================================================================

/**
 * Replica la comprobación de nombres recibidos desde la API.
 * Corresponde a:  if (!names || !names.length) showToast(...)
 *
 * @param {string[]|null} names - Lista de nombres devuelta por POST /api/import/excel
 * @returns {string|null} Mensaje de error o null si hay nombres válidos
 */
function verificarNombresEncontrados(names) {
  if (!names || !names.length)
    return 'No se encontraron nombres en la columna B';
  return null;
}

/**
 * Replica el mensaje del bloque catch en handleExcelFile().
 * Corresponde a:  showToast('No se pudo leer el archivo Excel: ' + err.message, 'error')
 *
 * @param {string} mensajeError - Error recibido de la API
 * @returns {string} Toast completo que se mostraría al docente
 */
function mensajeErrorArchivo(mensajeError) {
  return `No se pudo leer el archivo Excel: ${mensajeError}`;
}

/**
 * Replica la validación de selección en confirmImport().
 * Corresponde a:  if (!selected.length) showToast('Selecciona al menos un alumno', 'error')
 *
 * @param {string[]} seleccionados - Nombres marcados con checkbox
 * @returns {string|null} Mensaje de error o null si hay al menos uno seleccionado
 */
function validarSeleccion(seleccionados) {
  if (!seleccionados.length) return 'Selecciona al menos un alumno';
  return null;
}

// ================================================================
// DATOS DE PRUEBA
// ================================================================

const CURSO_ID    = 'curso_1';
const CLAVE_SALON = '3°_A';

const NOMBRES_DEL_EXCEL = ['Ana Torres', 'Luis Pérez', 'María García'];

// Cuerpo para PUT /api/db tras importar alumnos
const DB_CON_ALUMNOS_IMPORTADOS = {
  courses: [{ id: CURSO_ID, name: 'Matemáticas', color: '#3B6FA0', competencias: {} }],
  sections: {
    [CURSO_ID]: [{ id: 'sec_1', grade: '3°', letter: 'A', competencias: {} }],
  },
  students: {
    [CLAVE_SALON]: [
      { id: 'alu_001', name: 'Ana Torres' },
      { id: 'alu_002', name: 'Luis Pérez' },
      { id: 'alu_003', name: 'María García' },
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

describe('Requerimiento 9 — Importar lista de alumnos desde Excel', () => {

  // --------------------------------------------------------------
  // E1 — Alumnos no encontrados
  // Capa: backend (API devuelve names vacío) + frontend (helper)
  // --------------------------------------------------------------
  describe('E1 — Alumnos no encontrados en el Excel', () => {
    test('la API devuelve un array vacío cuando el Excel no contiene nombres válidos', async () => {
      // Arrange — el servicio no detecta ningún nombre en el archivo
      excelService.importFromExcel.mockResolvedValue([]);

      // Act
      const respuesta = await request(app)
        .post('/api/import/excel')
        .send({ fileBase64: 'dGVzdA==' });  // base64 válido pero sin nombres

      // Assert
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.names).toHaveLength(0);
    });

    test('muestra "No se encontraron nombres en la columna B" cuando names está vacío', () => {
      // Arrange
      const names = [];

      // Act
      const resultado = verificarNombresEncontrados(names);

      // Assert
      expect(resultado).toBe('No se encontraron nombres en la columna B');
    });

    test('muestra el error también cuando la API devuelve null como names', () => {
      // Arrange
      const names = null;

      // Act
      const resultado = verificarNombresEncontrados(names);

      // Assert
      expect(resultado).toBe('No se encontraron nombres en la columna B');
    });
  });

  // --------------------------------------------------------------
  // E2 — Archivo erróneo
  // Capa: backend (sin body → 400; archivo inválido → error)
  //       + frontend (helper replica mensaje del catch)
  // --------------------------------------------------------------
  describe('E2 — Archivo erróneo', () => {
    test('la API devuelve 400 cuando no se envía ningún archivo (sin fileBase64)', async () => {
      // Arrange — petición sin el campo fileBase64

      // Act
      const respuesta = await request(app)
        .post('/api/import/excel')
        .send({});

      // Assert
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.error).toBe('No se recibió el archivo');
    });

    test('la API devuelve error cuando el servicio no puede parsear el archivo', async () => {
      // Arrange — simula un archivo de formato incorrecto (ej. un PDF)
      const error = new Error('El archivo Excel no contiene hojas');
      error.status = 400;
      excelService.importFromExcel.mockRejectedValue(error);

      // Act
      const respuesta = await request(app)
        .post('/api/import/excel')
        .send({ fileBase64: 'dGVzdA==' });

      // Assert
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.error).toBe('El archivo Excel no contiene hojas');
    });

    test('el frontend construye el mensaje correcto a partir del error de la API', () => {
      // Arrange — error devuelto por la API al fallar la lectura
      const mensajeApi = 'El archivo Excel no contiene hojas';

      // Act — replica el bloque catch de handleExcelFile()
      const toast = mensajeErrorArchivo(mensajeApi);

      // Assert
      expect(toast).toBe('No se pudo leer el archivo Excel: El archivo Excel no contiene hojas');
      expect(toast).toContain('No se pudo leer el archivo Excel');
    });
  });

  // --------------------------------------------------------------
  // E3 — Nula selección de alumnos
  // Capa: frontend (seccionespecifica.js › confirmImport)
  // --------------------------------------------------------------
  describe('E3 — Ningún alumno seleccionado para importar', () => {
    test('muestra "Selecciona al menos un alumno" cuando el array de seleccionados está vacío', () => {
      // Arrange — el docente no marcó ningún checkbox
      const seleccionados = [];

      // Act
      const resultado = validarSeleccion(seleccionados);

      // Assert
      expect(resultado).toBe('Selecciona al menos un alumno');
    });

    test('no muestra error cuando hay al menos un alumno seleccionado', () => {
      // Arrange
      const seleccionados = ['Ana Torres'];

      // Act
      const resultado = validarSeleccion(seleccionados);

      // Assert
      expect(resultado).toBeNull();
    });
  });

  // --------------------------------------------------------------
  // E4 — Caso exitoso
  // Capa: backend (API devuelve names) + frontend (selección)
  //       + servidor (PUT /api/db guarda alumnos importados)
  // --------------------------------------------------------------
  describe('E4 — Caso exitoso', () => {
    test('la API devuelve los nombres extraídos del Excel correctamente', async () => {
      // Arrange
      excelService.importFromExcel.mockResolvedValue(NOMBRES_DEL_EXCEL);

      // Act
      const respuesta = await request(app)
        .post('/api/import/excel')
        .send({ fileBase64: 'dGVzdA==' });

      // Assert
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.names).toEqual(NOMBRES_DEL_EXCEL);
      expect(respuesta.body.names).toHaveLength(3);
    });

    test('no hay error cuando todos los nombres del Excel son seleccionados', () => {
      // Arrange — el docente marca todos los checkboxes
      const seleccionados = [...NOMBRES_DEL_EXCEL];

      // Act
      const resultado = validarSeleccion(seleccionados);

      // Assert
      expect(resultado).toBeNull();
    });

    test('verificarNombresEncontrados no lanza error cuando hay nombres válidos', () => {
      // Arrange
      const names = NOMBRES_DEL_EXCEL;

      // Act
      const resultado = verificarNombresEncontrados(names);

      // Assert
      expect(resultado).toBeNull();
    });

    test('el servidor recibe y guarda los alumnos importados vía PUT /api/db', async () => {
      // Arrange
      saveDbJson.mockResolvedValue(undefined);

      // Act — el frontend llama a PUT /api/db tras confirmar la importación
      const respuesta = await request(app)
        .put('/api/db')
        .set('x-user-id', 'user_001')
        .send(DB_CON_ALUMNOS_IMPORTADOS);

      // Assert
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.ok).toBe(true);

      // Verifica que los 3 alumnos importados fueron guardados
      const [, datosGuardados] = saveDbJson.mock.calls[0];
      const alumnos = datosGuardados.students[CLAVE_SALON];
      expect(alumnos).toHaveLength(3);
      expect(alumnos.map(a => a.name)).toEqual(NOMBRES_DEL_EXCEL);
    });
  });

});
