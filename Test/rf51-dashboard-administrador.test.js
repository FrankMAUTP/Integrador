'use strict';

/**
 * ============================================================
 *  Requerimiento 51 — Dashboard administrador
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Datos inexistentes en la base de datos
 *    E2 – Error en la actualización automática
 *    E3 – Usuario sin permisos de administrador
 *    E4 – Flujo exitoso - Dashboard visible
 */

function cargarDashboardAdmin(rolUsuario, datosExistentes, errorActualizacion) {
  if (rolUsuario !== 'administrador') {
    return "Acceso denegado";
  }
  if (errorActualizacion) {
    return "No se pudo actualizar la información del dashboard";
  }
  if (!datosExistentes) {
    return "Muestra el valor '0' en el indicador correspondiente";
  }

  return "Dashboard de administrador visible con indicadores actualizados";
}

describe('Requerimiento 51 — Dashboard administrador', () => {
  describe('E1 — Datos inexistentes en la base de datos', () => {
    test('si la consulta SQL no encuentra registros, valida y muestra el valor "0" en el indicador', () => {
      expect(cargarDashboardAdmin('administrador', false, false)).toBe("Muestra el valor '0' en el indicador correspondiente");
    });
  });

  describe('E2 — Error en la actualización automática', () => {
    test('si falla la petición de actualizar cada 5 minutos, muestra "No se pudo actualizar la información del dashboard"', () => {
      expect(cargarDashboardAdmin('administrador', true, true)).toBe("No se pudo actualizar la información del dashboard");
    });
  });

  describe('E3 — Usuario sin permisos de administrador', () => {
    test('si un usuario sin rol administrador entra por URL, valida y muestra "Acceso denegado"', () => {
      expect(cargarDashboardAdmin('estudiante', true, false)).toBe("Acceso denegado");
    });
  });

  describe('E4 — Flujo exitoso', () => {
    test('el sistema carga el dashboard en la interfaz con los indicadores actualizados', () => {
      expect(cargarDashboardAdmin('administrador', true, false)).toBe("Dashboard de administrador visible con indicadores actualizados");
    });
  });
});
