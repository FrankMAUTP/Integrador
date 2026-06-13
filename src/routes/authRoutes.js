const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { emailLimiter } = require('../middleware/rateLimiter');

router.post('/login',                         authController.login);
router.post('/register',                      authController.register);
router.post('/change-password',               authController.changePassword);
router.post('/reset-password',                authController.resetPassword);
router.delete('/account',                     authController.deleteAccount);

router.post('/send-register-code',  emailLimiter, authController.sendRegisterCode);
router.post('/verify-register-code',              authController.verifyRegisterCode);
router.post('/send-recovery-code',  emailLimiter, authController.sendRecoveryCode);
router.post('/verify-recovery-code',              authController.verifyRecoveryCode);

module.exports = router;
