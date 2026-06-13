const ExcelJS = require('exceljs');

const GRADE_FILL  = { AD: 'FFD1FAE5', A: 'FFDBEAFE', B: 'FFFEF3C7', C: 'FFFEE2E2' };
const GRADE_FONT  = { AD: 'FF065F46', A: 'FF1E40AF', B: 'FF92400E', C: 'FF991B1B' };
const isPromedioId = id => id === '__promedio__' || id === 'anual';

async function exportToExcel({ courseName, grade, letter, bim, students, activities, grades }) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Notas');

  const headers = ['N°', 'Alumno', ...activities.map(a => a.name)];
  const headerRow = ws.addRow(headers);
  headerRow.eachCell((cell, colNum) => {
    const actIdx    = colNum - 3;
    const isPromCol = actIdx >= 0 && isPromedioId(activities[actIdx]?.id);
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isPromCol ? 'FF1E40AF' : 'FF2563EB' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
  });

  students.forEach((stu, idx) => {
    const row = [idx + 1, stu.name, ...activities.map(act => {
      const nota = grades?.[stu.id]?.[act.id];
      return nota !== undefined && nota !== null && nota !== '' ? nota : '';
    })];
    const dataRow = ws.addRow(row);
    dataRow.eachCell((cell, colNum) => {
      const actIdx    = colNum - 3;
      const isPromCol = actIdx >= 0 && isPromedioId(activities[actIdx]?.id);
      const gradeVal  = colNum >= 3 ? String(cell.value || '') : '';

      if (isPromCol && GRADE_FILL[gradeVal]) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRADE_FILL[gradeVal] } };
        cell.font = { bold: true, color: { argb: GRADE_FONT[gradeVal] } };
      } else if (colNum >= 3 && GRADE_FILL[gradeVal]) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRADE_FILL[gradeVal] } };
        cell.font = { color: { argb: GRADE_FONT[gradeVal] } };
      } else if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      }

      cell.alignment = { horizontal: colNum <= 2 ? 'left' : 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
    });
  });

  ws.getColumn(1).width = 5;
  ws.getColumn(2).width = 30;
  for (let i = 3; i <= headers.length; i++) ws.getColumn(i).width = 14;
  ws.getRow(1).height = 30;

  const safeName = `${courseName || 'Notas'}_${grade || ''}${letter || ''}_B${bim || ''}`.replace(/[^\w\-]/g, '_');
  return { wb, safeName };
}

async function importFromExcel(fileBase64) {
  const buffer = Buffer.from(fileBase64, 'base64');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const ws = wb.worksheets[0];
  if (!ws) {
    const err = new Error('El archivo Excel no contiene hojas');
    err.status = 400;
    throw err;
  }

  const HEADER_WORDS = ['alumno', 'nombre', 'name', 'student', 'apellido'];
  let nameCol = 2;
  const firstRow = ws.getRow(1);
  firstRow.eachCell((cell, colNum) => {
    const text = String(cell.value || '').toLowerCase().trim();
    if (HEADER_WORDS.some(w => text.includes(w))) nameCol = colNum;
  });
  const looksLikePlainList = !HEADER_WORDS.some(w =>
    firstRow.values.some(v => String(v || '').toLowerCase().includes(w))
  );
  if (looksLikePlainList) nameCol = 1;

  const names = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      const val = String(row.getCell(nameCol).value || '').trim();
      if (HEADER_WORDS.some(w => val.toLowerCase().includes(w))) return;
      if (!isNaN(Number(val)) || val === 'N°' || val === '#') return;
    }
    const val = String(row.getCell(nameCol).value || '').trim();
    if (val && isNaN(Number(val)) && !/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ ]/.test(val)) names.push(val);
  });

  return names;
}

module.exports = { exportToExcel, importFromExcel };
