require('dotenv').config();
const emailService = require('./src/services/email.service');
const xlsxGeneratorService = require('./src/services/xlsx-generator.service');
const path = require('path');

async function testPythonEmailFlow() {
    try {
        console.log('🚀 Iniciando teste do fluxo de email com Python...');

        // Verificar se existe algum arquivo Excel para teste
        const fs = require('fs');
        const reportsDir = path.join(__dirname, 'src/storage/generated-reports');

        if (!fs.existsSync(reportsDir)) {
            console.log('❌ Diretório de relatórios não encontrado');
            return;
        }

        const files = fs.readdirSync(reportsDir).filter(file => file.endsWith('.xlsx'));

        if (files.length === 0) {
            console.log('❌ Nenhum arquivo Excel encontrado para teste');
            return;
        }

        const testFile = files[0];
        const excelFilePath = path.join(reportsDir, testFile);

        console.log(`📁 Usando arquivo de teste: ${testFile}`);
        console.log(`📂 Caminho completo: ${excelFilePath}`);

        // Testar o método sendFileAsImageEmail
        console.log('📧 Testando envio com Python...');

        await emailService.sendFileAsImageEmail({
            to: 'felipe.caceraghi@gofurthergroup.com.br',
            subject: `Teste Python - ${testFile}`,
            grupo: 'TesteGrupo',
            excelFilePath: excelFilePath
        });

        console.log('✅ Teste concluído com sucesso!');

    } catch (error) {
        console.error('❌ Erro no teste:', error);
        console.error('Stack:', error.stack);
    }
}

// Executar teste se chamado diretamente
if (require.main === module) {
    testPythonEmailFlow();
}

module.exports = { testPythonEmailFlow };
