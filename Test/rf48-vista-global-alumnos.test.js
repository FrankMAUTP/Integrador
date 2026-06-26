'use strict';

/**
 * ============================================================
 *  Requerimiento 48 — Vista global de Alumnos
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Curso ausente
 *    E2 – Sección ausente
 *    E3 – Lista alumnos vacía
 *    E4 – Flujo exitoso - Mostrar vista global de todos los alumnos
 */

function obtenerVistaGlobal(totalCursos, totalSecciones, totalAlumnos) {
  if (totalCursos === 0) {
    return "No tener registrado cursos no permite la creación de secciones";
  }
  if (totalSecciones === 0) {
    return "Sin ninguna sección creada no es posible almacenar alumnos";
  }
  if (totalAlumnos === 0) {
    return "tabla de la vista global de alumnos vacía sin nombre, grado, sección y estado asociados";
  }

  return "Vista global de alumnos cargada con filtros funcionales y lista visible";
}

describe('Requerimiento 48 — Vista global de Alumnos', () => {
  describe('E1 — Curso ausente', () => {
    test('si no tiene registrado cursos, no permite la creación de secciones', () => {
      expect(obtenerVistaGlobal(0, 0, 0)).toBe("No tener registrado cursos no permite la creación de secciones");
    });
  });

  describe('E2 — Sección ausente', () => {
    test('sin ninguna sección creada no es posible almacenar alumnos', () => {
      expect(obtenerVistaGlobal(1, 0, 0)).toBe("Sin ninguna sección creada no es posible almacenar alumnos");
    });
  });

  describe('E3 — Lista alumnos vacía', () => {
    test('al no haber importado alumnos a una sección, mostrará la tabla de la vista global vacía', () => {
      expect(obtenerVistaGlobal(1, 1, 0)).toBe("tabla de la vista global de alumnos vacía sin nombre, grado, sección y estado asociados");
    });
  });

  describe('E4 — Flujo exitoso', () => {
    test('la vista global de alumnos se carga correctamente con filtros y lista visible', () => {
      expect(obtenerVistaGlobal(1, 1, 25)).toBe("Vista global de alumnos cargada con filtros funcionales y lista visible");
    });
  });
});
