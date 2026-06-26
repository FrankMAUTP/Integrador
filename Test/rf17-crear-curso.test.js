'use strict';

/**
 * ============================================================
 *  Requerimiento 17 — Crear Curso
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Curso ya existente
 *    E2 – Campos incompletos
 *    E3 – Sin competencias
 *    E4 – Flujo exitoso - Creación de cursos
 */

// ================================================================
// FUNCIONES AUXILIARES SIMULANDO LA LÓGICA FRONTEND
// ================================================================

function validarCreacionCurso(camposCurso, bdCursos) {
  if (!camposCurso.nombre || !camposCurso.descripcion) {
    return "Campos incompletos";
  }

  const nombreExiste = bdCursos.find(c => c.nombre.toLowerCase() === camposCurso.nombre.toLowerCase());
  if (nombreExiste) {
    return "Curso ya existente";
  }

  if (!camposCurso.competencias || camposCurso.competencias.length === 0) {
    return "Sin competencias";
  }

  return "El nuevo curso está registrado en la base de datos y está disponible en el sistema";
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 17 — Crear Curso', () => {
  const bdCursos = [
    { id: 1, nombre: 'Matemática' }
  ];

  describe('E1 — Curso ya existente', () => {
    test('si desea crear un curso con el mismo nombre de otro existente, muestra error y no permite el registro', () => {
      const cursoDuplicado = { nombre: 'Matemática', descripcion: 'Álgebra', competencias: ['C1'] };
      expect(validarCreacionCurso(cursoDuplicado, bdCursos)).toBe("Curso ya existente");
    });
  });

  describe('E2 — Campos incompletos', () => {
    test('si falta algún campo, el sistema muestra error y pide completar la información', () => {
      const cursoIncompleto = { nombre: '', descripcion: 'Álgebra', competencias: ['C1'] };
      expect(validarCreacionCurso(cursoIncompleto, bdCursos)).toBe("Campos incompletos");
    });
  });

  describe('E3 — Sin competencias', () => {
    test('si el curso no tiene al menos 1 competencia registrada, no permitirá la creación', () => {
      const cursoSinComps = { nombre: 'Física', descripcion: 'Física básica', competencias: [] };
      expect(validarCreacionCurso(cursoSinComps, bdCursos)).toBe("Sin competencias");
    });
  });

  describe('E4 — Flujo exitoso', () => {
    test('el sistema guarda la información en la base de datos y muestra mensaje de éxito', () => {
      const cursoValido = { nombre: 'Física', descripcion: 'Física básica', competencias: ['C1'] };
      expect(validarCreacionCurso(cursoValido, bdCursos))
        .toBe("El nuevo curso está registrado en la base de datos y está disponible en el sistema");
    });
  });
});
