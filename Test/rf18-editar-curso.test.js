'use strict';

/**
 * ============================================================
 *  Requerimiento 18 — Editar Curso
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Nombre de curso existente
 *    E2 – Campos incompletos
 *    E3 – Sin competencias
 *    E4 – Flujo exitoso - Edición de curso
 */

// ================================================================
// FUNCIONES AUXILIARES SIMULANDO LA LÓGICA FRONTEND
// ================================================================

function validarEdicionCurso(cursoAEditar, camposNuevos, bdCursos) {
  if (!camposNuevos.nombre || !camposNuevos.descripcion) {
    return "El sistema muestra un mensaje de error y pide al docente que complete la información que falta";
  }

  // Verifica si otro curso ya tiene ese nombre
  const existeDuplicado = bdCursos.find(c => c.id !== cursoAEditar.id && c.nombre.toLowerCase() === camposNuevos.nombre.toLowerCase());
  if (existeDuplicado) {
    return "El sistema muestra un error y no permite el cambio";
  }

  if (!camposNuevos.competencias || camposNuevos.competencias.length === 0) {
    return "La validación falla y no se guardan los cambios";
  }

  return "La nueva información del curso sobrescribe la original en la base de datos";
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 18 — Editar Curso', () => {
  const bdCursos = [
    { id: 1, nombre: 'Matemática' },
    { id: 2, nombre: 'Comunicación' }
  ];
  
  const cursoAEditar = bdCursos[1]; // Editaremos Comunicación

  describe('E1 — Nombre de curso existente', () => {
    test('si cambia el nombre a uno ya existente, muestra error y no permite el cambio', () => {
      const camposNuevos = { nombre: 'Matemática', descripcion: 'Nueva desc', competencias: ['C1'] };
      expect(validarEdicionCurso(cursoAEditar, camposNuevos, bdCursos))
        .toBe("El sistema muestra un error y no permite el cambio");
    });
  });

  describe('E2 — Campos incompletos', () => {
    test('si falta algún campo, muestra mensaje de error y pide completarlo', () => {
      const camposNuevos = { nombre: '', descripcion: 'Nueva desc', competencias: ['C1'] };
      expect(validarEdicionCurso(cursoAEditar, camposNuevos, bdCursos))
        .toBe("El sistema muestra un mensaje de error y pide al docente que complete la información que falta");
    });
  });

  describe('E3 — Sin competencias', () => {
    test('si el curso no sigue teniendo al menos 1 competencia, la validación falla', () => {
      const camposNuevos = { nombre: 'Comu Avanzada', descripcion: 'Nueva desc', competencias: [] };
      expect(validarEdicionCurso(cursoAEditar, camposNuevos, bdCursos))
        .toBe("La validación falla y no se guardan los cambios");
    });
  });

  describe('E4 — Flujo exitoso', () => {
    test('la nueva información del curso sobrescribe la original exitosamente', () => {
      const camposNuevos = { nombre: 'Comu Avanzada', descripcion: 'Nueva desc', competencias: ['C1'] };
      expect(validarEdicionCurso(cursoAEditar, camposNuevos, bdCursos))
        .toBe("La nueva información del curso sobrescribe la original en la base de datos");
    });
  });
});
