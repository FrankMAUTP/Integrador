const adminService = require('../services/adminService');

async function getStats(req, res) {
  try {
    const stats = await adminService.getStats();
    res.json(stats);
  } catch (err) {
    console.error('Admin stats error:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Error del servidor' });
  }
}

async function getAccounts(req, res) {
  try {
    const accounts = await adminService.getAccounts();
    res.json(accounts);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error del servidor' });
  }
}

async function updateAccountStatus(req, res) {
  const { activo } = req.body || {};
  if (activo === undefined) return res.status(400).json({ error: 'Campo activo requerido' });
  try {
    await adminService.updateAccountStatus(req.params.id, activo);
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error del servidor' });
  }
}

async function deleteAccount(req, res) {
  try {
    await adminService.deleteAccount(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error del servidor' });
  }
}

async function getBlockedAccounts(req, res) {
  try {
    const blocked = await adminService.getBlockedAccounts();
    res.json(blocked);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error del servidor' });
  }
}

async function unblockAccount(req, res) {
  try {
    await adminService.unblockAccount(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Error del servidor' });
  }
}

module.exports = { getStats, getAccounts, updateAccountStatus, deleteAccount, getBlockedAccounts, unblockAccount };
