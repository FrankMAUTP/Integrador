'use strict';

/**
 * ============================================================
 *  Requerimiento 30 — Eliminación de actividad calificada
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Actividad con notas registradas
 *    E2 – Flujo exitoso - Eliminación de actividad calificada
 */

// ================================================================
// FUNCIONES AUXILIARES SIMULANDO LA LÓGICA FRONTEND
// ================================================================

function procesarEliminacionActividad(actividadId, confirmacionUsuario, notasRegistradas) {
  const tieneNotas = notasRegistradas.some(n => n.actividadId === actividadId);
  
  if (tieneNotas) {
    if (!confirmacionUsuario) {
      return { exito: false, mensaje: "Se advirtió que se perderán las notas asociadas, pero el usuario canceló" };
    }
  } else {
    if (!confirmacionUsuario) {
      return { exito: false, mensaje: "Cancelación de borrado" };
    }
  }

  return { exito: true, mensaje: "Actividad eliminada" };
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 30 — Eliminación de actividad calificada', () => {
  const baseDeDatosNotas = [
    { id: 1, actividadId: 'act-100', alumnoId: 'A01', nota: 18 }
  ];

  describe('E1 — Actividad con notas registradas', () => {
    test('el sistema muestra mensaje de confirmación indicando que se perderán notas y cancela si no se confirma', () => {
      const confirmacionUsuario = false; // Simula que cancela ante la advertencia
      const resultado = procesarEliminacionActividad('act-100', confirmacionUsuario, baseDeDatosNotas);
      
      expect(resultado.exito).toBe(false);
      expect(resultado.mensaje).toContain('se perderán las notas asociadas');
    });
  });

  describe('E2 — Flujo exitoso - Eliminación de actividad calificada', () => {
    test('el sistema elimina la actividad y muestra el mensaje "Actividad eliminada" al confirmar', () => {
      const confirmacionUsuario = true; // El docente acepta la advertencia
      const resultado = procesarEliminacionActividad('act-100', confirmacionUsuario, baseDeDatosNotas);
      
      expect(resultado.exito).toBe(true);
      expect(resultado.mensaje).toBe('Actividad eliminada');
    });
  });
});
