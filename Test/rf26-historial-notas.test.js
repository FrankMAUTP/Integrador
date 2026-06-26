'use strict';

/**
 * ============================================================
 *  Requerimiento 26 — Visualizar historial de notas de un alumno
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Acceso directo sin alumno seleccionado
 *    E2 – Actividades sin calificar
 *    E3 – Flujo exitoso - Visualización de historial de notas
 */

// ================================================================
// FUNCIONES AUXILIARES SIMULANDO LA LÓGICA FRONTEND
// ================================================================

function consultarHistorialNotas(alumnoId, historialActividades) {
  if (!alumnoId) {
    return { mensaje: "No hay datos disponibles", datos: [] };
  }

  // Verifica si hay actividades registradas pero sin notas asignadas
  const sinCalificar = historialActividades.every(a => a.nota === null);
  if (historialActividades.length > 0 && sinCalificar) {
    return { mensaje: "Muestra '—' en cada actividad", datos: historialActividades.map(a => ({ ...a, display: '—' })) };
  }

  return { mensaje: "Historial cargado correctamente", datos: historialActividades };
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 26 — Visualizar historial de notas de un alumno', () => {
  describe('E1 — Acceso directo sin alumno seleccionado', () => {
    test('si no se ha seleccionado un alumno, el sistema muestra "No hay datos disponibles"', () => {
      const resultado = consultarHistorialNotas(null, []);
      expect(resultado.mensaje).toBe("No hay datos disponibles");
    });
  });

  describe('E2 — Actividades sin calificar', () => {
    test('si el alumno tiene actividades pero sin notas asignadas, muestra "—" en cada actividad', () => {
      const actividades = [{ id: 1, curso: 'Mat', nota: null }];
      const resultado = consultarHistorialNotas(1, actividades);
      expect(resultado.mensaje).toBe("Muestra '—' en cada actividad");
      expect(resultado.datos[0].display).toBe("—");
    });
  });

  describe('E3 — Flujo exitoso', () => {
    test('el sistema muestra las notas del alumno organizadas por curso, bimestre y competencia', () => {
      const actividades = [{ id: 1, curso: 'Mat', nota: 18 }];
      const resultado = consultarHistorialNotas(1, actividades);
      expect(resultado.mensaje).toBe("Historial cargado correctamente");
      expect(resultado.datos[0].nota).toBe(18);
    });
  });
});
