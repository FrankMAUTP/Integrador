require('dotenv').config();

const { app }              = require('./src/app');
const { getPool, DB_CONFIG } = require('./db/mysql');

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  (async () => {
    try {
      const conn = await getPool().getConnection();
      await conn.ping();
      conn.release();
      console.log(`Conectado a MySQL: ${DB_CONFIG.host}/${DB_CONFIG.database}`);
      app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
    } catch (err) {
      console.error('\n ERROR al conectar con MySQL:', err.message);
      console.error(` Host: ${DB_CONFIG.host}  DB: ${DB_CONFIG.database}  User: ${DB_CONFIG.user}\n`);
      process.exit(1);
    }
  })();
}

module.exports = { app };
