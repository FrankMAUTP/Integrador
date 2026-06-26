'use strict';

/**
 * ============================================================
 *  Requerimiento 40 — Registrar observaciones de alumnos
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Error de notificación sin guardar
 *    E2 – Alerta de actividad no disponible
 *    E3 – Flujo exitoso - Registro de observación
 */

function registrarObservacion(actividadesProgramadas, actividadDisponible) {
  if (!actividadesProgramadas) {
    return "No tienes actividades próximas ni recordatorios pendientes";
  }

  if (!actividadDisponible) {
    return "La actividad o alerta ya no se encuentra disponible";
  }

  return "La observación queda registrada de forma permanente en el historial del alumno";
}

describe('Requerimiento 40 — Registrar observaciones de alumnos', () => {
  describe('E1 — Error de notificación sin guardar', () => {
    test('si no hay actividades programadas, presenta el texto pasivo correspondiente', () => {
      const actividadesProgramadas = false;
      expect(registrarObservacion(actividadesProgramadas, true))
        .toBe("No tienes actividades próximas ni recordatorios pendientes");
    });
  });

  describe('E2 — Alerta de actividad no disponible', () => {
    test('si el recurso de origen fue eliminado, el sistema muestra el mensaje de error', () => {
      const actividadDisponible = false;
      expect(registrarObservacion(true, actividadDisponible))
        .toBe("La actividad o alerta ya no se encuentra disponible");
    });
  });

  describe('E3 — Flujo exitoso', () => {
    test('el docente guarda el comentario y se vincula al expediente del alumno permanentemente', () => {
      expect(registrarObservacion(true, true))
        .toBe("La observación queda registrada de forma permanente en el historial del alumno");
    });
  });
});
