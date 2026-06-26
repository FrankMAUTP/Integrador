'use strict';

/**
 * ============================================================
 *  Requerimiento 15 — Registro de calificaciones de un alumno
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Sin actividades creadas
 *    E2 – Flujo exitoso - Gestión de notas en modo edición
 */

// ================================================================
// FUNCIONES AUXILIARES SIMULANDO LA LÓGICA FRONTEND
// ================================================================

function evaluarRegistroNota(actividadesCreadas, nuevaNota) {
  if (actividadesCreadas === 0) {
    return { exito: false, mensaje: "El sistema no habilitará la opción de registrar nota" };
  }
  
  const notasPermitidas = ['AD', 'A', 'B', 'C'];
  if (!notasPermitidas.includes(nuevaNota)) {
    return { exito: false, mensaje: "Nota inválida" };
  }

  return { exito: true, mensaje: "Se actualiza la nota en la tabla de alumnos y se refleja los cambios en el promedio de la competencia" };
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 15 — Registro de calificaciones de un alumno', () => {
  describe('E1 — Sin actividades creadas', () => {
    test('si el docente no creó ninguna actividad, el sistema no habilitará la opción de registrar nota', () => {
      const actividadesCero = 0;
      const resultado = evaluarRegistroNota(actividadesCero, 'A');
      
      expect(resultado.exito).toBe(false);
      expect(resultado.mensaje).toBe('El sistema no habilitará la opción de registrar nota');
    });
  });

  describe('E2 — Flujo exitoso', () => {
    test('permite registrar la calificación si existen actividades y actualiza la tabla', () => {
      const actividadesExistentes = 1;
      const resultado = evaluarRegistroNota(actividadesExistentes, 'AD');
      
      expect(resultado.exito).toBe(true);
      expect(resultado.mensaje).toBe('Se actualiza la nota en la tabla de alumnos y se refleja los cambios en el promedio de la competencia');
    });
  });
});
