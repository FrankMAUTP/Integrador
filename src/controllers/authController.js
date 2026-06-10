const authService = require('../services/authService');

async function login(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Campos incompletos' });
  try {
    const user = await authService.login(username, password);
    res.json(user);
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Error del servidor' });
  }
}

async function register(req, res) {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) return res.status(400).json({ error: 'Campos incompletos' });
  try {
    const user = await authService.register(username, email, password);
    res.json(user);
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Error del servidor' });
  }
}

async function changePassword(req, res) {
  const { userId, currentPassword, newPassword } = req.body || {};
  if (!userId || !currentPassword || !newPassword) return res.status(400).json({ error: 'Campos incompletos' });
  try {
    await authService.changePassword(userId, currentPassword, newPassword);
    res.json({ ok: true });
  } catch (err) {
    console.error('Change-password error:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Error del servidor' });
  }
}

async function resetPassword(req, res) {
  const { userId, newPassword } = req.body || {};
  if (!userId || !newPassword) return res.status(400).json({ error: 'Campos incompletos' });
  try {
    await authService.resetPassword(userId, newPassword);
    res.json({ ok: true });
  } catch (err) {
    console.error('Reset-password error:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Error del servidor' });
  }
}

async function deleteAccount(req, res) {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Se requiere la contraseña para confirmar' });
  try {
    await authService.deleteAccount(userId, password);
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete account error:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Error del servidor' });
  }
}

module.exports = { login, register, changePassword, resetPassword, deleteAccount };
