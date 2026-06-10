const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

router.post('/contact',   emailController.sendContact);
router.post('/send-code', emailController.sendCode);

module.exports = router;
