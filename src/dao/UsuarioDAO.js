const UsuarioDAO = {
  async findByUsername(conn, username) {
    const [rows] = await conn.query('SELECT * FROM usuarios WHERE usuario = ?', [username]);
    return rows[0] || null;
  },

  async findById(conn, id) {
    const [rows] = await conn.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findPasswordById(conn, id) {
    const [rows] = await conn.query('SELECT contrasena FROM usuarios WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async checkUsernameExists(conn, username) {
    const [rows] = await conn.query('SELECT id FROM usuarios WHERE usuario = ?', [username]);
    return rows.length > 0;
  },

  async checkEmailExists(conn, email) {
    const [rows] = await conn.query('SELECT id FROM usuarios WHERE correo = ?', [email]);
    return rows.length > 0;
  },

  async create(conn, { id, username, email, hashedPassword }) {
    await conn.query(
      'INSERT INTO usuarios (id, usuario, nombre_display, correo, contrasena, rol, activo, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, username, username, email, hashedPassword, 'docente', 1, Date.now()]
    );
  },

  async updatePassword(conn, id, hashedPassword) {
    await conn.query('UPDATE usuarios SET contrasena = ? WHERE id = ?', [hashedPassword, id]);
  },

  async updatePasswordCheckAffected(conn, id, hashedPassword) {
    const [result] = await conn.query('UPDATE usuarios SET contrasena = ? WHERE id = ?', [hashedPassword, id]);
    return result.affectedRows > 0;
  },

  async updateLoginAttempts(conn, id, attempts, blockedUntil) {
    await conn.query(
      'UPDATE usuarios SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id = ?',
      [attempts, blockedUntil, id]
    );
  },

  async incrementFailedAttempts(conn, id, attempts) {
    await conn.query('UPDATE usuarios SET intentos_fallidos = ? WHERE id = ?', [attempts, id]);
  },

  async resetLoginAttempts(conn, id) {
    await conn.query(
      'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?',
      [id]
    );
  },

  async updateStatus(conn, id, active) {
    await conn.query('UPDATE usuarios SET activo = ? WHERE id = ?', [active ? 1 : 0, id]);
  },

  async unblock(conn, id) {
    await conn.query(
      'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?',
      [id]
    );
  },

  async delete(conn, id) {
    await conn.query('DELETE FROM usuarios WHERE id = ?', [id]);
  },

  async findBlocked(conn, maxAttempts) {
    const now = Date.now();
    const [rows] = await conn.query(
      `SELECT id, usuario, nombre_display, correo, intentos_fallidos, bloqueado_hasta
       FROM usuarios
       WHERE rol = 'docente' AND (bloqueado_hasta > ? OR intentos_fallidos >= ?)
       ORDER BY bloqueado_hasta DESC`,
      [now, maxAttempts]
    );
    return rows;
  },
};

module.exports = UsuarioDAO;
