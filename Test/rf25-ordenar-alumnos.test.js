'use strict';

/**
 * ============================================================
 *  Requerimiento 25 — Ordenamiento de registros de estudiantes
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Ordenar por notas sin actividades en el bimestre
 *    E2 – Ordenar por notas sin ninguna calificada
 *    E3 – Sección sin alumnos
 *    E4 – Flujo exitoso - Ordenamiento de lista de alumnos
 */

// ================================================================
// FUNCIONES AUXILIARES SIMULANDO LA LÓGICA FRONTEND
// ================================================================

function ordenarAlumnosPorNotas(alumnos, actividades) {
  if (alumnos.length === 0) {
    return { mensaje: "Sin alumnos", lista: [] };
  }

  if (actividades.length === 0) {
    return { mensaje: "Todos muestran promedio '—', sin diferencias visibles en el orden", lista: alumnos };
  }

  const hayNotas = alumnos.some(a => a.promedioNumerico > 0);
  if (!hayNotas) {
    return { mensaje: "Todos muestran promedio '—' y no presentan un orden diferenciado", lista: alumnos };
  }

  // Ordena de mayor a menor
  const alumnosOrdenados = [...alumnos].sort((a, b) => b.promedioNumerico - a.promedioNumerico);
  return { mensaje: "Lista reorganizada", lista: alumnosOrdenados };
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 25 — Ordenamiento de registros de estudiantes', () => {
  const alumnosSinNotas = [
    { nombre: 'A', promedioNumerico: 0 },
    { nombre: 'B', promedioNumerico: 0 }
  ];

  const alumnosConNotas = [
    { nombre: 'Juan', promedioNumerico: 12 },
    { nombre: 'Maria', promedioNumerico: 18 }
  ];

  describe('E1 — Ordenar por notas sin actividades en el bimestre', () => {
    test('si no hay actividades, todos muestran promedio "—" sin cambiar de orden', () => {
      const resultado = ordenarAlumnosPorNotas(alumnosSinNotas, []);
      expect(resultado.mensaje).toContain("sin diferencias visibles en el orden");
    });
  });

  describe('E2 — Ordenar por notas sin ninguna calificada', () => {
    test('si hay actividades pero ninguna nota, todos muestran promedio "—"', () => {
      const actividadesSinCalif = [{ id: 1 }];
      const resultado = ordenarAlumnosPorNotas(alumnosSinNotas, actividadesSinCalif);
      expect(resultado.mensaje).toContain("no presentan un orden diferenciado");
    });
  });

  describe('E3 — Sección sin alumnos', () => {
    test('si accede a sección sin alumnos registrados, muestra "Sin alumnos"', () => {
      const resultado = ordenarAlumnosPorNotas([], [{ id: 1 }]);
      expect(resultado.mensaje).toBe("Sin alumnos");
    });
  });

  describe('E4 — Flujo exitoso', () => {
    test('el sistema reorganiza inmediatamente la lista de mayor a menor promedio', () => {
      const resultado = ordenarAlumnosPorNotas(alumnosConNotas, [{ id: 1 }]);
      expect(resultado.lista[0].nombre).toBe('Maria'); // Maria tiene 18, va primero
      expect(resultado.lista[1].nombre).toBe('Juan');
    });
  });
});
