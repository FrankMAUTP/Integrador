'use strict';

/**
 * ============================================================
 *  Requerimiento 14 — Visualización de secciones creadas
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Sin secciones asignadas
 *    E2 – Búsqueda sin resultados
 *    E3 – Flujo exitoso - Visualización por cuadros segmentados
 */

function filtrarSecciones(seccionesDelCurso, filtroGrado) {
  if (!seccionesDelCurso || seccionesDelCurso.length === 0) {
    return "Sin secciones";
  }

  if (filtroGrado) {
    const filtradas = seccionesDelCurso.filter(s => s.grado === filtroGrado);
    if (filtradas.length === 0) {
      return "Sin secciones"; // Búsqueda sin resultados
    }
    return filtradas;
  }

  return seccionesDelCurso; // Despliega la información general
}

describe('Requerimiento 14 — Visualización de secciones creadas', () => {
  const bdSecciones = [
    { id: 1, grado: '1ro Secundaria', nombre: 'A' },
    { id: 2, grado: '2do Secundaria', nombre: 'B' }
  ];

  describe('E1 — Sin secciones asignadas', () => {
    test('si el docente no tiene secciones asignadas, muestra un mensaje indicando "Sin secciones"', () => {
      const sinSecciones = [];
      expect(filtrarSecciones(sinSecciones, null)).toBe("Sin secciones");
    });
  });

  describe('E2 — Búsqueda sin resultados', () => {
    test('si filtra por un grado sin secciones, el sistema muestra "Sin secciones"', () => {
      const filtroInexistente = '5to Secundaria';
      expect(filtrarSecciones(bdSecciones, filtroInexistente)).toBe("Sin secciones");
    });
  });

  describe('E3 — Flujo exitoso', () => {
    test('el sistema obtiene la lista y despliega la información correctamente', () => {
      const resultado = filtrarSecciones(bdSecciones, null); // Sin filtros extra, devuelve todo
      
      expect(Array.isArray(resultado)).toBe(true);
      expect(resultado.length).toBe(2);
      expect(resultado[0].grado).toBe('1ro Secundaria');
    });
  });
});
