'use strict';

/**
 * ============================================================
 *  Requerimiento 32 — El sistema debe permitir cambiar contraseña de usuario
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Campos vacíos
 *    E2 – Contraseña actual incorrecta
 *    E3 – Contraseña nueva demasiado corta
 *    E4 – Flujo exitoso - Actualización de contraseña
 */

// ================================================================
// FUNCIONES AUXILIARES SIMULANDO LA LÓGICA FRONTEND
// ================================================================

function validarCambioContrasena(antiguaPass, nuevaPass, confirmarPass, passActualBD) {
  if (!antiguaPass || !nuevaPass || !confirmarPass) {
    return "Completa todos los campos";
  }
  
  if (antiguaPass !== passActualBD) {
    return "La contraseña actual es incorrecta";
  }

  if (nuevaPass.length < 6) {
    return "La nueva contraseña debe tener al menos 6 caracteres";
  }

  return "Contraseña actualizada exitosamente";
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 32 — Actualizar contraseña', () => {
  const passBD = 'miClave123';

  describe('E1 — Campos vacíos', () => {
    test('muestra "Completa todos los campos" si falta algún dato', () => {
      expect(validarCambioContrasena('', 'nueva123', 'nueva123', passBD)).toBe('Completa todos los campos');
      expect(validarCambioContrasena('miClave123', '', 'nueva123', passBD)).toBe('Completa todos los campos');
    });
  });

  describe('E2 — Contraseña actual incorrecta', () => {
    test('muestra "La contraseña actual es incorrecta" si no coincide con la BD', () => {
      expect(validarCambioContrasena('claveMala', 'nueva123', 'nueva123', passBD)).toBe('La contraseña actual es incorrecta');
    });
  });

  describe('E3 — Contraseña nueva demasiado corta', () => {
    test('muestra "La nueva contraseña debe tener al menos 6 caracteres" si tiene menos de 6', () => {
      expect(validarCambioContrasena(passBD, '12345', '12345', passBD)).toBe('La nueva contraseña debe tener al menos 6 caracteres');
    });
  });

  describe('E4 — Flujo exitoso', () => {
    test('permite actualizar la contraseña si todos los datos son válidos', () => {
      expect(validarCambioContrasena(passBD, 'nuevaClave123', 'nuevaClave123', passBD)).toBe('Contraseña actualizada exitosamente');
    });
  });
});
