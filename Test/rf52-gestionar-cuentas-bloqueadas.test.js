'use strict';

/**
 * ============================================================
 *  Requerimiento 52 — Gestionar cuentas bloqueadas
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – No existen cuentas bloqueadas
 *    E2 – Error al cargar cuentas bloqueadas
 *    E3 – Cuenta no encontrada al desbloquear
 *    E4 – Error al actualizar estado de cuenta
 *    E5 – Desbloqueo realizado pero sesión inválida
 *    E6 – Flujo exitoso - Cuenta desbloqueada
 */

function gestionarCuentasBloqueadas(cuentasBloqueadas, errorCarga, cuentaExiste, errorActualizacion, problemaSesion) {
  if (errorCarga) {
    return "No se pudo cargar la lista de cuentas bloqueadas";
  }
  if (!cuentasBloqueadas) {
    return "No existen cuentas bloqueadas";
  }
  if (!cuentaExiste) {
    return "La cuenta seleccionada no existe";
  }
  if (errorActualizacion) {
    return "No se pudo desbloquear la cuenta";
  }
  if (problemaSesion) {
    return "Cuenta desbloqueada, verifique sus credenciales para ingresar";
  }

  return "Cuenta desbloqueada correctamente. El docente puede iniciar sesión";
}

describe('Requerimiento 52 — Gestionar cuentas bloqueadas', () => {
  describe('E1 — No existen cuentas bloqueadas', () => {
    test('si no hay docentes con estado bloqueado, muestra "No existen cuentas bloqueadas"', () => {
      expect(gestionarCuentasBloqueadas(false, false, true, false, false)).toBe("No existen cuentas bloqueadas");
    });
  });

  describe('E2 — Error al cargar cuentas bloqueadas', () => {
    test('si ocurre un fallo en la petición de carga, muestra "No se pudo cargar la lista de cuentas bloqueadas"', () => {
      expect(gestionarCuentasBloqueadas(true, true, true, false, false)).toBe("No se pudo cargar la lista de cuentas bloqueadas");
    });
  });

  describe('E3 — Cuenta no encontrada al desbloquear', () => {
    test('si la cuenta ya no existe al intentar desbloquear, muestra "La cuenta seleccionada no existe"', () => {
      expect(gestionarCuentasBloqueadas(true, false, false, false, false)).toBe("La cuenta seleccionada no existe");
    });
  });

  describe('E4 — Error al actualizar estado de cuenta', () => {
    test('si falla la actualización del estado en BD, muestra "No se pudo desbloquear la cuenta"', () => {
      expect(gestionarCuentasBloqueadas(true, false, true, true, false)).toBe("No se pudo desbloquear la cuenta");
    });
  });

  describe('E5 — Desbloqueo realizado pero sesión inválida', () => {
    test('si cambia a activa pero no puede iniciar sesión, muestra "Cuenta desbloqueada, verifique sus credenciales para ingresar"', () => {
      expect(gestionarCuentasBloqueadas(true, false, true, false, true)).toBe("Cuenta desbloqueada, verifique sus credenciales para ingresar");
    });
  });

  describe('E6 — Flujo exitoso', () => {
    test('si la validación es correcta, se muestra "Cuenta desbloqueada correctamente. El docente puede iniciar sesión"', () => {
      expect(gestionarCuentasBloqueadas(true, false, true, false, false)).toBe("Cuenta desbloqueada correctamente. El docente puede iniciar sesión");
    });
  });
});
