const service = require('./src/services/xlsx-generator.service');

console.log('🔍 Testando geração de planilha de honorários...');

service.generateSpreadsheetByType('Teklamatik', 'cobranca').then(result => {
  console.log('✅ Planilha gerada:', result.data.fileName);
  console.log('📊 Total de empresas:', result.data.totalEmpresas);
  console.log('📄 Total de linhas:', result.data.totalLinhas);
}).catch(error => {
  console.error('❌ Erro:', error.message);
  console.error('Stack:', error.stack);
});
