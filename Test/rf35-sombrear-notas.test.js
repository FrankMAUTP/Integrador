'use strict';

/**
 * ============================================================
 *  Requerimiento 35 — Sombrear notas pendientes
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Falta de calificaciones
 *    E2 – Periodos sin notas iniciadas
 *    E3 – Flujo exitoso - Sombrear notas pendientes
 */

function evaluarNotasBimestre(alumnoNotasBimestre, totalAlumnosBimestre) {
  if (totalAlumnosBimestre === 0) {
    return {
      estadoCelda: 'vacio',
      mensaje: 'No se registran calificaciones para el periodo seleccionado'
    };
  }
  
  if (alumnoNotasBimestre.length === 0) {
    return {
      estadoCelda: 'blanco',
      alertaVisual: 'Sin Evaluar',
      afectaPromedio: false
    };
  }

  // Si tiene notas pendientes de calificar
  const notasPendientes = alumnoNotasBimestre.filter(n => n.valor === null && n.dentroDelPlazo === true);
  if (notasPendientes.length > 0) {
    return {
      estadoCelda: 'sombreado',
      mensaje: 'Existen notas pendientes de calificación'
    };
  }

  return { estadoCelda: 'normal', mensaje: 'Todo calificado' };
}

describe('Requerimiento 35 — Sombrear notas pendientes', () => {
  describe('E1 — Falta de calificaciones', () => {
    test('si el alumno no tiene notas, deja el casillero en blanco y muestra alerta "Sin Evaluar"', () => {
      const alumnoSinNotas = [];
      const totalAlumnosConRegistro = 10;
      
      const resultado = evaluarNotasBimestre(alumnoSinNotas, totalAlumnosConRegistro);
      expect(resultado.estadoCelda).toBe('blanco');
      expect(resultado.alertaVisual).toBe('Sin Evaluar');
      expect(resultado.afectaPromedio).toBe(false);
    });
  });

  describe('E2 — Periodos sin notas iniciadas', () => {
    test('si ningún alumno tiene notas en el bimestre, muestra la tabla limpia y el mensaje informativo', () => {
      const alumnoSinNotas = [];
      const totalAlumnosConRegistro = 0; // Nadie tiene notas
      
      const resultado = evaluarNotasBimestre(alumnoSinNotas, totalAlumnosConRegistro);
      expect(resultado.mensaje).toBe('No se registran calificaciones para el periodo seleccionado');
    });
  });

  describe('E3 — Flujo exitoso', () => {
    test('el sistema sombrea las celdas de notas pendientes dentro del tiempo establecido', () => {
      const alumnoConPendientes = [{ valor: null, dentroDelPlazo: true }];
      const totalAlumnosConRegistro = 10;
      
      const resultado = evaluarNotasBimestre(alumnoConPendientes, totalAlumnosConRegistro);
      expect(resultado.estadoCelda).toBe('sombreado');
    });
  });
});
