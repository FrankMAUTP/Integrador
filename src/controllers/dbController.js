const dbSyncService = require('../services/dbSyncService');

async function getDb(req, res) {
  const userId = req.headers['x-user-id'] || null;
  try {
    const data = await dbSyncService.readDb(userId);
    res.json(data);
  } catch (err) {
    console.error('Error leyendo MySQL:', err.message);
    res.status(500).json({ error: 'Error al leer la base de datos' });
  }
}

async function putDb(req, res) {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return res.status(400).json({ error: 'Cuerpo de solicitud inválido' });
  try {
    await dbSyncService.writeDb(body, userId);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error guardando en MySQL:', err.message);
    res.status(500).json({ error: 'No se pudo guardar la base de datos' });
  }
}

module.exports = { getDb, putDb };
