'use strict';

/**
 * ============================================================
 *  Requerimiento 28 — Asignación de competencias a bimestres
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Competencia sin nombre
 *    E2 – Nombre con caracteres no permitidos
 *    E3 – Competencia duplicada
 *    E4 – Eliminar la única competencia del curso
 *    E5 – Límite de competencias alcanzado (4 competencias)
 *    E6 – Sin competencia seleccionada en algún bimestre
 *    E7 – Flujo exitoso - Asignación de competencias a bimestres
 */

// ================================================================
// FUNCIONES AUXILIARES SIMULANDO LA LÓGICA FRONTEND
// ================================================================

function validarNuevaCompetencia(nombre, competenciasExistentes) {
  if (!nombre || nombre.trim() === '') {
    return "Ingresa al menos una competencia";
  }
  // Permitimos solo letras y espacios
  if (/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ ]/.test(nombre)) {
    return "La competencia solo puede contener letras";
  }
  if (competenciasExistentes.includes(nombre)) {
    return "Competencia duplicada";
  }
  return null;
}

function validarLimiteCompetencias(competenciasExistentes) {
  // Según E5, con 4 competencias se oculta el botón/impide agregar
  return competenciasExistentes.length >= 4; 
}

function validarEliminacionCompetencia(competenciasExistentes) {
  if (competenciasExistentes.length <= 1) {
    return "El curso debe tener al menos una competencia";
  }
  return null;
}

function validateSectionCompetencias(competenciasAsignadas) {
  // Verifica que los 4 bimestres tengan al menos 1 competencia
  for (let b = 1; b <= 4; b++) {
    if (!competenciasAsignadas[b] || competenciasAsignadas[b].length === 0) {
      return "Selecciona al menos 1 competencia por bimestre";
    }
  }
  return "Configuración guardada correctamente";
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 28 — Asignación de competencias a bimestres', () => {

  const competenciasBD = ['Indaga', 'Explica el mundo físico'];

  // --------------------------------------------------------------
  // E1 — Competencia sin nombre
  // --------------------------------------------------------------
  describe('E1 — Competencia sin nombre', () => {
    test('muestra "Ingresa al menos una competencia" si se envía vacío', () => {
      const nombre = '';
      const resultado = validarNuevaCompetencia(nombre, competenciasBD);
      expect(resultado).toBe('Ingresa al menos una competencia');
    });
  });

  // --------------------------------------------------------------
  // E2 — Nombre con caracteres no permitidos
  // --------------------------------------------------------------
  describe('E2 — Nombre con caracteres no permitidos', () => {
    test('muestra "La competencia solo puede contener letras" si contiene números o símbolos', () => {
      const nombreNumeros = 'Competencia 1';
      const nombreSimbolos = 'Comp@';
      
      expect(validarNuevaCompetencia(nombreNumeros, competenciasBD)).toBe('La competencia solo puede contener letras');
      expect(validarNuevaCompetencia(nombreSimbolos, competenciasBD)).toBe('La competencia solo puede contener letras');
    });
  });

  // --------------------------------------------------------------
  // E3 — Competencia duplicada
  // --------------------------------------------------------------
  describe('E3 — Competencia duplicada', () => {
    test('muestra "Competencia duplicada" si la competencia ya existe', () => {
      const nombre = 'Indaga'; // Ya existe en competenciasBD
      const resultado = validarNuevaCompetencia(nombre, competenciasBD);
      expect(resultado).toBe('Competencia duplicada');
    });
  });

  // --------------------------------------------------------------
  // E4 — Eliminar la única competencia del curso
  // --------------------------------------------------------------
  describe('E4 — Eliminar la única competencia del curso', () => {
    test('impide la acción mostrando "El curso debe tener al menos una competencia"', () => {
      const dbUnicaCompetencia = ['Matemática Básica'];
      const resultado = validarEliminacionCompetencia(dbUnicaCompetencia);
      expect(resultado).toBe('El curso debe tener al menos una competencia');
    });
    
    test('permite eliminar si hay más de una competencia', () => {
      const resultado = validarEliminacionCompetencia(competenciasBD); // Tiene 2
      expect(resultado).toBeNull();
    });
  });

  // --------------------------------------------------------------
  // E5 — Límite de competencias alcanzado
  // --------------------------------------------------------------
  describe('E5 — Límite de competencias alcanzado', () => {
    test('oculta la opción o bloquea el registro al llegar a 4 competencias', () => {
      const dbLlena = ['Comp1', 'Comp2', 'Comp3', 'Comp4'];
      const ocultarBoton = validarLimiteCompetencias(dbLlena);
      expect(ocultarBoton).toBe(true);
    });

    test('permite agregar si hay menos de 4', () => {
      const dbCasiLlena = ['Comp1', 'Comp2', 'Comp3'];
      const ocultarBoton = validarLimiteCompetencias(dbCasiLlena);
      expect(ocultarBoton).toBe(false);
    });
  });

  // --------------------------------------------------------------
  // E6 — Sin competencia seleccionada en algún bimestre
  // --------------------------------------------------------------
  describe('E6 — Sin competencia seleccionada en algún bimestre', () => {
    test('muestra "Selecciona al menos 1 competencia por bimestre" si falta asignar en un bimestre', () => {
      const asignacionIncompleta = {
        1: ['Indaga'],
        2: [], // Bimestre sin competencias
        3: ['Indaga'],
        4: ['Explica el mundo físico']
      };
      const resultado = validateSectionCompetencias(asignacionIncompleta);
      expect(resultado).toBe('Selecciona al menos 1 competencia por bimestre');
    });
  });

  // --------------------------------------------------------------
  // E7 — Flujo exitoso - Asignación de competencias
  // --------------------------------------------------------------
  describe('E7 — Flujo exitoso - Asignación de competencias a bimestres', () => {
    test('guarda la configuración correctamente si todos los bimestres tienen competencias asignadas', () => {
      const asignacionCompleta = {
        1: ['Indaga'],
        2: ['Indaga'],
        3: ['Explica el mundo físico'],
        4: ['Indaga', 'Explica el mundo físico'] // Bimestre 4 tiene ambas
      };
      const resultado = validateSectionCompetencias(asignacionCompleta);
      expect(resultado).toBe('Configuración guardada correctamente');
    });
  });

});
