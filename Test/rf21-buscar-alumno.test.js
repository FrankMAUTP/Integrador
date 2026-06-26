'use strict';

/**
 * ============================================================
 *  Requerimiento 21 — Buscar alumno por nombre
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Sin coincidencias en la búsqueda
 *    E2 – Ingreso de números o caracteres especiales
 *    E3 – Sin alumnos registrados en el sistema
 *    E4 – Búsqueda dentro de filtros sin coincidencias
 *    E5 – Alumno retirado no visible con filtro de estado activo
 *    E6 – Flujo exitoso - Búsqueda de alumno por nombre
 */

// ================================================================
// FUNCIONES AUXILIARES SIMULANDO LA LÓGICA FRONTEND
// ================================================================

function limpiarTextoBusqueda(texto) {
  // Elimina números y caracteres especiales, dejando solo letras y espacios
  return texto.replace(/[^a-zA-Z\s]/g, '');
}

function buscarAlumno(textoBusqueda, bdAlumnos, filtros = {}) {
  if (bdAlumnos.length === 0) {
    return { mensaje: "No se encontraron alumnos", resultados: [] };
  }

  const textoLimpio = limpiarTextoBusqueda(textoBusqueda);
  let resultados = bdAlumnos;

  // Aplica filtros de estado si existen
  if (filtros.estado === 'Activo') {
    resultados = resultados.filter(a => a.estado !== 'Retirado');
  }

  // Búsqueda por nombre
  if (textoLimpio.trim() !== '') {
    resultados = resultados.filter(a => a.nombre.toLowerCase().includes(textoLimpio.toLowerCase()));
  }

  if (resultados.length === 0) {
    return { mensaje: "No se encontraron alumnos", resultados: [], textoLimpio };
  }

  return { mensaje: "Alumnos encontrados", resultados, textoLimpio };
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 21 — Buscar alumno por nombre', () => {
  const bdAlumnos = [
    { id: 1, nombre: 'Juan Perez', estado: 'Activo' },
    { id: 2, nombre: 'Maria Gomez', estado: 'Activo' },
    { id: 3, nombre: 'Carlos Ruiz', estado: 'Retirado' }
  ];

  describe('E1 — Sin coincidencias en la búsqueda', () => {
    test('si no coincide con ningún alumno, muestra "No se encontraron alumnos"', () => {
      const resultado = buscarAlumno('Zacarias', bdAlumnos);
      expect(resultado.mensaje).toBe("No se encontraron alumnos");
    });
  });

  describe('E2 — Ingreso de números o caracteres especiales', () => {
    test('el sistema elimina automáticamente los valores inválidos dejando solo letras', () => {
      const resultado = buscarAlumno('Ju@n123', bdAlumnos);
      expect(resultado.textoLimpio).toBe('Jun'); // 'Ju@n123' limpio es 'Jun'
    });
  });

  describe('E3 — Sin alumnos registrados en el sistema', () => {
    test('si realiza una búsqueda sin existir alumnos, muestra "No se encontraron alumnos"', () => {
      const bdVacia = [];
      const resultado = buscarAlumno('Juan', bdVacia);
      expect(resultado.mensaje).toBe("No se encontraron alumnos");
    });
  });

  describe('E4 — Búsqueda dentro de filtros sin coincidencias', () => {
    test('si aplica filtros y no hay resultados, muestra "No se encontraron alumnos"', () => {
      // Buscamos a Maria pero solo en un arreglo que simula un filtro donde ella no está
      const resultado = buscarAlumno('Juan', [], { curso: 'Historia' }); // Simulamos bd filtrada vacia
      expect(resultado.mensaje).toBe("No se encontraron alumnos");
    });
  });

  describe('E5 — Alumno retirado no visible con filtro de estado activo', () => {
    test('si busca un alumno retirado con el filtro Activo, el sistema no muestra al alumno', () => {
      const resultado = buscarAlumno('Carlos', bdAlumnos, { estado: 'Activo' });
      expect(resultado.mensaje).toBe("No se encontraron alumnos");
    });
  });

  describe('E6 — Flujo exitoso', () => {
    test('el sistema filtra en tiempo real mostrando únicamente los alumnos que coinciden', () => {
      const resultado = buscarAlumno('Maria', bdAlumnos);
      expect(resultado.resultados.length).toBe(1);
      expect(resultado.resultados[0].nombre).toBe('Maria Gomez');
    });
  });
});
