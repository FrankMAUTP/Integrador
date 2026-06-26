'use strict';

/**
 * ============================================================
 *  Requerimiento 37 — Redirigir desde módulo de alumnos
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Sección sin notas asignadas
 *    E2 – Nota fuera del rango cualitativo
 *    E3 – Alumno no registrado en ninguna sección
 *    E4 – Flujo exitoso - Redirección correcta
 */

function simularRedireccionModulo(alumnoRegistrado, notaAlumno) {
  if (!alumnoRegistrado) {
    return "El estudiante seleccionado no se encuentra matriculado en ninguna sección activa";
  }

  if (notaAlumno === null) {
    return "El sistema no muestra el color de las notas";
  }

  const notasValidas = ['AD', 'A', 'B', 'C'];
  if (!notasValidas.includes(notaAlumno)) {
    return "Color negro estándar sin aplicarle ningún fondo cromático";
  }

  return "El sistema muestra la sección en la que está registrado el alumno";
}

describe('Requerimiento 37 — Redirigir desde módulo de alumnos', () => {
  describe('E1 — Sección sin notas asignadas', () => {
    test('si los alumnos no tienen notas asignadas, el sistema no muestra el color de las notas', () => {
      const alumnoRegistrado = true;
      const notaAlumno = null; // Sin nota
      expect(simularRedireccionModulo(alumnoRegistrado, notaAlumno)).toBe('El sistema no muestra el color de las notas');
    });
  });

  describe('E2 — Nota fuera del rango cualitativo', () => {
    test('si hay una nota fuera del rango, renderiza el texto en color negro estándar sin aplicarle fondo cromático', () => {
      const alumnoRegistrado = true;
      const notaInvalida = 'Z';
      expect(simularRedireccionModulo(alumnoRegistrado, notaInvalida)).toBe('Color negro estándar sin aplicarle ningún fondo cromático');
    });
  });

  describe('E3 — Alumno no registrado en ninguna sección', () => {
    test('si el alumno no está registrado en ninguna sección, muestra el mensaje de advertencia', () => {
      const alumnoRegistrado = false;
      const notaAlumno = null;
      expect(simularRedireccionModulo(alumnoRegistrado, notaAlumno))
        .toBe('El estudiante seleccionado no se encuentra matriculado en ninguna sección activa');
    });
  });

  describe('E4 — Flujo exitoso', () => {
    test('el sistema redirige y muestra la sección en la que está registrado el alumno', () => {
      const alumnoRegistrado = true;
      const notaValida = 'A';
      expect(simularRedireccionModulo(alumnoRegistrado, notaValida))
        .toBe('El sistema muestra la sección en la que está registrado el alumno');
    });
  });
});
