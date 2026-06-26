'use strict';

/**
 * ============================================================
 *  Requerimiento 31 — Eliminación de un curso
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Todos los alumnos con nota promedio
 *    E2 – Cancelación de borrado
 */

// ================================================================
// FUNCIONES AUXILIARES SIMULANDO LA LÓGICA FRONTEND
// ================================================================

function validarEliminarCurso(cursoId, confirmacionUsuario, promediosAlumnos) {
  const todosTienenPromedio = promediosAlumnos.length > 0 && promediosAlumnos.every(p => p.cursoId === cursoId && p.tienePromedioFinal === true);
  
  // Excepción E1: (Manteniendo el texto exacto del Excel que dice "actividad" en lugar de "curso")
  if (todosTienenPromedio) {
    return { exito: false, mensaje: "No se puede eliminar la actividad porque ya cuenta con promedios registrados" };
  }

  // Excepción E2: Cancelación
  if (!confirmacionUsuario) {
    return { exito: false, mensaje: "El sistema cancela el proceso y regresa a la pantalla del listado sin modificar nada" };
  }

  return { exito: true, mensaje: "Curso eliminado de la base de datos" };
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 31 — Eliminación de un curso', () => {
  
  describe('E1 — Todos los alumnos con nota promedio', () => {
    test('el sistema cancela la eliminación y muestra el mensaje exacto documentado (incluso con la palabra "actividad")', () => {
      const bdPromedios = [
        { alumnoId: 'A01', cursoId: 'curso-1', tienePromedioFinal: true },
        { alumnoId: 'A02', cursoId: 'curso-1', tienePromedioFinal: true }
      ];
      
      const resultado = validarEliminarCurso('curso-1', true, bdPromedios);
      
      expect(resultado.exito).toBe(false);
      expect(resultado.mensaje).toBe('No se puede eliminar la actividad porque ya cuenta con promedios registrados');
    });
  });

  describe('E2 — Cancelación de borrado', () => {
    test('si el docente no confirma la advertencia, el sistema cancela el proceso sin modificar nada', () => {
      const bdPromedios = []; // Sin promedios finales
      const confirmacionUsuario = false; // Docente rechaza borrar
      
      const resultado = validarEliminarCurso('curso-1', confirmacionUsuario, bdPromedios);
      
      expect(resultado.exito).toBe(false);
      expect(resultado.mensaje).toBe('El sistema cancela el proceso y regresa a la pantalla del listado sin modificar nada');
    });
  });

});
