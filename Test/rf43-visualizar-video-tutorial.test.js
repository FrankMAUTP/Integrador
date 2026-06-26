'use strict';

/**
 * ============================================================
 *  Requerimiento 43 — Visualizar video tutorial
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Video eliminado
 *    E2 – Latencia de red
 *    E3 – Flujo exitoso - Visualización del tutorial
 */

function visualizarVideo(enlaceActivo, velocidadRedMbps) {
  if (!enlaceActivo) {
    return "Video no disponible";
  }
  if (velocidadRedMbps < 0.5) {
    return "El video se muestra en calidad muy baja, no se aprecia los detalles del tutorial";
  }
  return "El sistema muestra el video subido a la página";
}

describe('Requerimiento 43 — Visualizar video tutorial', () => {
  describe('E1 — Video eliminado', () => {
    test('si el video fue quitado o desactivado de su repositorio, el sistema retorna "Video no disponible"', () => {
      expect(visualizarVideo(false, 10)).toBe("Video no disponible");
    });
  });

  describe('E2 — Latencia de red', () => {
    test('si la velocidad de red es menor a 0.5 Mbps, el video se muestra en calidad muy baja', () => {
      expect(visualizarVideo(true, 0.3)).toBe("El video se muestra en calidad muy baja, no se aprecia los detalles del tutorial");
    });
  });

  describe('E3 — Flujo exitoso', () => {
    test('si el enlace existe y la red es buena, el sistema muestra el video correctamente', () => {
      expect(visualizarVideo(true, 5)).toBe("El sistema muestra el video subido a la página");
    });
  });
});
