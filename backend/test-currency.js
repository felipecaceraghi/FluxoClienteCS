const CurrencyUtils = require('./src/utils/currency');

console.log('🔍 Debugando CurrencyUtils...');

const exemploValores = [
    'R$ 325.00',
    'R$ 1,372.56', 
    'R$ 2,841.36',
    'R$ 0.00'
];

exemploValores.forEach(valor => {
    console.log(`\n=== Testando: "${valor}" ===`);
    console.log('isValidCurrency:', CurrencyUtils.isValidCurrency(valor));
    console.log('parseFromBRL:', CurrencyUtils.parseFromBRL(valor));
    console.log('processForSpreadsheet:', CurrencyUtils.processForSpreadsheet(valor));
});

// Testar regex
const currencyRegex = /^R\$?\s*\d{1,3}(\.\d{3})*,\d{2}$|^\d{1,3}(\.\d{3})*,\d{2}$|^\d+,\d{2}$|^\d+\.\d{2}$|^\d+$/;

console.log('\n=== Teste da Regex ===');
exemploValores.forEach(valor => {
    console.log(`"${valor}" → ${currencyRegex.test(valor.trim())}`);
});
