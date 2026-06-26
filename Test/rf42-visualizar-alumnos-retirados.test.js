'use strict';

/**
 * ============================================================
 *  Requerimiento 42 — Visualizar alumnos retirados
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Tabla vacía
 *    E2 – Estado sin coincidencia
 *    E3 – Flujo exitoso - Retornar datos del alumno retirado
 */

function visualizarRetirados(totalAlumnosRegistrados, totalRetirados) {
  if (totalAlumnosRegistrados === 0) {
    return "Lista vacía, ingrese alumnos en al menos una sección";
  }
  
  if (totalRetirados === 0) {
    return "Alumnos activos, no hay alumnos retirados";
  }

  return "El sistema retorna los datos del alumno retirado";
}

describe('Requerimiento 42 — Visualizar alumnos retirados', () => {
  describe('E1 — Tabla vacía', () => {
    test('si el docente no cuenta con alumnos registrados, retorna "Lista vacía, ingrese alumnos en al menos una sección"', () => {
      expect(visualizarRetirados(0, 0)).toBe("Lista vacía, ingrese alumnos en al menos una sección");
    });
  });

  describe('E2 — Estado sin coincidencia', () => {
    test('si todos los alumnos son activos, retorna "Alumnos activos, no hay alumnos retirados"', () => {
      expect(visualizarRetirados(15, 0)).toBe("Alumnos activos, no hay alumnos retirados");
    });
  });

  describe('E3 — Flujo exitoso', () => {
    test('si existen alumnos retirados, el sistema quita los activos y retorna los datos del alumno retirado', () => {
      expect(visualizarRetirados(15, 2)).toBe("El sistema retorna los datos del alumno retirado");
    });
  });
});
