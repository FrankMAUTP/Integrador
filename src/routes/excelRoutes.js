const express = require('express');
const router = express.Router();
const excelController = require('../controllers/excelController');

router.post('/export/excel', excelController.exportExcel);
router.post('/import/excel', excelController.importExcel);

module.exports = router;
