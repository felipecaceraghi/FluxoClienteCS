const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');

const STORAGE_DIR = path.join(__dirname, '../src/storage/sharepoint-files');
const fileName = process.env.SAIDA_CLIENTES_FILE_NAME || 'Saida_de_Clientes.xlsx';
const filePath = path.join(STORAGE_DIR, fileName);

if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
}

const wb = xlsx.readFile(filePath, { cellDates: true });
const sheetName = process.env.SAIDA_SHEET_NAME || 'Base de Dados';
const sheet = wb.Sheets[sheetName];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

let found = [];
for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
        const v = rows[r][c];
        if (v && String(v).toLowerCase().includes('autotechnik'.toLowerCase())) {
            found.push({ row: r+1, col: c+1, value: v });
        }
    }
}

console.log('Found count:', found.length);
if (found.length > 0) console.log(found.slice(0,20));
else console.log('No matches');

process.exit(0);
