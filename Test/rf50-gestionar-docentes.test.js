'use strict';

/**
 * ============================================================
 *  Requerimiento 50 — Gestionar cuentas docentes
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Docente no registrado
 *    E2 – Error al cargar la lista de docentes
 *    E3 – Cambio de estado fallido
 *    E4 – Usuario sin permisos de administrador
 *    E5 – Flujo exitoso - Gestión de cuenta docente
 */

function gestionarDocentes(rolUsuario, docenteId, errorCargaLista, errorActualizacion) {
  if (rolUsuario !== 'administrador') {
    return "Acceso denegado";
  }
  if (errorCargaLista) {
    return "No se pudo cargar la información de docentes";
  }
  if (!docenteId) {
    return "Docente no encontrado";
  }
  if (errorActualizacion) {
    return "No se pudo actualizar el estado de la cuenta";
  }

  return "Cuenta del docente actualizada según la acción del administrador";
}

describe('Requerimiento 50 — Gestionar cuentas docentes', () => {
  describe('E1 — Docente no registrado', () => {
    test('si busca un docente que no existe, muestra "Docente no encontrado"', () => {
      expect(gestionarDocentes('administrador', null, false, false)).toBe("Docente no encontrado");
    });
  });

  describe('E2 — Error al cargar la lista de docentes', () => {
    test('si ocurre un fallo al consultar, muestra "No se pudo cargar la información de docentes"', () => {
      expect(gestionarDocentes('administrador', 1, true, false)).toBe("No se pudo cargar la información de docentes");
    });
  });

  describe('E3 — Cambio de estado fallido', () => {
    test('si la actualización falla en la base de datos, muestra "No se pudo actualizar el estado de la cuenta"', () => {
      expect(gestionarDocentes('administrador', 1, false, true)).toBe("No se pudo actualizar el estado de la cuenta");
    });
  });

  describe('E4 — Usuario sin permisos de administrador', () => {
    test('si intenta acceder al módulo sin rol administrador, muestra "Acceso denegado"', () => {
      expect(gestionarDocentes('docente', 1, false, false)).toBe("Acceso denegado");
    });
  });

  describe('E5 — Flujo exitoso', () => {
    test('el sistema aplica el cambio y actualiza la cuenta del docente', () => {
      expect(gestionarDocentes('administrador', 1, false, false)).toBe("Cuenta del docente actualizada según la acción del administrador");
    });
  });
});
