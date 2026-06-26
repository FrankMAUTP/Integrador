'use strict';

/**
 * ============================================================
 *  Requerimiento 24 — Visualización del rendimiento general
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Sin alumnos activos en la sección
 *    E2 – Sin actividades registradas
 *    E3 – Sin notas asignadas
 *    E4 – Todos los alumnos de la sección retirados
 *    E5 – Flujo exitoso - Visualización de promedio general de sección
 */

// ================================================================
// FUNCIONES AUXILIARES SIMULANDO LA LÓGICA FRONTEND
// ================================================================

function calcularRendimientoGeneral(alumnos, actividades) {
  const alumnosActivos = alumnos.filter(a => a.estado !== 'Retirado');

  if (alumnos.length === 0) {
    return "—"; // E1
  }

  if (alumnosActivos.length === 0) {
    return "—"; // E4
  }

  if (actividades.length === 0) {
    return "—"; // E2
  }

  const notasTotales = [];
  alumnosActivos.forEach(a => {
    if (a.notas) {
      notasTotales.push(...a.notas);
    }
  });

  if (notasTotales.length === 0) {
    return "—"; // E3
  }

  const promedioNum = Math.round(notasTotales.reduce((a, b) => a + b, 0) / notasTotales.length);
  if (promedioNum >= 18) return 'AD';
  if (promedioNum >= 14) return 'A';
  if (promedioNum >= 11) return 'B';
  return 'C';
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 24 — Visualización del rendimiento general', () => {
  const alumnoActivo = { id: 1, estado: 'Activo', notas: [15, 17] }; // Promedio A
  const alumnoRetirado = { id: 2, estado: 'Retirado', notas: [20, 20] };

  describe('E1 — Sin alumnos activos en la sección', () => {
    test('si la sección no tiene alumnos registrados, muestra "—"', () => {
      expect(calcularRendimientoGeneral([], [{ id: 1 }])).toBe("—");
    });
  });

  describe('E2 — Sin actividades registradas', () => {
    test('si no hay actividades, el sistema muestra "—" en el promedio general', () => {
      expect(calcularRendimientoGeneral([alumnoActivo], [])).toBe("—");
    });
  });

  describe('E3 — Sin notas asignadas', () => {
    test('si hay actividades pero ninguna calificada, el sistema muestra "—"', () => {
      const alumnoSinNotas = { id: 3, estado: 'Activo', notas: [] };
      expect(calcularRendimientoGeneral([alumnoSinNotas], [{ id: 1 }])).toBe("—");
    });
  });

  describe('E4 — Todos los alumnos de la sección retirados', () => {
    test('si todos están retirados, son excluidos del cálculo y muestra "—"', () => {
      expect(calcularRendimientoGeneral([alumnoRetirado], [{ id: 1 }])).toBe("—");
    });
  });

  describe('E5 — Flujo exitoso', () => {
    test('calcula y muestra el promedio general de la sección como una letra', () => {
      expect(calcularRendimientoGeneral([alumnoActivo], [{ id: 1 }])).toBe("A");
    });
  });
});
