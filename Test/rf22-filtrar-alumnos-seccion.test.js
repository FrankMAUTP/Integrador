'use strict';

/**
 * ============================================================
 *  Requerimiento 22 — Filtrar Alumnos por Sección
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Sección sin alumnos registrados
 *    E2 – Filtrar sección sin seleccionar curso primero
 *    E3 – Curso seleccionado sin secciones
 *    E4 – Sin cursos registrados en el sistema
 *    E5 – Sección con todos sus alumnos retirados
 *    E6 – Flujo exitoso - Filtrado de alumnos por sección
 */

// ================================================================
// FUNCIONES AUXILIARES SIMULANDO LA LÓGICA FRONTEND
// ================================================================

function obtenerFiltroSeccion(cursoSeleccionado, bdCursos) {
  if (bdCursos.length === 0) {
    return "Filtros sin opciones disponibles";
  }
  
  if (!cursoSeleccionado) {
    return "Muestra la opción 'Todas'";
  }

  const curso = bdCursos.find(c => c.id === cursoSeleccionado);
  if (!curso.secciones || curso.secciones.length === 0) {
    return "Muestra la opción 'Todas'";
  }

  return "Opciones de sección disponibles";
}

function filtrarPorSeccion(seccion, bdAlumnos) {
  const alumnosSeccion = bdAlumnos.filter(a => a.seccion === seccion);
  
  if (alumnosSeccion.length === 0) {
    return { mensaje: "No se encontraron alumnos", resultados: [] };
  }

  const alumnosActivos = alumnosSeccion.filter(a => a.estado !== 'Retirado');
  
  if (alumnosActivos.length === 0) {
    return { mensaje: "No se encontraron alumnos", resultados: [] };
  }

  return { mensaje: "Alumnos filtrados", resultados: alumnosActivos };
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 22 — Filtrar Alumnos por Sección', () => {
  const bdCursos = [
    { id: 1, nombre: 'Matemática', secciones: ['A'] },
    { id: 2, nombre: 'Historia', secciones: [] }
  ];

  const bdAlumnos = [
    { id: 1, nombre: 'Juan', seccion: 'A', estado: 'Activo' },
    { id: 2, nombre: 'Pedro', seccion: 'B', estado: 'Retirado' } // En la B solo hay retirados
  ];

  describe('E1 — Sección sin alumnos registrados', () => {
    test('si la sección no tiene alumnos, el sistema muestra "No se encontraron alumnos"', () => {
      const resultado = filtrarPorSeccion('C', bdAlumnos); // Sección C no existe
      expect(resultado.mensaje).toBe("No se encontraron alumnos");
    });
  });

  describe('E2 — Filtrar sección sin seleccionar curso primero', () => {
    test('si no elige un curso previamente, el sistema solo muestra la opción "Todas"', () => {
      expect(obtenerFiltroSeccion(null, bdCursos)).toBe("Muestra la opción 'Todas'");
    });
  });

  describe('E3 — Curso seleccionado sin secciones', () => {
    test('si el curso no tiene secciones, el sistema muestra únicamente la opción "Todas"', () => {
      expect(obtenerFiltroSeccion(2, bdCursos)).toBe("Muestra la opción 'Todas'"); // Historia no tiene secciones
    });
  });

  describe('E4 — Sin cursos registrados en el sistema', () => {
    test('si no hay cursos registrados, los filtros aparecen sin opciones disponibles', () => {
      expect(obtenerFiltroSeccion(null, [])).toBe("Filtros sin opciones disponibles");
    });
  });

  describe('E5 — Sección con todos sus alumnos retirados', () => {
    test('si todos los alumnos están retirados, el sistema muestra "No se encontraron alumnos"', () => {
      const resultado = filtrarPorSeccion('B', bdAlumnos); // Solo Pedro (Retirado) está en B
      expect(resultado.mensaje).toBe("No se encontraron alumnos");
    });
  });

  describe('E6 — Flujo exitoso', () => {
    test('muestra únicamente los alumnos activos pertenecientes a la sección', () => {
      const resultado = filtrarPorSeccion('A', bdAlumnos);
      expect(resultado.resultados.length).toBe(1);
      expect(resultado.resultados[0].nombre).toBe('Juan');
    });
  });
});
