const path = require('path');
const { parseSheet } = require('../src/services/planilha-parser.service');
const { normalizeCadastro, normalizeProdutos, normalizeSaida } = require('../src/services/planilha-normalizer.service');

const base = path.join(__dirname, '../src/storage/sharepoint-files');

const files = [
    { name: 'Saida_de_Clientes.xlsx', headerRow: 6, sheet: 'Base de Dados', normalizer: normalizeSaida },
    { name: 'Cadastro_de_Clientes_v1.xlsm', headerRow: 5, sheet: 'Clientes', normalizer: normalizeCadastro },
    { name: 'Produtos_dos_Clientes_v1.xlsm', headerRow: 4, sheet: 'Produtos por Cliente', normalizer: normalizeProdutos }
];

(async () => {
    try {
        for (const f of files) {
            const p = path.join(base, f.name);
            console.log(`\nParsing ${f.name} (sheet "${f.sheet}", header row ${f.headerRow})`);
            const rows = parseSheet(p, f.headerRow, f.sheet);
            console.log(`Rows parsed: ${rows.length}`);
            if (rows.length > 0) {
                const sample = rows.slice(0,2).map(r => f.normalizer(r));
                console.log('Sample normalized (up to 2):', sample);
            }
        }
        process.exit(0);
    } catch (err) {
        console.error('Parse error:', err);
        process.exit(1);
    }
})();
