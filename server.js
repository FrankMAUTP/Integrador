require('dotenv').config();

const { app }              = require('./src/app');
const { getPool, DB_CONFIG } = require('./db/mysql');
const { transporter }      = require('./utils/mailer');

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  (async () => {
    try {
      const conn = await getPool().getConnection();
      await conn.ping();
      conn.release();
      console.log(`Conectado a MySQL: ${DB_CONFIG.host}/${DB_CONFIG.database}`);
    } catch (err) {
      console.error('\n ERROR al conectar con MySQL:', err.message);
      console.error(` Host: ${DB_CONFIG.host}  DB: ${DB_CONFIG.database}  User: ${DB_CONFIG.user}\n`);
      process.exit(1);
    }

    try {
      await transporter.verify();
      console.log(`SMTP OK: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} (${process.env.SMTP_USER})`);
    } catch (err) {
      console.warn(`SMTP ADVERTENCIA: ${err.message}`);
      console.warn(`  Host: ${process.env.SMTP_HOST}  Puerto: ${process.env.SMTP_PORT}  User: ${process.env.SMTP_USER}`);
    }

    app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
  })();
}

module.exports = { app };
