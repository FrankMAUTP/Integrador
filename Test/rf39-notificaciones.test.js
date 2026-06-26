'use strict';

/**
 * ============================================================
 *  Requerimiento 39 — Permitir notificaciones de actividades
 *  Patrón: Arrange · Act · Assert
 * ============================================================
 *
 *  Escenarios cubiertos:
 *    E1 – Flujo exitoso - Gestión de alertas académicas
 */

// ================================================================
// FUNCIONES AUXILIARES SIMULANDO LA LÓGICA FRONTEND
// ================================================================

function gestionarAlertasAcademicas(actividadesRegistradas, fechaActual) {
  // Filtramos las actividades que vencen pronto (por ejemplo, en los próximos 3 días)
  const MS_POR_DIA = 24 * 60 * 60 * 1000;
  const limiteDias = 3;

  const notificaciones = actividadesRegistradas.filter(actividad => {
    const diferenciaMs = actividad.fechaLimite.getTime() - fechaActual.getTime();
    const diferenciaDias = diferenciaMs / MS_POR_DIA;
    
    // Es una actividad próxima si vence en menos de 3 días y la fecha no ha pasado
    return diferenciaDias >= 0 && diferenciaDias <= limiteDias;
  });

  if (notificaciones.length > 0) {
    return {
      estado: 'mostrando',
      mensaje: "Recordatorios de actividades próximas generados",
      notificacionesGeneradas: notificaciones.length
    };
  }

  return {
    estado: 'oculto',
    mensaje: "No hay actividades próximas",
    notificacionesGeneradas: 0
  };
}

// ================================================================
// SUITE DE PRUEBAS
// ================================================================

describe('Requerimiento 39 — Permitir notificaciones de actividades', () => {
  describe('E1 — Flujo exitoso', () => {
    test('el sistema verifica las fechas límite y muestra recordatorios de actividades próximas', () => {
      // Configuramos la fecha actual simulada
      const fechaActual = new Date('2026-06-25T00:00:00Z');
      
      // Creamos una actividad que vence mañana y otra que vence el próximo mes
      const actividadesBD = [
        { id: 1, nombre: 'Práctica 1', fechaLimite: new Date('2026-06-26T23:59:59Z') }, 
        { id: 2, nombre: 'Examen Parcial', fechaLimite: new Date('2026-07-15T00:00:00Z') }
      ];
      
      const resultado = gestionarAlertasAcademicas(actividadesBD, fechaActual);
      
      // Debe encontrar 1 notificación (la que vence mañana)
      expect(resultado.estado).toBe('mostrando');
      expect(resultado.notificacionesGeneradas).toBe(1);
      expect(resultado.mensaje).toBe('Recordatorios de actividades próximas generados');
    });
  });
});
