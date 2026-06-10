// Compatibility shim — re-exports from src/ to maintain backward compat.
// Tests mock this module; all new internal code uses src/ modules.
const { getPool, DB_CONFIG } = require('../src/config/database');
const { buildDbJson, saveDbJson } = require('../src/dao/DbSyncDAO');

module.exports = { getPool, buildDbJson, saveDbJson, DB_CONFIG };
