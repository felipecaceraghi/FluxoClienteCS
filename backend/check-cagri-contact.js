const { parseSheet } = require('./src/services/planilha-parser.service');
const path = require('path');

async function checkCagriContact() {
  try {
    const STORAGE_DIR = path.join(__dirname, './src/storage/sharepoint-files');
    const file = path.join(STORAGE_DIR, 'Cadastro_de_Clientes_v1.xlsm');

    console.log('🔍 Procurando dados de contato da CAGRI (código 2653)...');
    const rows = parseSheet(file, 5, 'Clientes');

    // Procurar pela linha com código 2653
    const cagriRow = rows.find(row => row['Código Domínio'] == '2653');

    if (cagriRow) {
      console.log('✅ Empresa CAGRI encontrada!');
      console.log('Dados de contato:');
      console.log('  Nome:', cagriRow['Contato Principal - Nome'] || 'VAZIO');
      console.log('  Cargo:', cagriRow['Contato Principal - Cargo'] || 'VAZIO');
      console.log('  Email:', cagriRow['Contato Principal - Email'] || 'VAZIO');
      console.log('  Celular:', cagriRow['Contato Principal - Celular'] || 'VAZIO');
    } else {
      console.log('❌ Empresa CAGRI não encontrada');

      // Mostrar algumas linhas para debug
      console.log('Primeiras 3 linhas encontradas:');
      rows.slice(0, 3).forEach((row, i) => {
        console.log(`Linha ${i+1} - Código: ${row['Código Domínio']}, Nome: ${row['Nome Fantasia']}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkCagriContact();