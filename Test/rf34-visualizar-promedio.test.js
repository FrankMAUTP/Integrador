'use strict';

/**
 * ============================================================
 *  Requerimiento 34 — Visualizar promedio bimestral de una sección
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Flujo exitoso - Cálculo de promedios cualitativos bimestrales
 */

// ================================================================
// FUNCIONES AUXILIARES SIMULANDO LA LÓGICA FRONTEND
// ================================================================

function calcularPromedioCualitativo(notasNumericas) {
  if (notasNumericas.length === 0) return '-';
  const suma = notasNumericas.reduce((a, b) => a + b, 0);
  const promedio = Math.round(suma / notasNumericas.length);

  if (promedio >= 18) return 'AD';
  if (promedio >= 14) return 'A';
  if (promedio >= 11) return 'B';
  return 'C';
}

function generarReporteBimestral(alumnos, notas) {
  return alumnos.map(alumno => {
    const notasBimestre1 = notas.filter(n => n.alumnoId === alumno.id && n.bimestre === 1).map(n => n.valor);
    const notasBimestre2 = notas.filter(n => n.alumnoId === alumno.id && n.bimestre === 2).map(n => n.valor);
    const notasBimestre3 = notas.filter(n => n.alumnoId === alumno.id && n.bimestre === 3).map(n => n.valor);
    const notasBimestre4 = notas.filter(n => n.alumnoId === alumno.id && n.bimestre === 4).map(n => n.valor);

    return {
      nombre: alumno.nombre,
      B1: calcularPromedioCualitativo(notasBimestre1),
      B2: calcularPromedioCualitativo(notasBimestre2),
      B3: calcularPromedioCualitativo(notasBimestre3),
      B4: calcularPromedioCualitativo(notasBimestre4)
    };
  });
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 34 — Visualizar promedio bimestral de una sección', () => {

  const alumnosBD = [
    { id: 'A01', nombre: 'Juan Pérez' }
  ];

  const notasBD = [
    { alumnoId: 'A01', bimestre: 1, valor: 18 },
    { alumnoId: 'A01', bimestre: 1, valor: 19 }, // Promedio B1: 19 -> AD
    { alumnoId: 'A01', bimestre: 2, valor: 14 },
    { alumnoId: 'A01', bimestre: 2, valor: 15 }, // Promedio B2: 15 -> A
    { alumnoId: 'A01', bimestre: 3, valor: 11 },
    { alumnoId: 'A01', bimestre: 3, valor: 12 }, // Promedio B3: 12 -> B
    { alumnoId: 'A01', bimestre: 4, valor: 10 },
    { alumnoId: 'A01', bimestre: 4, valor: 0 }   // Promedio B4: 5 -> C
  ];

  describe('E1 — Flujo exitoso - Cálculo de promedios cualitativos bimestrales', () => {
    test('el sistema ejecuta el algoritmo de cálculo cualitativo y muestra la tabla en formato de letras (AD, A, B, C)', () => {
      const reporte = generarReporteBimestral(alumnosBD, notasBD);

      expect(reporte.length).toBe(1);
      expect(reporte[0].nombre).toBe('Juan Pérez');
      
      // Verificamos la conversión cualitativa exacta para cada bimestre
      expect(reporte[0].B1).toBe('AD');
      expect(reporte[0].B2).toBe('A');
      expect(reporte[0].B3).toBe('B');
      expect(reporte[0].B4).toBe('C');
    });
  });

});
