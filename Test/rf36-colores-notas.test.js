'use strict';

/**
 * ============================================================
 *  Requerimiento 36 — Identificar la nota de los alumnos
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Todas las notas registradas
 *    E2 – Fuera de tiempo establecido
 *    E3 – Flujo exitoso - Asignación de color a notas
 */

function asignarColorNota(nota, notasPendientes, plazoExpirado) {
  if (notasPendientes === 0) {
    return "No sombreará ninguna celda por notas pendientes";
  }

  if (plazoExpirado) {
    return "Estado grisáceo o estático";
  }

  // Flujo normal de colores (AD, A, B, C)
  if (nota === 'AD') return 'Azul';
  if (nota === 'A') return 'Verde';
  if (nota === 'B') return 'Naranja';
  if (nota === 'C') return 'Rojo';

  return "Color por defecto";
}

describe('Requerimiento 36 — Identificar la nota de los alumnos', () => {
  describe('E1 — Todas las notas registradas', () => {
    test('si el docente tiene todas las notas registradas, no sombreará ninguna celda por notas pendientes', () => {
      const notasPendientes = 0;
      const resultado = asignarColorNota('A', notasPendientes, false);
      
      expect(resultado).toBe('No sombreará ninguna celda por notas pendientes');
    });
  });

  describe('E2 — Fuera de tiempo establecido', () => {
    test('si el plazo ha expirado completamente, cambia el color a un estado grisáceo o estático', () => {
      const notasPendientes = 2;
      const plazoExpirado = true;
      const resultado = asignarColorNota('A', notasPendientes, plazoExpirado);
      
      expect(resultado).toBe('Estado grisáceo o estático');
    });
  });

  describe('E3 — Flujo exitoso', () => {
    test('el sistema identifica la nota y le asigna el color respectivo correctamente', () => {
      expect(asignarColorNota('AD', 1, false)).toBe('Azul');
      expect(asignarColorNota('C', 1, false)).toBe('Rojo');
    });
  });
});
