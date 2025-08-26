const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const logger = require('../utils/logger');

function parseSheet(filePath, headerRow = 1, sheetName) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const workbook = xlsx.readFile(filePath, { cellDates: true });
    const targetSheetName = sheetName || workbook.SheetNames[0];
    if (!workbook.SheetNames.includes(targetSheetName)) {
        throw new Error(`Sheet not found: ${targetSheetName} in ${filePath}`);
    }
    const sheet = workbook.Sheets[targetSheetName];

    // Convert sheet to JSON but tell xlsx which row is the header
    const options = { header: 1, raw: false, defval: null };
    const rows = xlsx.utils.sheet_to_json(sheet, options);

    if (rows.length < headerRow) {
        logger.warn(`Sheet has fewer rows (${rows.length}) than headerRow (${headerRow})`);
        return [];
    }

    const headerIndex = headerRow - 1; // zero-based
    const headers = rows[headerIndex].map(h => (h === null ? '' : String(h).trim()));

    const dataRows = rows.slice(headerIndex + 1);

    const result = dataRows.map((r) => {
        const obj = {};
        for (let i = 0; i < headers.length; i++) {
            const key = headers[i] || `col_${i+1}`;
            obj[key] = r[i] !== undefined ? r[i] : null;
        }
        return obj;
    }).filter(row => Object.values(row).some(v => v !== null && v !== ''));

    return result;
}

module.exports = {
    parseSheet
};
