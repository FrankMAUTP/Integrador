'use strict';

/**
 * ============================================================
 *  Requerimiento 45 — Exportación a excel
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Sección sin Alumnos
 *    E2 – Notas ausentes
 *    E3 – Sección ausente
 *    E4 – Curso ausente
 *    E5 – Flujo exitoso - Exportar notas
 */

function exportarExcel(cursosDisponibles, seccionesDisponibles, alumnosEnSeccion, notasCompletas) {
  if (cursosDisponibles === 0) {
    return "El docente debe crear al menos un curso";
  }
  
  if (seccionesDisponibles === 0) {
    return "El docente debe crear al menos una sección";
  }

  if (alumnosEnSeccion === 0) {
    return "Sin alumnos";
  }

  if (!notasCompletas) {
    return "El documento se genera solo con los nombres sin calificaciones";
  }

  return "El docente puede visualizar la tabla de alumnos en un archivo excel";
}

describe('Requerimiento 45 — Exportación a excel', () => {
  describe('E1 — Sección sin Alumnos', () => {
    test('si la sección no tiene alumnos, la página muestra el mensaje "Sin alumnos"', () => {
      expect(exportarExcel(1, 1, 0, true)).toBe("Sin alumnos");
    });
  });

  describe('E2 — Notas ausentes', () => {
    test('si el docente no ingresa actividad o notas, el documento se genera solo con los nombres', () => {
      expect(exportarExcel(1, 1, 15, false)).toBe("El documento se genera solo con los nombres sin calificaciones");
    });
  });

  describe('E3 — Sección ausente', () => {
    test('si el curso no cuenta con sección, no permite exportar y debe crear al menos una sección', () => {
      expect(exportarExcel(1, 0, 0, true)).toBe("El docente debe crear al menos una sección");
    });
  });

  describe('E4 — Curso ausente', () => {
    test('si no hay cursos registrados, debe crear al menos un curso', () => {
      expect(exportarExcel(0, 0, 0, true)).toBe("El docente debe crear al menos un curso");
    });
  });

  describe('E5 — Flujo exitoso', () => {
    test('con datos completos, el docente puede visualizar la tabla de alumnos en un archivo excel', () => {
      expect(exportarExcel(1, 1, 20, true)).toBe("El docente puede visualizar la tabla de alumnos en un archivo excel");
    });
  });
});
