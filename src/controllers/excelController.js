const excelService = require('../services/excelService');

async function exportExcel(req, res) {
  const { courseName, grade, letter, bim, students, activities, grades } = req.body || {};
  if (!students || !activities) return res.status(400).json({ error: 'Datos incompletos' });
  try {
    const { wb, safeName } = await excelService.exportToExcel({ courseName, grade, letter, bim, students, activities, grades });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Excel export error:', err.message);
    res.status(500).json({ error: 'Error al generar el Excel' });
  }
}

async function importExcel(req, res) {
  const { fileBase64 } = req.body || {};
  if (!fileBase64) return res.status(400).json({ error: 'No se recibió el archivo' });
  try {
    const names = await excelService.importFromExcel(fileBase64);
    res.json({ names });
  } catch (err) {
    console.error('Excel import error:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Error al leer el archivo Excel' });
  }
}

module.exports = { exportExcel, importExcel };
