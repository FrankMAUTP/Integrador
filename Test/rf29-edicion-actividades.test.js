'use strict';

/**
 * ============================================================
 *  Requerimiento 29 — Edición de actividades calificadas
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Nombre vacío
 *    E2 – Nombre con caracteres no permitidos
 *    E3 – Nombre duplicado
 *    E4 – Sin fecha de vencimiento
 *    E5 – Eliminar actividad con notas asignadas
 *    E6 – Flujo exitoso - Edición de actividad calificada
 */

// ================================================================
// FUNCIONES AUXILIARES SIMULANDO LA LÓGICA FRONTEND
// ================================================================

function validarEdicionActividad(nombre, fechaVencimiento, actividadesExistentes, idEditando) {
  if (!nombre || nombre.trim() === '') {
    return "Ingresa el nombre de la actividad";
  }
  // Permitimos letras y espacios
  if (/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ ]/.test(nombre)) {
    return "El nombre de la actividad no puede contener caracteres especiales";
  }
  
  const duplicado = actividadesExistentes.find(
    a => a.id !== idEditando && a.name.toLowerCase() === nombre.toLowerCase()
  );
  
  if (duplicado) {
    return "Ya existe una actividad con ese nombre";
  }

  if (!fechaVencimiento) {
    return "Selecciona la fecha de vencimiento";
  }

  return "Actividad actualizada";
}

function advertenciaEliminarActividad(actividadId, registroNotas) {
  // Simulamos que revisa si hay notas en la base de datos para esta actividad
  const tieneNotas = registroNotas.some(n => n.actividadId === actividadId);
  if (tieneNotas) {
    return "Advertencia: Se perderán las notas asociadas";
  }
  return "Confirmación: Actividad eliminada sin problemas";
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 29 — Edición de actividades calificadas', () => {

  const actividadesBD = [
    { id: 'act1', name: 'Práctica Uno', dueDate: '2026-07-01' },
    { id: 'act2', name: 'Exposición', dueDate: '2026-07-15' }
  ];

  // --------------------------------------------------------------
  // E1 — Nombre vacío
  // --------------------------------------------------------------
  describe('E1 — Nombre vacío', () => {
    test('muestra "Ingresa el nombre de la actividad" al intentar guardar sin nombre', () => {
      const nombre = '';
      const fecha = '2026-07-20';
      const idEditando = 'act1';

      const resultado = validarEdicionActividad(nombre, fecha, actividadesBD, idEditando);
      expect(resultado).toBe('Ingresa el nombre de la actividad');
    });
  });

  // --------------------------------------------------------------
  // E2 — Nombre con caracteres no permitidos
  // --------------------------------------------------------------
  describe('E2 — Nombre con caracteres no permitidos', () => {
    test('muestra error si el nombre tiene números o símbolos', () => {
      const nombreNumeros = 'Practica 1';
      const nombreSimbolos = 'Exposición!';
      const fecha = '2026-07-20';
      const idEditando = 'act1';

      expect(validarEdicionActividad(nombreNumeros, fecha, actividadesBD, idEditando))
        .toBe('El nombre de la actividad no puede contener caracteres especiales');
        
      expect(validarEdicionActividad(nombreSimbolos, fecha, actividadesBD, idEditando))
        .toBe('El nombre de la actividad no puede contener caracteres especiales');
    });
  });

  // --------------------------------------------------------------
  // E3 — Nombre duplicado
  // --------------------------------------------------------------
  describe('E3 — Nombre duplicado', () => {
    test('muestra "Ya existe una actividad con ese nombre" si se asigna un nombre en uso por otra actividad', () => {
      const nombre = 'Exposición'; // Ya lo usa 'act2'
      const fecha = '2026-07-20';
      const idEditando = 'act1'; // Estamos editando 'act1' y le ponemos nombre de 'act2'

      const resultado = validarEdicionActividad(nombre, fecha, actividadesBD, idEditando);
      expect(resultado).toBe('Ya existe una actividad con ese nombre');
    });

    test('permite mantener el mismo nombre de la actividad actual sin error de duplicidad', () => {
      const nombre = 'Práctica Uno'; // Mismo nombre que tiene originalmente
      const fecha = '2026-07-20';
      const idEditando = 'act1'; 

      const resultado = validarEdicionActividad(nombre, fecha, actividadesBD, idEditando);
      expect(resultado).not.toBe('Ya existe una actividad con ese nombre');
    });
  });

  // --------------------------------------------------------------
  // E4 — Sin fecha de vencimiento
  // --------------------------------------------------------------
  describe('E4 — Sin fecha de vencimiento', () => {
    test('muestra "Selecciona la fecha de vencimiento" si se deja el campo vacío', () => {
      const nombre = 'Trabajo Final';
      const fecha = ''; // Fecha vacía
      const idEditando = 'act1';

      const resultado = validarEdicionActividad(nombre, fecha, actividadesBD, idEditando);
      expect(resultado).toBe('Selecciona la fecha de vencimiento');
    });
  });

  // --------------------------------------------------------------
  // E5 — Eliminar actividad con notas asignadas
  // --------------------------------------------------------------
  describe('E5 — Eliminar actividad con notas asignadas', () => {
    test('muestra advertencia "se perderán las notas asociadas" si la actividad ya tiene notas calificadas', () => {
      const notasEnBD = [
        { alumnoId: 'alumno1', actividadId: 'act1', nota: 'A' }
      ];
      const resultado = advertenciaEliminarActividad('act1', notasEnBD);
      expect(resultado).toBe('Advertencia: Se perderán las notas asociadas');
    });
  });

  // --------------------------------------------------------------
  // E6 — Flujo exitoso - Edición de actividad calificada
  // --------------------------------------------------------------
  describe('E6 — Flujo exitoso', () => {
    test('guarda los cambios correctamente y muestra "Actividad actualizada" si todos los datos son válidos', () => {
      const nombre = 'Práctica Corregida';
      const fecha = '2026-08-01';
      const idEditando = 'act1';

      const resultado = validarEdicionActividad(nombre, fecha, actividadesBD, idEditando);
      expect(resultado).toBe('Actividad actualizada');
    });
  });

});
