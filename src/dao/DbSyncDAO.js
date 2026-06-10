// =====================================================
// DbSyncDAO — Lee y escribe el JSON completo de la BD.
// Recibe un conn ya abierto; no gestiona conexiones.
// =====================================================

async function buildDbJson(conn, userId) {
  const [salones] = await conn.query('SELECT * FROM salones');
  const salonPorId = {};
  for (const s of salones) salonPorId[s.id] = s;

  const [cursos] = userId
    ? await conn.query('SELECT * FROM cursos WHERE id_usuario = ?', [userId])
    : [[]];

  const cursoIds = cursos.map(c => c.id);

  const [competencias] = cursoIds.length
    ? await conn.query(
        'SELECT * FROM competencias_curso WHERE id_curso IN (?) ORDER BY id_curso, bimestre, posicion',
        [cursoIds]
      )
    : [[]];

  const compPorCurso = {};
  for (const r of competencias) {
    if (!compPorCurso[r.id_curso]) compPorCurso[r.id_curso] = {};
    if (!compPorCurso[r.id_curso][r.bimestre]) compPorCurso[r.id_curso][r.bimestre] = [];
    compPorCurso[r.id_curso][r.bimestre].push(r.texto);
  }

  const cursosOut = cursos.map(c => ({
    id: c.id, name: c.nombre, color: c.color,
    userId: c.id_usuario || null,
    competencias: compPorCurso[c.id] || {},
    createdAt: c.creado_en,
  }));

  const [secciones] = cursoIds.length
    ? await conn.query('SELECT * FROM secciones WHERE id_curso IN (?)', [cursoIds])
    : [[]];

  const secIds = secciones.map(s => s.id);

  const [horarios] = secIds.length
    ? await conn.query(
        'SELECT * FROM horario_secciones WHERE id_seccion IN (?) ORDER BY id_seccion, posicion',
        [secIds]
      )
    : [[]];

  const horarioPorSeccion = {};
  for (const r of horarios) {
    if (!horarioPorSeccion[r.id_seccion]) horarioPorSeccion[r.id_seccion] = [];
    horarioPorSeccion[r.id_seccion].push(r);
  }

  const seccionesOut = {};
  for (const sec of secciones) {
    const salon = salonPorId[sec.id_salon] || {};
    if (!seccionesOut[sec.id_curso]) seccionesOut[sec.id_curso] = [];
    const filas = horarioPorSeccion[sec.id] || [];
    let secComps;
    if (sec.competencias) {
      try { secComps = JSON.parse(sec.competencias); } catch { secComps = null; }
    }
    if (!secComps) secComps = compPorCurso[sec.id_curso] || {};
    seccionesOut[sec.id_curso].push({
      id: sec.id,
      grade: salon.grado,
      letter: salon.letra,
      createdAt: sec.creado_en,
      schedule: {
        days:  filas.map(r => r.dia),
        times: Object.fromEntries(filas.map(r => [r.dia, { start: r.hora_inicio, end: r.hora_fin }])),
      },
      competencias: secComps,
    });
  }

  const salonIdsUsados = [...new Set(secciones.map(s => s.id_salon))];
  const [alumnos] = salonIdsUsados.length
    ? await conn.query('SELECT * FROM alumnos WHERE id_salon IN (?) AND id_usuario = ?', [salonIdsUsados, userId])
    : [[]];

  const alumnosOut = {};
  for (const a of alumnos) {
    const salon = salonPorId[a.id_salon] || {};
    const clave = `${salon.grado}_${salon.letra}`;
    if (!alumnosOut[clave]) alumnosOut[clave] = [];
    const alu = { id: a.id, name: a.nombre };
    if (a.observacion) alu.observation = a.observacion;
    if (a.retirado)    alu.retired = true;
    alumnosOut[clave].push(alu);
  }

  const [actividades] = secIds.length
    ? await conn.query(`
        SELECT a.id, a.id_seccion, a.nombre, a.bimestre, a.tipo, a.fecha_entrega, a.peso,
               s.id_curso,
               cc.posicion AS competencia_idx
        FROM actividades a
        JOIN secciones s ON a.id_seccion = s.id
        LEFT JOIN competencias_curso cc ON a.id_competencia = cc.id
        WHERE a.id_seccion IN (?)
      `, [secIds])
    : [[]];

  const actividadesOut = {};
  for (const a of actividades) {
    const clave = `${a.id_curso}_${a.id_seccion}`;
    if (!actividadesOut[clave]) actividadesOut[clave] = [];
    actividadesOut[clave].push({
      id: a.id, name: a.nombre, bimestre: a.bimestre,
      competenciaIdx: a.competencia_idx ?? 0,
      type: a.tipo, dueDate: a.fecha_entrega, weight: a.peso || '',
    });
  }

  const [notas] = secIds.length
    ? await conn.query(`
        SELECT n.id_alumno, n.id_actividad, n.nota,
               a.id_seccion, s.id_curso
        FROM notas n
        JOIN actividades a ON n.id_actividad = a.id
        JOIN secciones   s ON a.id_seccion   = s.id
        WHERE a.id_seccion IN (?)
      `, [secIds])
    : [[]];

  const notasOut = {};
  for (const n of notas) {
    const clave = `${n.id_curso}_${n.id_seccion}`;
    if (!notasOut[clave]) notasOut[clave] = {};
    if (!notasOut[clave][n.id_alumno]) notasOut[clave][n.id_alumno] = {};
    notasOut[clave][n.id_alumno][n.id_actividad] = n.nota;
  }

  const [usuarios] = await conn.query(
    'SELECT id, usuario, nombre_display, correo, rol, activo, creado_en, foto FROM usuarios'
  );
  const usuariosOut = usuarios.map(u => {
    if (!userId) return { id: u.id, email: u.correo, username: u.usuario };
    const obj = {
      id: u.id,
      username: u.usuario,
      displayName: u.nombre_display || u.usuario,
      email: u.correo,
      rol: u.rol || 'docente',
      activo: u.activo !== undefined ? !!u.activo : true,
      createdAt: u.creado_en,
    };
    if (u.foto) obj.photo = u.foto;
    return obj;
  });

  const [[refDias], [refFranjas]] = await Promise.all([
    conn.query('SELECT dia FROM referencia_dias ORDER BY posicion'),
    conn.query('SELECT franja FROM referencia_franjas ORDER BY posicion'),
  ]);

  return {
    courses:    cursosOut,
    sections:   seccionesOut,
    students:   alumnosOut,
    activities: actividadesOut,
    grades:     notasOut,
    users:      usuariosOut,
    scheduleReference: {
      days:      refDias.map(r => r.dia),
      timeSlots: refFranjas.map(r => r.franja),
    },
  };
}

async function saveDbJson(conn, data, userId) {
  const idsCursos = (data.courses || []).map(c => c.id);

  const parsearClave = (clave) => {
    for (const id of idsCursos) {
      if (clave.startsWith(id + '_')) return [id, clave.slice(id.length + 1)];
    }
    return [null, null];
  };

  await conn.beginTransaction();
  try {
    const [existingCursos] = await conn.query('SELECT id FROM cursos WHERE id_usuario = ?', [userId]);
    if (existingCursos.length) {
      const cursoIds = existingCursos.map(c => c.id);

      const [existingSecs] = await conn.query('SELECT id FROM secciones WHERE id_curso IN (?)', [cursoIds]);
      if (existingSecs.length) {
        const secIds = existingSecs.map(s => s.id);

        const [existingActs] = await conn.query('SELECT id FROM actividades WHERE id_seccion IN (?)', [secIds]);
        if (existingActs.length) {
          const actIds = existingActs.map(a => a.id);
          await conn.query('DELETE FROM notas        WHERE id_actividad IN (?)', [actIds]);
          await conn.query('DELETE FROM actividades  WHERE id           IN (?)', [actIds]);
        }
        await conn.query('DELETE FROM horario_secciones WHERE id_seccion IN (?)', [secIds]);
        await conn.query('DELETE FROM secciones          WHERE id         IN (?)', [secIds]);
      }
      await conn.query('DELETE FROM competencias_curso WHERE id_curso IN (?)', [cursoIds]);
      await conn.query('DELETE FROM cursos             WHERE id        IN (?)', [cursoIds]);
    }

    const salonesInsertados = new Set();
    for (const secs of Object.values(data.sections || {}))
      for (const sec of secs) {
        if (!sec.grade || !sec.letter) continue;
        const clave = `${sec.grade}_${sec.letter}`;
        if (salonesInsertados.has(clave)) continue;
        salonesInsertados.add(clave);
        await conn.query(
          'INSERT IGNORE INTO salones (grado, letra) VALUES (?, ?)',
          [sec.grade, sec.letter]
        );
      }
    for (const clave of Object.keys(data.students || {})) {
      if (salonesInsertados.has(clave)) continue;
      const us = clave.indexOf('_');
      if (us !== -1) {
        salonesInsertados.add(clave);
        await conn.query(
          'INSERT IGNORE INTO salones (grado, letra) VALUES (?, ?)',
          [clave.slice(0, us), clave.slice(us + 1)]
        );
      }
    }

    const [filasSalones] = await conn.query('SELECT id, grado, letra FROM salones');
    const mapaSalones = {};
    for (const s of filasSalones) mapaSalones[`${s.grado}_${s.letra}`] = s.id;

    const usuarioFrontend = (data.users || []).find(u => u.id === userId);
    if (usuarioFrontend) {
      await conn.query(
        'UPDATE usuarios SET nombre_display = ?, correo = ?, foto = ? WHERE id = ?',
        [
          usuarioFrontend.displayName || null,
          usuarioFrontend.email || null,
          usuarioFrontend.photo || null,
          userId,
        ]
      );
    }

    const mapaCompIdx = {};

    for (const c of (data.courses || [])) {
      await conn.query(
        'INSERT INTO cursos (id, nombre, color, id_usuario, creado_en) VALUES (?, ?, ?, ?, ?)',
        [c.id, c.name, c.color || null, userId, c.createdAt || null]
      );
      for (const [bim, comps] of Object.entries(c.competencias || {})) {
        for (let i = 0; i < comps.length; i++) {
          const [res] = await conn.query(
            'INSERT INTO competencias_curso (id_curso, bimestre, posicion, texto) VALUES (?, ?, ?, ?)',
            [c.id, parseInt(bim), i, comps[i]]
          );
          mapaCompIdx[`${c.id}_${bim}_${i}`] = res.insertId;
        }
      }
    }

    for (const [idCurso, secs] of Object.entries(data.sections || {})) {
      for (const sec of secs) {
        if (!sec.grade || !sec.letter) continue;
        let idSalon = mapaSalones[`${sec.grade}_${sec.letter}`];
        if (!idSalon) {
          await conn.query(
            'INSERT IGNORE INTO salones (grado, letra) VALUES (?, ?)',
            [sec.grade, sec.letter]
          );
          const [rows] = await conn.query('SELECT id FROM salones WHERE grado = ? AND letra = ?', [sec.grade, sec.letter]);
          if (!rows.length) continue;
          idSalon = rows[0].id;
          mapaSalones[`${sec.grade}_${sec.letter}`] = idSalon;
        }
        const compJson = sec.competencias ? JSON.stringify(sec.competencias) : null;
        await conn.query(
          'INSERT INTO secciones (id, id_curso, id_salon, creado_en, competencias) VALUES (?, ?, ?, ?, ?)',
          [sec.id, idCurso, idSalon, sec.createdAt || null, compJson]
        );
        const dias = sec.schedule?.days || [];
        for (let i = 0; i < dias.length; i++) {
          const dia = dias[i];
          const t = sec.schedule?.times?.[dia] || {};
          await conn.query(
            'INSERT INTO horario_secciones (id_seccion, dia, hora_inicio, hora_fin, posicion) VALUES (?, ?, ?, ?, ?)',
            [sec.id, dia, t.start || null, t.end || null, i]
          );
        }
      }
    }

    for (const [clave, alums] of Object.entries(data.students || {})) {
      const idSalon = mapaSalones[clave];
      if (!idSalon) continue;
      for (const a of alums) {
        await conn.query(
          `INSERT INTO alumnos (id, id_salon, id_usuario, nombre, observacion, retirado)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             nombre      = VALUES(nombre),
             observacion = VALUES(observacion),
             retirado    = VALUES(retirado)`,
          [a.id, idSalon, userId, a.name, a.observation || null, a.retired ? 1 : 0]
        );
      }
    }

    const salonIdsNuevos = [
      ...new Set(
        Object.values(data.sections || {}).flat()
          .map(sec => mapaSalones[`${sec.grade}_${sec.letter}`])
          .filter(id => id != null)
      )
    ];
    if (salonIdsNuevos.length > 0) {
      await conn.query(
        'DELETE FROM alumnos WHERE id_usuario = ? AND id_salon NOT IN (?)',
        [userId, salonIdsNuevos]
      );
    } else {
      await conn.query('DELETE FROM alumnos WHERE id_usuario = ?', [userId]);
    }

    await conn.query(`
      DELETE sa FROM salones sa
      LEFT JOIN secciones s ON sa.id = s.id_salon
      WHERE s.id IS NULL
    `);

    for (const [clave, acts] of Object.entries(data.activities || {})) {
      const [idCurso, idSeccion] = parsearClave(clave);
      if (!idCurso) continue;
      for (const a of acts) {
        const idComp = mapaCompIdx[`${idCurso}_${a.bimestre}_${a.competenciaIdx}`] ?? null;
        await conn.query(
          'INSERT INTO actividades (id, id_seccion, nombre, bimestre, id_competencia, tipo, fecha_entrega, peso) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [a.id, idSeccion, a.name, a.bimestre, idComp, a.type, a.dueDate, a.weight || '']
        );
      }
    }

    for (const notasAlumnos of Object.values(data.grades || {})) {
      for (const [idAlumno, notasActs] of Object.entries(notasAlumnos)) {
        for (const [idActividad, nota] of Object.entries(notasActs)) {
          await conn.query(
            'INSERT INTO notas (id_alumno, id_actividad, nota) VALUES (?, ?, ?)',
            [idAlumno, idActividad, nota]
          );
        }
      }
    }

    const ref = data.scheduleReference || {};
    for (let i = 0; i < (ref.days || []).length; i++)
      await conn.query('INSERT IGNORE INTO referencia_dias (dia, posicion) VALUES (?, ?)', [ref.days[i], i]);
    for (let i = 0; i < (ref.timeSlots || []).length; i++)
      await conn.query('INSERT IGNORE INTO referencia_franjas (franja, posicion) VALUES (?, ?)', [ref.timeSlots[i], i]);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  }
}

module.exports = { buildDbJson, saveDbJson };
