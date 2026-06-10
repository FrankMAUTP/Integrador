const { getPool } = require('../../db/mysql');

async function requireAdmin(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  try {
    const conn = await getPool().getConnection();
    try {
      const [rows] = await conn.query('SELECT rol FROM usuarios WHERE id = ?', [userId]);
      if (!rows.length || rows[0].rol !== 'admin')
        return res.status(403).json({ error: 'Acceso denegado' });
      next();
    } finally { conn.release(); }
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
}

module.exports = { requireAdmin };
