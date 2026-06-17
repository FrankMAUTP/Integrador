/**
 * RF02 - Registro Individual de Alumnos
 *
 * Archivos analizados:
 *   - public/js/seccionespecifica.js → saveStudent()
 *
 * Las validaciones de alumnos son exclusivamente del lado del cliente.
 * No existe endpoint backend específico para validar un alumno individual;
 * el guardado se realiza mediante PUT /api/db con el JSON completo.
 *
 * Estrategia: se extrae y prueba la lógica de validación pura de saveStudent()
 * tal como está implementada en el código real, sin modificar nada.
 */

'use strict';

// ─────────────────────────────────────────────
// Lógica extraída de public/js/seccionespecifica.js → saveStudent()
// ─────────────────────────────────────────────

/**
 * Valida el registro de un alumno.
 * Replica exacta de las guards en saveStudent().
 *
 * @param {string}   name            - Nombre ingresado por el docente.
 * @param {Set}      existingNames   - Conjunto de nombres ya registrados (en minúsculas).
 * @returns {{ ok: boolean, message: string }}
 */
function validarRegistroAlumno(name, existingNames) {
  // Guard 1: nombre vacío
  if (!name) {
    return { ok: false, message: 'Ingresa el nombre del alumno' };
  }

  // Guard 2: caracteres inválidos (solo letras con tildes, ñ y espacios)
  if (/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ ]/.test(name)) {
    return { ok: false, message: 'El nombre no puede contener caracteres especiales' };
  }

  // Guard 3: alumno duplicado
  if (existingNames.has(name.toLowerCase())) {
    return { ok: false, message: 'Este alumno ya está registrado en el sistema' };
  }

  return { ok: true, message: 'Alumno agregado' };
}

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────

describe('RF02 – Registro Individual de Alumnos (seccionespecifica.js → saveStudent)', () => {

  // E1 ─ Nombre vacío
  test('E1: nombre vacío → "Ingresa el nombre del alumno"', () => {
    // Arrange
    const name          = '';
    const existingNames = new Set();

    // Act
    const resultado = validarRegistroAlumno(name, existingNames);

    // Assert
    expect(resultado.ok).toBe(false);
    expect(resultado.message).toBe('Ingresa el nombre del alumno');
  });

  test('E1: nombre solo con espacios (trim = vacío) → "Ingresa el nombre del alumno"', () => {
    // Arrange
    const name          = '   '.trim(); // simula el .trim() que hace saveStudent
    const existingNames = new Set();

    // Act
    const resultado = validarRegistroAlumno(name, existingNames);

    // Assert
    expect(resultado.ok).toBe(false);
    expect(resultado.message).toBe('Ingresa el nombre del alumno');
  });

  // E2 ─ Alumno ya existente
  test('E2: alumno con nombre duplicado → "Este alumno ya está registrado en el sistema"', () => {
    // Arrange: 'María García' ya está en la sección
    const name          = 'María García';
    const existingNames = new Set(['maría garcía']); // los nombres se guardan en minúsculas

    // Act
    const resultado = validarRegistroAlumno(name, existingNames);

    // Assert
    expect(resultado.ok).toBe(false);
    expect(resultado.message).toBe('Este alumno ya está registrado en el sistema');
  });

  test('E2: comparación insensible a mayúsculas → detecta duplicado', () => {
    // Arrange: el docente escribe "CARLOS PÉREZ" pero "carlos pérez" ya existe
    const name          = 'CARLOS PÉREZ';
    const existingNames = new Set(['carlos pérez']);

    // Act
    const resultado = validarRegistroAlumno(name, existingNames);

    // Assert
    expect(resultado.ok).toBe(false);
    expect(resultado.message).toBe('Este alumno ya está registrado en el sistema');
  });

  // E3 ─ Registro exitoso
  test('E3: nombre válido y único → registro exitoso', () => {
    // Arrange
    const name          = 'Lucía Torres';
    const existingNames = new Set(['carlos pérez', 'maría garcía']);

    // Act
    const resultado = validarRegistroAlumno(name, existingNames);

    // Assert
    expect(resultado.ok).toBe(true);
    expect(resultado.message).toBe('Alumno agregado');
  });

  test('E3: primera alumna de la sección (lista vacía) → registro exitoso', () => {
    // Arrange
    const name          = 'Andrea López';
    const existingNames = new Set();

    // Act
    const resultado = validarRegistroAlumno(name, existingNames);

    // Assert
    expect(resultado.ok).toBe(true);
    expect(resultado.message).toBe('Alumno agregado');
  });

  // Caso extra: nombre con caracteres inválidos
  test('Extra: nombre con números → "El nombre no puede contener caracteres especiales"', () => {
    // Arrange
    const name          = 'Juan123';
    const existingNames = new Set();

    // Act
    const resultado = validarRegistroAlumno(name, existingNames);

    // Assert
    expect(resultado.ok).toBe(false);
    expect(resultado.message).toBe('El nombre no puede contener caracteres especiales');
  });
});
