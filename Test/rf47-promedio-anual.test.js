'use strict';

/**
 * ============================================================
 *  Requerimiento 47 — Visualizar promedio anual
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Sección no registrada
 *    E2 – No existen notas registradas
 *    E3 – Bimestres incompletos o sin evaluación registrada
 *    E4 – Alumno no pertenece activo a la sección
 *    E5 – Flujo exitoso - Mostrar promedios anuales
 */

function visualizarPromedioAnual(seccionId, notasRegistradas, totalBimestres, hayRetirados) {
  if (!seccionId) {
    return "Sección no encontrada";
  }

  if (!notasRegistradas) {
    return "No existen notas registradas";
  }

  if (totalBimestres < 4) {
    return "Bimestres incompletos";
  }

  if (hayRetirados) {
    return "Existen alumnos con estado retirado";
  }

  return "El sistema muestra los promedios anuales de los alumnos de la sección seleccionada";
}

describe('Requerimiento 47 — Visualizar promedio anual', () => {
  describe('E1 — Sección no registrada', () => {
    test('si la sección no existe en la BD o fue eliminada, muestra "Sección no encontrada"', () => {
      expect(visualizarPromedioAnual(null, true, 4, false)).toBe("Sección no encontrada");
    });
  });

  describe('E2 — No existen notas registradas', () => {
    test('si selecciona sección válida pero no hay notas almacenadas, muestra "No existen notas registradas"', () => {
      expect(visualizarPromedioAnual(1, false, 4, false)).toBe("No existen notas registradas");
    });
  });

  describe('E3 — Bimestres incompletos o sin evaluación registrada', () => {
    test('si el curso no cuenta con todas las evaluaciones bimestrales, muestra "Bimestres incompletos"', () => {
      expect(visualizarPromedioAnual(1, true, 3, false)).toBe("Bimestres incompletos");
    });
  });

  describe('E4 — Alumno no pertenece activo a la sección', () => {
    test('si encuentra registros de estudiantes inactivos o retirados, muestra "Existen alumnos con estado retirado"', () => {
      expect(visualizarPromedioAnual(1, true, 4, true)).toBe("Existen alumnos con estado retirado");
    });
  });

  describe('E5 — Flujo exitoso', () => {
    test('el sistema calcula el promedio anual y muestra los promedios anuales de la sección', () => {
      expect(visualizarPromedioAnual(1, true, 4, false))
        .toBe("El sistema muestra los promedios anuales de los alumnos de la sección seleccionada");
    });
  });
});
