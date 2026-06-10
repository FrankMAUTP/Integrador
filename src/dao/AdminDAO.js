const AdminDAO = {
  async getGlobalStats(conn) {
    const [[stats]] = await conn.query(`
      SELECT
        (SELECT COUNT(*) FROM usuarios WHERE rol = 'docente') AS total_cuentas,
        (SELECT COUNT(*) FROM cursos)                         AS total_cursos,
        (SELECT COUNT(*) FROM secciones)                      AS total_secciones,
        (SELECT COUNT(*) FROM alumnos WHERE retirado = 0)     AS total_alumnos
    `);
    return stats;
  },

  async getPerUserStats(conn) {
    const [rows] = await conn.query(`
      SELECT
        u.id, u.usuario, u.nombre_display, u.correo, u.activo, u.creado_en,
        COUNT(DISTINCT c.id)  AS total_cursos,
        COUNT(DISTINCT s.id)  AS total_secciones,
        COUNT(DISTINCT al.id) AS total_alumnos
      FROM usuarios u
      LEFT JOIN cursos    c  ON c.id_usuario = u.id
      LEFT JOIN secciones s  ON s.id_curso   = c.id
      LEFT JOIN alumnos   al ON al.id_salon   = s.id_salon AND al.retirado = 0
      WHERE u.rol = 'docente'
      GROUP BY u.id, u.usuario, u.nombre_display, u.correo, u.activo, u.creado_en
      ORDER BY u.creado_en ASC
    `);
    return rows;
  },

  async getAccounts(conn) {
    const [rows] = await conn.query(`
      SELECT id, usuario, nombre_display, correo, activo, creado_en
      FROM usuarios WHERE rol = 'docente'
      ORDER BY creado_en ASC
    `);
    return rows;
  },

  async getUserRole(conn, id) {
    const [rows] = await conn.query('SELECT rol FROM usuarios WHERE id = ?', [id]);
    return rows[0]?.rol || null;
  },
};

module.exports = AdminDAO;
