const { parseSheet } = require('./src/services/planilha-parser.service');
const path = require('path');

async function checkRawFields() {
  try {
    const STORAGE_DIR = path.join(__dirname, './src/storage/sharepoint-files');
    const file = path.join(STORAGE_DIR, 'Cadastro_de_Clientes_v1.xlsm');

    console.log('🔍 Verificando campos BRUTOS da planilha de cadastro...');
    const rows = parseSheet(file, 5, 'Clientes');

    if (rows.length > 0) {
      const firstRow = rows[0];
      console.log('📊 Campos brutos encontrados:');
      console.log('Total de campos:', Object.keys(firstRow).length);
      console.log('');

      Object.keys(firstRow).forEach(key => {
        const value = firstRow[key];
        console.log(`${key}: ${value ? '"' + value.toString().substring(0, 50) + '"' : 'VAZIO'}`);
      });

      // Procurar por campos que podem conter informações de contato
      console.log('\n🔍 Procurando por possíveis campos de contato:');
      const possibleContactFields = Object.keys(firstRow).filter(key =>
        key.toLowerCase().includes('contato') ||
        key.toLowerCase().includes('nome') ||
        key.toLowerCase().includes('cargo') ||
        key.toLowerCase().includes('email') ||
        key.toLowerCase().includes('celular') ||
        key.toLowerCase().includes('telefone') ||
        key.toLowerCase().includes('responsavel')
      );

      if (possibleContactFields.length > 0) {
        console.log('Campos que podem conter dados de contato:');
        possibleContactFields.forEach(field => {
          console.log(`  ${field}: "${firstRow[field] || 'VAZIO'}"`);
        });
      } else {
        console.log('❌ Nenhum campo de contato encontrado nos headers da planilha');
      }
    } else {
      console.log('❌ Nenhuma linha encontrada na planilha');
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkRawFields();