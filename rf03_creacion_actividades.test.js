/**
 * RF03 - Creación de Actividades Calificadas para Alumnos
 *
 * Archivos analizados:
 *   - public/js/seccionespecifica.js → saveActivity()
 *
 * Las validaciones de actividades son exclusivamente del lado del cliente.
 * El guardado se realiza mediante PUT /api/db con el JSON completo.
 *
 * Estrategia: se extrae y prueba la lógica de validación pura de saveActivity()
 * tal como está implementada en el código real, sin modificar nada.
 */

'use strict';

// ─────────────────────────────────────────────
// Lógica extraída de public/js/seccionespecifica.js → saveActivity()
// ─────────────────────────────────────────────

/**
 * Valida la creación de una actividad calificada.
 * Replica exacta de las guards en saveActivity() (flujo de creación, no edición).
 *
 * @param {string}   name         - Nombre de la actividad.
 * @param {number}   compIdx      - Índice de competencia (NaN si no hay competencias).
 * @param {string}   dueDate      - Fecha de vencimiento (string vacío si no se seleccionó).
 * @param {Array}    activities   - Lista de actividades ya existentes en la sección.
 * @param {number}   bim          - Bimestre seleccionado.
 * @returns {{ ok: boolean, message: string }}
 */
function validarCreacionActividad(name, compIdx, dueDate, activities, bim) {
  // Guard 1: nombre vacío
  if (!name) {
    return { ok: false, message: 'Ingresa el nombre de la actividad' };
  }

  // Guard 2: caracteres inválidos
  if (/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ ]/.test(name)) {
    return { ok: false, message: 'El nombre de la actividad no puede contener caracteres especiales' };
  }

  // Guard 3: sin competencias en el bimestre
  if (isNaN(compIdx)) {
    return { ok: false, message: 'No hay competencias definidas para este bimestre' };
  }

  // Guard 4: fecha de vencimiento no seleccionada
  if (!dueDate) {
    return { ok: false, message: 'Selecciona la fecha de vencimiento' };
  }

  // Guard 5: límite de actividades por competencia
  const compActivities = activities.filter(
    a => a.bimestre === bim && a.competenciaIdx === compIdx
  );
  if (compActivities.length >= 8) {
    return { ok: false, message: 'Límite de 8 actividades por competencia alcanzado' };
  }

  // Guard 6: nombre duplicado
  const duplicate = activities.find(
    a => a.name.toLowerCase() === name.toLowerCase()
  );
  if (duplicate) {
    return { ok: false, message: 'Ya existe una actividad con ese nombre' };
  }

  return { ok: true, message: 'Actividad creada' };
}

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────

describe('RF03 – Creación de Actividades (seccionespecifica.js → saveActivity)', () => {

  // E1 ─ Actividad sin nombre
  test('E1: nombre vacío → "Ingresa el nombre de la actividad"', () => {
    // Arrange
    const name       = '';
    const compIdx    = 0;
    const dueDate    = '2024-09-30';
    const activities = [];
    const bim        = 1;

    // Act
    const resultado = validarCreacionActividad(name, compIdx, dueDate, activities, bim);

    // Assert
    expect(resultado.ok).toBe(false);
    expect(resultado.message).toBe('Ingresa el nombre de la actividad');
  });

  test('E1: nombre solo con espacios (trim = vacío) → "Ingresa el nombre de la actividad"', () => {
    // Arrange
    const name       = '   '.trim(); // simula el .trim() de saveActivity
    const compIdx    = 0;
    const dueDate    = '2024-09-30';
    const activities = [];
    const bim        = 1;

    // Act
    const resultado = validarCreacionActividad(name, compIdx, dueDate, activities, bim);

    // Assert
    expect(resultado.ok).toBe(false);
    expect(resultado.message).toBe('Ingresa el nombre de la actividad');
  });

  // E2 ─ Actividad sin fecha definida
  test('E2: fecha vacía → "Selecciona la fecha de vencimiento"', () => {
    // Arrange
    const name       = 'Tarea Bimestre';
    const compIdx    = 0;
    const dueDate    = '';   // no se seleccionó fecha
    const activities = [];
    const bim        = 1;

    // Act
    const resultado = validarCreacionActividad(name, compIdx, dueDate, activities, bim);

    // Assert
    expect(resultado.ok).toBe(false);
    expect(resultado.message).toBe('Selecciona la fecha de vencimiento');
  });

  // E3 ─ Nombre de actividad ya existente
  test('E3: nombre de actividad duplicado → "Ya existe una actividad con ese nombre"', () => {
    // Arrange
    const existingActivity = {
      id: 'act_001', name: 'Tarea Bimestre', bimestre: 1, competenciaIdx: 0,
    };
    const name       = 'Tarea Bimestre';
    const compIdx    = 0;
    const dueDate    = '2024-09-30';
    const activities = [existingActivity];
    const bim        = 1;

    // Act
    const resultado = validarCreacionActividad(name, compIdx, dueDate, activities, bim);

    // Assert
    expect(resultado.ok).toBe(false);
    expect(resultado.message).toBe('Ya existe una actividad con ese nombre');
  });

  test('E3: duplicado insensible a mayúsculas → "Ya existe una actividad con ese nombre"', () => {
    // Arrange
    const existingActivity = {
      id: 'act_001', name: 'tarea bimestre', bimestre: 1, competenciaIdx: 0,
    };
    const name       = 'TAREA BIMESTRE';
    const compIdx    = 0;
    const dueDate    = '2024-09-30';
    const activities = [existingActivity];
    const bim        = 1;

    // Act
    const resultado = validarCreacionActividad(name, compIdx, dueDate, activities, bim);

    // Assert
    expect(resultado.ok).toBe(false);
    expect(resultado.message).toBe('Ya existe una actividad con ese nombre');
  });

  // Caso positivo ─ Actividad válida y nueva
  test('Actividad válida y única → creación exitosa', () => {
    // Arrange
    const existingActivity = {
      id: 'act_001', name: 'Práctica Primera', bimestre: 1, competenciaIdx: 0,
    };
    const name       = 'Práctica Segunda';
    const compIdx    = 0;
    const dueDate    = '2024-09-30';
    const activities = [existingActivity];
    const bim        = 1;

    // Act
    const resultado = validarCreacionActividad(name, compIdx, dueDate, activities, bim);

    // Assert
    expect(resultado.ok).toBe(true);
    expect(resultado.message).toBe('Actividad creada');
  });

  test('Primera actividad de la sección (lista vacía) → creación exitosa', () => {
    // Arrange
    const name       = 'Evaluación Inicial';
    const compIdx    = 0;
    const dueDate    = '2024-08-15';
    const activities = [];
    const bim        = 1;

    // Act
    const resultado = validarCreacionActividad(name, compIdx, dueDate, activities, bim);

    // Assert
    expect(resultado.ok).toBe(true);
    expect(resultado.message).toBe('Actividad creada');
  });

  // Casos extra cubiertos por el código
  test('Extra: sin competencias en el bimestre (compIdx=NaN) → "No hay competencias definidas para este bimestre"', () => {
    // Arrange
    const name       = 'Tarea';
    const compIdx    = NaN; // parseInt de un select vacío
    const dueDate    = '2024-09-30';
    const activities = [];
    const bim        = 1;

    // Act
    const resultado = validarCreacionActividad(name, compIdx, dueDate, activities, bim);

    // Assert
    expect(resultado.ok).toBe(false);
    expect(resultado.message).toBe('No hay competencias definidas para este bimestre');
  });

  test('Extra: límite de 8 actividades por competencia → "Límite de 8 actividades por competencia alcanzado"', () => {
    // Arrange: 8 actividades ya creadas para bimestre 1 / competencia 0
    const activities = Array.from({ length: 8 }, (_, i) => ({
      id: `act_00${i}`, name: `Actividad ${i + 1}`, bimestre: 1, competenciaIdx: 0,
    }));
    const name    = 'Actividad Nueva';
    const compIdx = 0;
    const dueDate = '2024-09-30';
    const bim     = 1;

    // Act
    const resultado = validarCreacionActividad(name, compIdx, dueDate, activities, bim);

    // Assert
    expect(resultado.ok).toBe(false);
    expect(resultado.message).toBe('Límite de 8 actividades por competencia alcanzado');
  });
});
