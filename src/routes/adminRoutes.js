const express = require('express');
const router = express.Router();
const { requireAdmin }   = require('../middleware/auth');
const adminController    = require('../controllers/adminController');

router.use(requireAdmin);

router.get('/stats',                    adminController.getStats);
router.get('/accounts',                 adminController.getAccounts);
router.put('/accounts/:id/status',      adminController.updateAccountStatus);
router.delete('/accounts/:id',          adminController.deleteAccount);
router.get('/blocked',                  adminController.getBlockedAccounts);
router.put('/accounts/:id/unblock',     adminController.unblockAccount);

module.exports = router;
