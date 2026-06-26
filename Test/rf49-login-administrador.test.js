'use strict';

/**
 * ============================================================
 *  Requerimiento 49 — Inicio de sesión Administrador
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Contraseña incorrecta
 *    E2 – Campos vacíos
 *    E3 – Cuenta sin permisos de administrador
 *    E4 – Error de conexión con la base de datos
 *    E5 – Flujo exitoso - Inicio de sesión
 */

function loginAdministrador(usuario, contrasena, rolEnBd, errorConexion) {
  if (!usuario || !contrasena) {
    return "Complete los campos";
  }
  
  if (errorConexion) {
    return "No se pudo iniciar sesión, intente nuevamente más tarde";
  }

  // Simulamos validación de credenciales
  if (contrasena !== 'Admin123') {
    return "Contraseña incorrecta";
  }

  if (rolEnBd !== 'administrador') {
    return "Acceso denegado";
  }

  return "El Administrador es autenticado con acceso al panel de administración";
}

describe('Requerimiento 49 — Inicio de sesión Administrador', () => {
  describe('E1 — Contraseña incorrecta', () => {
    test('si el usuario existe pero la contraseña no coincide, muestra "Contraseña incorrecta"', () => {
      expect(loginAdministrador('admin', 'ClaveMala', 'administrador', false)).toBe("Contraseña incorrecta");
    });
  });

  describe('E2 — Campos vacíos', () => {
    test('si intenta iniciar sesión sin completar campos, muestra "Complete los campos"', () => {
      expect(loginAdministrador('', 'Admin123', 'administrador', false)).toBe("Complete los campos");
    });
  });

  describe('E3 — Cuenta sin permisos de administrador', () => {
    test('si un usuario con otro rol intenta acceder, muestra "Acceso denegado"', () => {
      expect(loginAdministrador('docente1', 'Admin123', 'docente', false)).toBe("Acceso denegado");
    });
  });

  describe('E4 — Error de conexión con la base de datos', () => {
    test('si ocurre un fallo de conexión, muestra "No se pudo iniciar sesión, intente nuevamente más tarde"', () => {
      expect(loginAdministrador('admin', 'Admin123', 'administrador', true)).toBe("No se pudo iniciar sesión, intente nuevamente más tarde");
    });
  });

  describe('E5 — Flujo exitoso', () => {
    test('con credenciales correctas y rol válido, el administrador es autenticado exitosamente', () => {
      expect(loginAdministrador('admin', 'Admin123', 'administrador', false)).toBe("El Administrador es autenticado con acceso al panel de administración");
    });
  });
});
