const RUTAS_BLOQUEADAS   = ['/node_modules', '/db/', '/utils/', '/src/', '/data/'];
const ARCHIVOS_BLOQUEADOS = new Set([
  '/server.js', '/schema.sql',
  '/package.json', '/package-lock.json',
  '/.env', '/.env.example',
]);

function blockServerFiles(req, res, next) {
  const p = req.path;
  if (ARCHIVOS_BLOQUEADOS.has(p) || RUTAS_BLOQUEADAS.some(r => p.startsWith(r)))
    return res.status(404).end();
  next();
}

module.exports = { blockServerFiles };
