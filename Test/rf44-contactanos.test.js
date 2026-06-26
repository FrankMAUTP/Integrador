'use strict';

/**
 * ============================================================
 *  Requerimiento 44 — Contactanos
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Campos vacíos
 *    E2 – Correo compatible
 *    E3 – Nombre usuario ausente
 *    E4 – Flujo exitoso - Enviar mensaje
 */

function enviarMensajeContacto(nombre, correo, asunto, mensaje) {
  if (!nombre || nombre.trim() === '') {
    return "Ingrese su nombre";
  }

  // Validación básica de correo google/gmail
  if (!correo.includes('@gmail.com') && !correo.includes('@google.com')) {
    return "Ingrese un correo electrónico válido";
  }

  if (!asunto || asunto.trim() === '') {
    return "Ingrese el asunto";
  }

  if (!mensaje || mensaje.trim() === '') {
    return "Ingrese el mensaje";
  }

  return "El docente puede establecer comunicación con los desarrolladores de las páginas";
}

describe('Requerimiento 44 — Contactanos', () => {
  describe('E1 — Campos vacíos', () => {
    test('si el asunto no fue completado, retorna "Ingrese el asunto"', () => {
      expect(enviarMensajeContacto('Juan', 'juan@gmail.com', '', 'Mensaje')).toBe("Ingrese el asunto");
    });
    test('si el mensaje no fue completado, retorna "Ingrese el mensaje"', () => {
      expect(enviarMensajeContacto('Juan', 'juan@gmail.com', 'Duda', '')).toBe("Ingrese el mensaje");
    });
  });

  describe('E2 — Correo compatible', () => {
    test('si el correo no cumple el formato, retorna "Ingrese un correo electrónico válido"', () => {
      expect(enviarMensajeContacto('Juan', 'juan@hotmail.com', 'Duda', 'Mensaje')).toBe("Ingrese un correo electrónico válido");
    });
  });

  describe('E3 — Nombre usuario ausente', () => {
    test('si quita el nombre de usuario, valida y retorna "Ingrese su nombre"', () => {
      expect(enviarMensajeContacto('', 'juan@gmail.com', 'Duda', 'Mensaje')).toBe("Ingrese su nombre");
    });
  });

  describe('E4 — Flujo exitoso', () => {
    test('si todos los campos son correctos, el docente establece comunicación con los desarrolladores', () => {
      expect(enviarMensajeContacto('Juan', 'juan@gmail.com', 'Consulta', 'Quisiera saber algo'))
        .toBe("El docente puede establecer comunicación con los desarrolladores de las páginas");
    });
  });
});
