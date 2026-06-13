const { getPool } = require('../../db/mysql');
const UsuarioDAO = require('../dao/UsuarioDAO');
const AdminDAO   = require('../dao/AdminDAO');

const MAX_INTENTOS = 5;

function createError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function getStats() {
  const conn = await getPool().getConnection();
  try {
    const global  = await AdminDAO.getGlobalStats(conn);
    const perUser = await AdminDAO.getPerUserStats(conn);
    return { global, perUser };
  } finally {
    conn.release();
  }
}

async function getAccounts() {
  const conn = await getPool().getConnection();
  try {
    const rows = await AdminDAO.getAccounts(conn);
    return rows.map(u => ({
      id: u.id,
      username: u.usuario,
      displayName: u.nombre_display || u.usuario,
      email: u.correo,
      activo: !!u.activo,
      createdAt: u.creado_en,
    }));
  } finally {
    conn.release();
  }
}

async function updateAccountStatus(id, active) {
  const conn = await getPool().getConnection();
  try {
    const role = await AdminDAO.getUserRole(conn, id);
    if (role === null)     throw createError('Usuario no encontrado', 404);
    if (role === 'admin')  throw createError('No se puede modificar la cuenta admin', 400);
    await UsuarioDAO.updateStatus(conn, id, active);
  } finally {
    conn.release();
  }
}

async function deleteAccount(id) {
  const conn = await getPool().getConnection();
  try {
    const role = await AdminDAO.getUserRole(conn, id);
    if (role === null)    throw createError('Usuario no encontrado', 404);
    if (role === 'admin') throw createError('No se puede eliminar la cuenta admin', 400);
    await conn.query('DELETE FROM alumnos WHERE id_usuario = ?', [id]);
    await conn.query('DELETE FROM cursos   WHERE id_usuario = ?', [id]);
    await UsuarioDAO.delete(conn, id);
  } finally {
    conn.release();
  }
}

async function getBlockedAccounts() {
  const conn = await getPool().getConnection();
  try {
    const rows = await UsuarioDAO.findBlocked(conn, MAX_INTENTOS);
    return rows.map(u => ({
      id: u.id,
      username: u.usuario,
      displayName: u.nombre_display || u.usuario,
      email: u.correo,
      intentos: u.intentos_fallidos,
      bloqueadoHasta: u.bloqueado_hasta,
    }));
  } finally {
    conn.release();
  }
}

async function unblockAccount(id) {
  const conn = await getPool().getConnection();
  try {
    await UsuarioDAO.unblock(conn, id);
  } finally {
    conn.release();
  }
}

module.exports = { getStats, getAccounts, updateAccountStatus, deleteAccount, getBlockedAccounts, unblockAccount };
