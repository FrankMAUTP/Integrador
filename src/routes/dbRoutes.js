const express = require('express');
const router = express.Router();
const dbController = require('../controllers/dbController');

router.get('/', dbController.getDb);
router.put('/', dbController.putDb);

module.exports = router;
