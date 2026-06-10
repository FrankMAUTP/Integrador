const bcrypt = require('bcrypt');
const { getPool } = require('../../db/mysql');
const UsuarioDAO = require('../dao/UsuarioDAO');

const SALT_ROUNDS  = 12;
const MAX_INTENTOS = 5;
const BLOQUEO_MS   = 15 * 60 * 1000;

function createError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function login(username, password) {
  const conn = await getPool().getConnection();
  try {
    const user = await UsuarioDAO.findByUsername(conn, username);
    if (!user) throw createError('Usuario o contraseña incorrectos', 401);

    if (user.rol !== 'admin') {
      if (!user.activo) throw createError('Tu cuenta está desactivada. Contacta al administrador.', 403);
      const now = Date.now();
      if (user.bloqueado_hasta && user.bloqueado_hasta > now) {
        const mins = Math.ceil((user.bloqueado_hasta - now) / 60000);
        throw createError(`Cuenta bloqueada por intentos fallidos. Intenta en ${mins} min.`, 403);
      }
    }

    let match;
    if (user.contrasena && user.contrasena.startsWith('$2b$')) {
      match = await bcrypt.compare(password, user.contrasena);
    } else {
      match = user.contrasena === password;
      if (match) {
        const hashed = await bcrypt.hash(password, SALT_ROUNDS);
        await UsuarioDAO.updatePassword(conn, user.id, hashed);
      }
    }

    if (!match) {
      if (user.rol !== 'admin') {
        const nuevos = (user.intentos_fallidos || 0) + 1;
        if (nuevos >= MAX_INTENTOS) {
          const bloqueadoHasta = Date.now() + BLOQUEO_MS;
          await UsuarioDAO.updateLoginAttempts(conn, user.id, nuevos, bloqueadoHasta);
          throw createError('Demasiados intentos. Cuenta bloqueada por 15 minutos.', 401);
        }
        await UsuarioDAO.incrementFailedAttempts(conn, user.id, nuevos);
      }
      throw createError('Usuario o contraseña incorrectos', 401);
    }

    if (user.rol !== 'admin') {
      await UsuarioDAO.resetLoginAttempts(conn, user.id);
    }

    return {
      id: user.id,
      username: user.usuario,
      displayName: user.nombre_display || user.usuario,
      email: user.correo,
      rol: user.rol,
    };
  } finally {
    conn.release();
  }
}

async function register(username, email, password) {
  const conn = await getPool().getConnection();
  try {
    if (await UsuarioDAO.checkUsernameExists(conn, username))
      throw createError('Ese nombre de usuario ya está en uso', 400);
    if (await UsuarioDAO.checkEmailExists(conn, email))
      throw createError('Ese correo ya está registrado', 400);

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await UsuarioDAO.create(conn, { id, username, email, hashedPassword: hashed });
    return { id, username, displayName: username, email, rol: 'docente' };
  } finally {
    conn.release();
  }
}

async function changePassword(userId, currentPassword, newPassword) {
  const conn = await getPool().getConnection();
  try {
    const row = await UsuarioDAO.findPasswordById(conn, userId);
    if (!row) throw createError('Usuario no encontrado', 404);

    const stored = row.contrasena;
    const match = stored.startsWith('$2b$')
      ? await bcrypt.compare(currentPassword, stored)
      : stored === currentPassword;
    if (!match) throw createError('La contraseña actual es incorrecta', 401);

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await UsuarioDAO.updatePassword(conn, userId, hashed);
  } finally {
    conn.release();
  }
}

async function resetPassword(userId, newPassword) {
  const conn = await getPool().getConnection();
  try {
    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const found = await UsuarioDAO.updatePasswordCheckAffected(conn, userId, hashed);
    if (!found) throw createError('Usuario no encontrado', 404);
  } finally {
    conn.release();
  }
}

async function deleteAccount(userId, password) {
  const conn = await getPool().getConnection();
  try {
    const user = await UsuarioDAO.findById(conn, userId);
    if (!user) throw createError('Usuario no encontrado', 404);
    if (user.rol === 'admin') throw createError('No se puede eliminar la cuenta de administrador', 400);

    const stored = user.contrasena;
    const match = stored.startsWith('$2b$')
      ? await bcrypt.compare(password, stored)
      : stored === password;
    if (!match) throw createError('Contraseña incorrecta', 401);

    await conn.query('DELETE FROM cursos WHERE id_usuario = ?', [userId]);
    await UsuarioDAO.delete(conn, userId);
  } finally {
    conn.release();
  }
}

module.exports = { login, register, changePassword, resetPassword, deleteAccount };
