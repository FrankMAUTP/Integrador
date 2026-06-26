'use strict';

/**
 * ============================================================
 *  Requerimiento 16 — Editar sección
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Campos incompletos
 *    E2 – Sección ya existente
 *    E3 – Cruce de horarios
 *    E4 – Flujo exitoso - Modificar campos de sección
 */

// ================================================================
// FUNCIONES AUXILIARES SIMULANDO LA LÓGICA FRONTEND
// ================================================================

function validarEdicionSeccion(campos, bdSecciones, bdHorarios) {
  if (!campos.grado || !campos.seccion || !campos.diasClase || !campos.horario) {
    return "Campos incompletos";
  }

  // Verifica si otra sección (distinta a la que edita) tiene mismo grado y letra
  const existeDuplicada = bdSecciones.find(s => s.id !== campos.id && s.grado === campos.grado && s.seccion === campos.seccion);
  if (existeDuplicada) {
    return "Sección ya existente";
  }

  const cruceHorario = bdHorarios.find(h => h.seccionId !== campos.id && h.diasClase === campos.diasClase && h.horario === campos.horario);
  if (cruceHorario) {
    return "Cruce de horarios";
  }

  return "Sección actualizada";
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 16 — Editar sección', () => {
  const bdSecciones = [
    { id: 1, grado: '1ro Secundaria', seccion: 'A' },
    { id: 2, grado: '1ro Secundaria', seccion: 'B' }
  ];
  
  const bdHorarios = [
    { seccionId: 1, diasClase: 'Lunes', horario: '8:00am - 10:00am' }
  ];

  describe('E1 — Campos incompletos', () => {
    test('si el docente omite algún campo a rellenar, el sistema muestra un error de campos incompletos', () => {
      const camposIncompletos = { id: 2, grado: '1ro Secundaria', seccion: '' }; // Falta dias y horario
      expect(validarEdicionSeccion(camposIncompletos, bdSecciones, bdHorarios)).toBe("Campos incompletos");
    });
  });

  describe('E2 — Sección ya existente', () => {
    test('si el grado y sección a modificar resultan iguales a los de otra sección, no guarda los cambios', () => {
      // Intenta cambiar la sección 2 (1ro B) a (1ro A), la cual ya existe
      const camposDuplicados = { id: 2, grado: '1ro Secundaria', seccion: 'A', diasClase: 'Martes', horario: '8am' };
      expect(validarEdicionSeccion(camposDuplicados, bdSecciones, bdHorarios)).toBe("Sección ya existente");
    });
  });

  describe('E3 — Cruce de horarios', () => {
    test('si el nuevo horario interfiere con otro ya creado, el sistema impedirá el guardado', () => {
      const camposCruce = { id: 2, grado: '1ro Secundaria', seccion: 'C', diasClase: 'Lunes', horario: '8:00am - 10:00am' };
      expect(validarEdicionSeccion(camposCruce, bdSecciones, bdHorarios)).toBe("Cruce de horarios");
    });
  });

  describe('E4 — Flujo exitoso', () => {
    test('actualiza los datos de la sección y muestra el mensaje de confirmación', () => {
      const camposValidos = { id: 2, grado: '1ro Secundaria', seccion: 'C', diasClase: 'Martes', horario: '10:00am - 12:00pm' };
      expect(validarEdicionSeccion(camposValidos, bdSecciones, bdHorarios)).toBe("Sección actualizada");
    });
  });
});
