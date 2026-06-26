'use strict';

/**
 * ============================================================
 *  Requerimiento 41 — Filtrado de condición académica
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Tabla vacía
 *    E2 – Actividades ausentes
 *    E3 – Notas ausentes
 *    E4 – Estado sin coincidencia
 *    E5 – Notas incompletas
 *    E6 – Flujo exitoso - Vista segmentada
 */

function filtrarPorCondicion(seccion, filtroEstado) {
  if (seccion.alumnos === 0) {
    return "Sección vacía, ingrese alumnos";
  }
  if (seccion.actividades === 0) {
    return "Sección sin actividades, ingrese al menos una actividad";
  }
  if (seccion.notasTotales === 0) {
    return "Sección sin notas, ingrese las notas en al menos una actividad";
  }
  if (seccion.todosAprobados && filtroEstado === 'desaprobados') {
    return "Sección Aprobada, no hay alumnos desaprobados";
  }
  if (seccion.notasIncompletas) {
    return "Alumnos con notas pendientes";
  }

  return "El docente obtiene una vista segmentada de su grupo de estudio";
}

describe('Requerimiento 41 — Filtrado de condición académica', () => {
  describe('E1 — Tabla vacía', () => {
    test('si la sección no tiene alumnos registrados, retorna mensaje "Sección vacía, ingrese alumnos"', () => {
      const seccion = { alumnos: 0 };
      expect(filtrarPorCondicion(seccion, 'aprobados')).toBe("Sección vacía, ingrese alumnos");
    });
  });

  describe('E2 — Actividades ausentes', () => {
    test('si no hay actividades registradas, retorna "Sección sin actividades, ingrese al menos una actividad"', () => {
      const seccion = { alumnos: 10, actividades: 0 };
      expect(filtrarPorCondicion(seccion, 'aprobados')).toBe("Sección sin actividades, ingrese al menos una actividad");
    });
  });

  describe('E3 — Notas ausentes', () => {
    test('si no hay notas registradas, retorna "Sección sin notas, ingrese las notas en al menos una actividad"', () => {
      const seccion = { alumnos: 10, actividades: 2, notasTotales: 0 };
      expect(filtrarPorCondicion(seccion, 'aprobados')).toBe("Sección sin notas, ingrese las notas en al menos una actividad");
    });
  });

  describe('E4 — Estado sin coincidencia', () => {
    test('si filtra desaprobados pero todos están aprobados, retorna "Sección Aprobada, no hay alumnos desaprobados"', () => {
      const seccion = { alumnos: 10, actividades: 2, notasTotales: 20, todosAprobados: true };
      expect(filtrarPorCondicion(seccion, 'desaprobados')).toBe("Sección Aprobada, no hay alumnos desaprobados");
    });
  });

  describe('E5 — Notas incompletas', () => {
    test('si los alumnos tienen notas incompletas, retorna "Alumnos con notas pendientes"', () => {
      const seccion = { alumnos: 10, actividades: 2, notasTotales: 15, notasIncompletas: true };
      expect(filtrarPorCondicion(seccion, 'aprobados')).toBe("Alumnos con notas pendientes");
    });
  });

  describe('E6 — Flujo exitoso', () => {
    test('el sistema filtra correctamente y el docente obtiene una vista segmentada', () => {
      const seccion = { alumnos: 10, actividades: 2, notasTotales: 20, todosAprobados: false, notasIncompletas: false };
      expect(filtrarPorCondicion(seccion, 'aprobados')).toBe("El docente obtiene una vista segmentada de su grupo de estudio");
    });
  });
});
