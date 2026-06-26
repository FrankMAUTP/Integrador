'use strict';

/**
 * ============================================================
 *  Requerimiento 33 — El sistema debe permitir recuperar contraseña de usuario
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Campos vacíos o con espacios
 *    E2 – Usuario o DNI no encontrados
 *    E3 – Código de verificación incorrecto
 *    E4 – Nueva contraseña inválida
 *    E5 – Flujo exitoso - Recuperación de contraseña
 */

// ================================================================
// FUNCIONES AUXILIARES SIMULANDO LA LÓGICA FRONTEND
// ================================================================

function solicitarCodigoRecuperacion(usuario, dni, bdUsuarios) {
  if (!usuario || !dni || usuario.trim() === '' || dni.trim() === '') {
    return "Entrada inválida. Asegúrese de llenar los campos correctamente y sin espacios vacíos";
  }

  const usuarioExiste = bdUsuarios.find(u => u.username === usuario && u.dni === dni);
  if (!usuarioExiste) {
    return "Los datos ingresados no corresponden a ningún usuario registrado";
  }

  return "Código enviado";
}

function validarNuevaContrasenaRecuperacion(codigoIngresado, codigoReal, nuevaPass) {
  if (codigoIngresado !== codigoReal) {
    return "Código de verificación inválido";
  }

  if (nuevaPass.length < 6) {
    return "La contraseña no cumple con los requisitos mínimos de seguridad";
  }

  return "La nueva contraseña ha sido establecida correctamente";
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 33 — Recuperar contraseña', () => {
  const bdUsuarios = [
    { username: 'docente1', dni: '12345678' }
  ];
  const codigoReal = '999999';

  describe('E1 — Campos vacíos o con espacios', () => {
    test('muestra error de entrada inválida si los campos están vacíos o son solo espacios', () => {
      expect(solicitarCodigoRecuperacion(' ', '12345678', bdUsuarios))
        .toBe('Entrada inválida. Asegúrese de llenar los campos correctamente y sin espacios vacíos');
    });
  });

  describe('E2 — Usuario o DNI no encontrados', () => {
    test('muestra error si el usuario no existe en la BD', () => {
      expect(solicitarCodigoRecuperacion('docente2', '87654321', bdUsuarios))
        .toBe('Los datos ingresados no corresponden a ningún usuario registrado');
    });
  });

  describe('E3 — Código de verificación incorrecto', () => {
    test('muestra "Código de verificación inválido" si el código no coincide', () => {
      expect(validarNuevaContrasenaRecuperacion('111111', codigoReal, 'nuevaPass123'))
        .toBe('Código de verificación inválido');
    });
  });

  describe('E4 — Nueva contraseña inválida', () => {
    test('muestra error de seguridad si la contraseña es menor a 6 caracteres', () => {
      expect(validarNuevaContrasenaRecuperacion(codigoReal, codigoReal, '12345'))
        .toBe('La contraseña no cumple con los requisitos mínimos de seguridad');
    });
  });

  describe('E5 — Flujo exitoso', () => {
    test('restablece la contraseña si el código es correcto y la contraseña cumple requisitos', () => {
      expect(validarNuevaContrasenaRecuperacion(codigoReal, codigoReal, 'nuevaSegura123'))
        .toBe('La nueva contraseña ha sido establecida correctamente');
    });
  });
});
