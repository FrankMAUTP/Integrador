'use strict';

/**
 * ============================================================
 *  Requerimiento 38 — Personalizar la interfaz
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Incompatibilidad del navegador
 *    E2 – Flujo exitoso - Cambio de tema
 */

// ================================================================
// FUNCIONES AUXILIARES SIMULANDO LA LÓGICA FRONTEND
// ================================================================

function cambiarTemaVisual(temaDeseado, navegadorSoportaCambios) {
  if (!navegadorSoportaCambios) {
    return {
      exito: false,
      mensaje: "El sistema mantendrá el tema por defecto",
      temaActual: "claro" // Tema por defecto
    };
  }

  return {
    exito: true,
    mensaje: "Cambio cromático aplicado en toda la interfaz de forma inmediata",
    temaActual: temaDeseado
  };
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 38 — Personalizar la interfaz', () => {
  describe('E1 — Incompatibilidad del navegador', () => {
    test('si el navegador no soporta cambios dinámicos, el sistema mantendrá el tema por defecto', () => {
      const navegadorSoportaCambios = false;
      const temaDeseado = 'oscuro';
      
      const resultado = cambiarTemaVisual(temaDeseado, navegadorSoportaCambios);
      
      expect(resultado.exito).toBe(false);
      expect(resultado.mensaje).toBe('El sistema mantendrá el tema por defecto');
      expect(resultado.temaActual).toBe('claro'); // Asumiendo 'claro' como por defecto
    });
  });

  describe('E2 — Flujo exitoso', () => {
    test('el usuario selecciona el modo deseado y el sistema aplica el cambio cromático', () => {
      const navegadorSoportaCambios = true;
      const temaDeseado = 'oscuro';
      
      const resultado = cambiarTemaVisual(temaDeseado, navegadorSoportaCambios);
      
      expect(resultado.exito).toBe(true);
      expect(resultado.mensaje).toBe('Cambio cromático aplicado en toda la interfaz de forma inmediata');
      expect(resultado.temaActual).toBe('oscuro');
    });
  });
});
