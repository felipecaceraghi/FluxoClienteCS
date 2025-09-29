const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

try {
  const reportsDir = path.join(__dirname, 'src', 'storage', 'generated-reports');
  const files = fs.readdirSync(reportsDir).filter(f => f.startsWith('Teste_Sistemas_Corrigido') && f.endsWith('.xlsx'));

  if (files.length === 0) {
    console.log('❌ Nenhuma planilha de teste encontrada');
    return;
  }

  const fileName = path.join(reportsDir, files[0]);
  console.log('📊 Verificando planilha:', fileName);

  const workbook = XLSX.readFile(fileName);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  console.log('🔍 Verificando células corretas:');
  console.log('D28 (Faturamento):', worksheet['D28'] ? worksheet['D28'].v : 'VAZIO');
  console.log('D49 (Sistema Contábil - label):', worksheet['C49'] ? worksheet['C49'].v : 'VAZIO');
  console.log('D49 (Sistema Contábil - valor):', worksheet['D49'] ? worksheet['D49'].v : 'VAZIO');
  console.log('D50 (Sistema Folha - label):', worksheet['C50'] ? worksheet['C50'].v : 'VAZIO');
  console.log('D50 (Sistema Folha - valor):', worksheet['D50'] ? worksheet['D50'].v : 'VAZIO');
  console.log('D69 (Closer - label):', worksheet['C69'] ? worksheet['C69'].v : 'VAZIO');
  console.log('D69 (Closer - valor):', worksheet['D69'] ? worksheet['D69'].v : 'VAZIO');
  console.log('D70 (Prospector - label):', worksheet['C70'] ? worksheet['C70'].v : 'VAZIO');
  console.log('D70 (Prospector - valor):', worksheet['D70'] ? worksheet['D70'].v : 'VAZIO');

  console.log('\n🔍 Verificando se os sistemas estão em linhas separadas:');
  console.log('C49:', worksheet['C49'] ? worksheet['C49'].v : 'VAZIO');
  console.log('D49:', worksheet['D49'] ? worksheet['D49'].v : 'VAZIO');
  console.log('C50:', worksheet['C50'] ? worksheet['C50'].v : 'VAZIO');
  console.log('D50:', worksheet['D50'] ? worksheet['D50'].v : 'VAZIO');

} catch (error) {
  console.error('❌ Erro ao verificar planilha:', error.message);
}