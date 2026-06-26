'use strict';

/**
 * ============================================================
 *  Requerimiento 27 — Selección de bimestre por sección
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Bimestre sin actividades registradas
 *    E2 – Selección de "Todos los bimestres"
 *    E3 – Flujo exitoso - Selección de bimestre por sección
 */

// ================================================================
// FUNCIONES AUXILIARES SIMULANDO LA LÓGICA FRONTEND
//
// Replican la lógica de applyFilters() en seccionespecifica.js
// ================================================================

/**
 * Simula la obtención de actividades filtradas por bimestre.
 */
function getFilteredActivities(activities, bimestreId) {
  if (bimestreId === 0) return activities; // 0 significa "Todos los bimestres"
  return activities.filter(a => a.bimestre === bimestreId);
}

/**
 * Simula el estado de la interfaz tras seleccionar un bimestre en el combobox
 */
function aplicarFiltroBimestre(bimestreId, activities) {
  const acts = getFilteredActivities(activities, bimestreId);
  const estadoUI = {
    actividadesMostradas: acts.length,
    btnEditarNotasVisible: bimestreId !== 0,
    filtroCompetenciasHabilitado: bimestreId !== 0,
    mensajeVacio: acts.length === 0 ? "Sin actividades para este bimestre" : null
  };
  return estadoUI;
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 27 — Selección de bimestre por sección', () => {
  
  // Base de datos de prueba en memoria
  const bdSimulada = [
    { id: 'act1', name: 'Práctica 1', bimestre: 1, type: 'practica' },
    { id: 'act2', name: 'Exposición', bimestre: 1, type: 'exposicion' },
    { id: 'act3', name: 'Trabajo Final', bimestre: 2, type: 'trabajo' }
  ];

  // --------------------------------------------------------------
  // E1 — Bimestre sin actividades registradas
  // --------------------------------------------------------------
  describe('E1 — Bimestre sin actividades registradas', () => {
    test('la tabla no muestra columnas de actividades y muestra mensaje de vacío cuando el bimestre no tiene actividades', () => {
      // Arrange
      const bimestreSeleccionado = 3; // Bimestre 3 no tiene actividades en la BD simulada
      
      // Act
      const resultadoUI = aplicarFiltroBimestre(bimestreSeleccionado, bdSimulada);

      // Assert
      expect(resultadoUI.actividadesMostradas).toBe(0);
      expect(resultadoUI.mensajeVacio).toBe('Sin actividades para este bimestre');
    });
  });

  // --------------------------------------------------------------
  // E2 — Selección de "Todos los bimestres"
  // --------------------------------------------------------------
  describe('E2 — Selección de "Todos los bimestres"', () => {
    test('oculta el botón "Editar notas" y deshabilita el filtro de competencias al elegir "Todos los bimestres" (id 0)', () => {
      // Arrange
      const bimestreSeleccionado = 0; // 0 representa el filtro "Todos los bimestres"
      
      // Act
      const resultadoUI = aplicarFiltroBimestre(bimestreSeleccionado, bdSimulada);

      // Assert
      expect(resultadoUI.btnEditarNotasVisible).toBe(false);
      expect(resultadoUI.filtroCompetenciasHabilitado).toBe(false);
      // Muestra todas las actividades de todos los bimestres para el promedio anual
      expect(resultadoUI.actividadesMostradas).toBe(3); 
    });
  });

  // --------------------------------------------------------------
  // E3 — Flujo exitoso - Selección de bimestre por sección
  // --------------------------------------------------------------
  describe('E3 — Flujo exitoso - Selección de bimestre por sección', () => {
    test('el sistema actualiza la tabla mostrando las actividades y habilitando opciones correspondientes a ese bimestre', () => {
      // Arrange
      const bimestreSeleccionado = 1;
      
      // Act
      const resultadoUI = aplicarFiltroBimestre(bimestreSeleccionado, bdSimulada);
      const actividadesFiltradas = getFilteredActivities(bdSimulada, bimestreSeleccionado);

      // Assert
      expect(resultadoUI.actividadesMostradas).toBe(2); // Hay 2 actividades en el bimestre 1
      expect(resultadoUI.btnEditarNotasVisible).toBe(true);
      expect(resultadoUI.filtroCompetenciasHabilitado).toBe(true);
      expect(resultadoUI.mensajeVacio).toBeNull();
      
      // Verificamos que exactamente devuelva las actividades del bimestre elegido
      expect(actividadesFiltradas.every(a => a.bimestre === 1)).toBe(true);
      expect(actividadesFiltradas.map(a => a.name)).toEqual(['Práctica 1', 'Exposición']);
    });
  });

});
