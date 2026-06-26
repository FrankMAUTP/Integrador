'use strict';

/**
 * ============================================================
 *  Requerimiento 19 — Generar reporte alumno
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Sin notas promedio
 *    E2 – Flujo exitoso - Generar reporte en PDF
 */

// ================================================================
// FUNCIONES AUXILIARES SIMULANDO LA LÓGICA FRONTEND
// ================================================================

function generarReporte(alumno, notasPromedio) {
  if (!notasPromedio || notasPromedio.length === 0) {
    return "El sistema no puede generar un reporte con las calificaciones";
  }

  return "El docente guarda el reporte de un alumno en su dispositivo de manera local";
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 19 — Generar reporte alumno', () => {
  describe('E1 — Sin notas promedio', () => {
    test('si el alumno no tiene ninguna nota promedio, el sistema no puede generar un reporte', () => {
      const alumno = { id: 1, nombre: 'Juan' };
      const notasPromedio = [];
      expect(generarReporte(alumno, notasPromedio)).toBe("El sistema no puede generar un reporte con las calificaciones");
    });
  });

  describe('E2 — Flujo exitoso', () => {
    test('el sistema genera el reporte PDF y el docente lo guarda en su dispositivo', () => {
      const alumno = { id: 1, nombre: 'Juan' };
      const notasPromedio = [{ competencia: 'C1', promedio: 'AD' }];
      expect(generarReporte(alumno, notasPromedio))
        .toBe("El docente guarda el reporte de un alumno en su dispositivo de manera local");
    });
  });
});
