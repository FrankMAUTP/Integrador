'use strict';

/**
 * ============================================================
 *  Requerimiento 23 — Ver Promedio de Notas por Alumno
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Sin actividades en el bimestre
 *    E2 – Actividades sin notas asignadas
 *    E3 – Sin actividades en ningún bimestre
 *    E4 – Alumno retirado no visible en la tabla
 *    E5 – Sección sin alumnos registrados
 *    E6 – Flujo exitoso - Visualización de promedio de notas por alumno
 */

// ================================================================
// FUNCIONES AUXILIARES SIMULANDO LA LÓGICA FRONTEND
// ================================================================

function calcularPromedioAlumno(alumno, actividadesBimestre) {
  if (alumno.estado === 'Retirado') {
    return { visible: false }; // E4
  }

  if (actividadesBimestre.length === 0) {
    return { visible: true, promedio: "—" }; // E1, E3
  }

  const notas = actividadesBimestre.map(a => a.nota).filter(n => n !== null);
  
  if (notas.length === 0) {
    return { visible: true, promedio: "—" }; // E2
  }

  // Cálculo (simplificado)
  const promedioNum = Math.round(notas.reduce((a, b) => a + b, 0) / notas.length);
  let letra = 'C';
  if (promedioNum >= 18) letra = 'AD';
  else if (promedioNum >= 14) letra = 'A';
  else if (promedioNum >= 11) letra = 'B';

  return { visible: true, promedio: letra };
}

function verTablaSeccion(alumnosSeccion, actividadesBimestre) {
  if (alumnosSeccion.length === 0) {
    return "Sin alumnos"; // E5
  }
  
  return alumnosSeccion.map(a => calcularPromedioAlumno(a, actividadesBimestre)).filter(r => r.visible);
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 23 — Ver Promedio de Notas por Alumno', () => {
  const alumnoActivo = { id: 1, nombre: 'Juan', estado: 'Activo' };
  const alumnoRetirado = { id: 2, nombre: 'Pedro', estado: 'Retirado' };

  describe('E1 — Sin actividades en el bimestre', () => {
    test('si no hay actividades registradas en el bimestre, muestra "—"', () => {
      const resultado = calcularPromedioAlumno(alumnoActivo, []);
      expect(resultado.promedio).toBe("—");
    });
  });

  describe('E2 — Actividades sin notas asignadas', () => {
    test('si hay actividades creadas pero sin calificaciones, el sistema muestra "—"', () => {
      const actsSinNotas = [{ nota: null }];
      const resultado = calcularPromedioAlumno(alumnoActivo, actsSinNotas);
      expect(resultado.promedio).toBe("—");
    });
  });

  describe('E3 — Sin actividades en ningún bimestre', () => {
    test('si la sección no tiene actividades en ningún bimestre, el sistema muestra "—"', () => {
      // Equivalente a probar con array vacío de actividades
      const resultado = calcularPromedioAlumno(alumnoActivo, []);
      expect(resultado.promedio).toBe("—");
    });
  });

  describe('E4 — Alumno retirado no visible en la tabla', () => {
    test('el sistema excluye automáticamente a los alumnos con estado Retirado de la tabla', () => {
      const tabla = verTablaSeccion([alumnoActivo, alumnoRetirado], []);
      expect(tabla.length).toBe(1); // Solo muestra a Juan (Activo)
    });
  });

  describe('E5 — Sección sin alumnos registrados', () => {
    test('si la sección no tiene alumnos, muestra el mensaje "Sin alumnos"', () => {
      expect(verTablaSeccion([], [])).toBe("Sin alumnos");
    });
  });

  describe('E6 — Flujo exitoso', () => {
    test('calcula y muestra el promedio del alumno como una letra (AD, A, B o C)', () => {
      const actsConNotas = [{ nota: 18 }, { nota: 20 }]; // Promedio 19 -> AD
      const resultado = calcularPromedioAlumno(alumnoActivo, actsConNotas);
      expect(resultado.promedio).toBe("AD");
    });
  });
});
