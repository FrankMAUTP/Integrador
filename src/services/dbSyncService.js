const { getPool, buildDbJson, saveDbJson } = require('../../db/mysql');

async function readDb(userId) {
  const conn = await getPool().getConnection();
  try {
    return await buildDbJson(conn, userId);
  } finally {
    conn.release();
  }
}

async function writeDb(data, userId) {
  const conn = await getPool().getConnection();
  try {
    await saveDbJson(conn, data, userId);
  } finally {
    conn.release();
  }
}

module.exports = { readDb, writeDb };
