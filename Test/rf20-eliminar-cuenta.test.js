'use strict';

/**
 * ============================================================
 *  Requerimiento 20 — Eliminar cuenta
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Sin acceso a la plataforma
 *    E2 – Flujo exitoso - El sistema debe permitir eliminar la cuenta de usuario
 */

// ================================================================
// FUNCIONES AUXILIARES SIMULANDO LA LÓGICA FRONTEND
// ================================================================

function eliminarCuenta(sesionIniciada) {
  if (!sesionIniciada) {
    return "no podrá acceder a la funcionalidad de eliminar cuenta";
  }

  return "El docente logra eliminar su cuenta de la base de datos";
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 20 — Eliminar cuenta', () => {
  describe('E1 — Sin acceso a la plataforma', () => {
    test('si el docente no ha accedido a la plataforma, no podrá acceder a la funcionalidad', () => {
      const sesionIniciada = false;
      expect(eliminarCuenta(sesionIniciada)).toBe("no podrá acceder a la funcionalidad de eliminar cuenta");
    });
  });

  describe('E2 — Flujo exitoso', () => {
    test('el docente logra eliminar su cuenta exitosamente', () => {
      const sesionIniciada = true;
      expect(eliminarCuenta(sesionIniciada)).toBe("El docente logra eliminar su cuenta de la base de datos");
    });
  });
});
