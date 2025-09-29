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

  console.log('✅ Verificação dos campos expandidos:');

  // Verificar campos específicos que deveriam estar preenchidos (células corrigidas)
  const fieldChecks = [
    { cell: 'D28', label: 'Faturamento Anual', expected: 'não vazio' },
    { cell: 'D49', label: 'Sistema Contábil', expected: 'não vazio' },
    { cell: 'D50', label: 'Sistema Folha', expected: 'não vazio' },
    { cell: 'D69', label: 'Closer', expected: 'não vazio' },
    { cell: 'D70', label: 'Prospector', expected: 'não vazio' },
    { cell: 'D29', label: 'Regime Tributário', expected: 'não vazio' },
    { cell: 'D30', label: 'NF Entradas', expected: 'não vazio' },
    { cell: 'D31', label: 'NF Saídas', expected: 'não vazio' }
  ];

  fieldChecks.forEach(check => {
    const value = worksheet[check.cell] ? worksheet[check.cell].v : 'VAZIO';
    const status = value !== 'VAZIO' ? '✅' : '❌';
    const match = check.expected === 'não vazio' ? (value !== 'VAZIO') : (value === check.expected);
    const matchIcon = match ? '✅' : '❌';
    console.log(`${status} ${check.label}: "${value}" ${matchIcon}`);
  });

  console.log('\n📊 Resumo:');
  const totalFields = fieldChecks.length;
  const filledFields = fieldChecks.filter(check => {
    const value = worksheet[check.cell] ? worksheet[check.cell].v : 'VAZIO';
    return value !== 'VAZIO';
  }).length;

  console.log(`Campos preenchidos: ${filledFields}/${totalFields} (${Math.round(filledFields/totalFields*100)}%)`);

  if (filledFields === totalFields) {
    console.log('\n🎉 SUCESSO! Todos os campos estão sendo populados corretamente.');
    console.log('✅ Correção dos sistemas em linhas separadas: IMPLEMENTADA');
    console.log('✅ Expansão do mapeamento de campos: FUNCIONANDO');
  }

} catch (error) {
  console.error('❌ Erro ao verificar planilha:', error.message);
}