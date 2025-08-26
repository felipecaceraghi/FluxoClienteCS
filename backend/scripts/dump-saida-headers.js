const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');

(async () => {
    try {
        const STORAGE_DIR = path.join(__dirname, '../src/storage/sharepoint-files');
        const fileName = process.env.SAIDA_CLIENTES_FILE_NAME || 'Saida_de_Clientes.xlsx';
        const filePath = path.join(STORAGE_DIR, fileName);

        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            process.exit(1);
        }

        const wb = xlsx.readFile(filePath, { cellDates: true });
        console.log('Sheet names:', wb.SheetNames);
        const sheetName = process.env.SAIDA_SHEET_NAME || 'Base de Dados';
        if (!wb.SheetNames.includes(sheetName)) {
            console.error('Sheet not found:', sheetName);
            process.exit(1);
        }

        const sheet = wb.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
        const headerRow = (parseInt(process.env.SAIDA_HEADER_ROW) || 6) - 1; // zero-based

        console.log('\nHeader row index (0-based):', headerRow);
        console.log('\nHeader cells:');
        console.log(rows[headerRow]);

        console.log('\nNext 10 rows after header:');
        for (let i = headerRow + 1; i <= headerRow + 10 && i < rows.length; i++) {
            console.log(i + 1, rows[i]);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error dumping headers:', err);
        process.exit(2);
    }
})();
