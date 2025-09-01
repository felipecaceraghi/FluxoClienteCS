require('dotenv').config();
const emailService = require('./src/services/email.service');
const fs = require('fs');
const path = require('path');

async function testMultipleFiles() {
    console.log('🧪 TESTANDO MÚLTIPLOS ARQUIVOS COM PYTHON');

    const reportsDir = path.join(__dirname, 'src/storage/generated-reports');
    const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.xlsx')).slice(0, 3);

    console.log(`📁 Encontrados ${files.length} arquivos para teste`);

    for (let i = 0; i < files.length; i++) {
        const fileName = files[i];
        const filePath = path.join(reportsDir, fileName);

        console.log(`\n📧 [${i+1}/${files.length}] Testando: ${fileName}`);

        try {
            await emailService.sendFileAsImageEmail({
                to: 'felipe.caceraghi@gofurthergroup.com.br',
                subject: `Teste Múltiplo [${i+1}] - ${fileName}`,
                grupo: 'TesteGrupo',
                excelFilePath: filePath
            });

            console.log(`✅ [${i+1}] Sucesso: ${fileName}`);
        } catch (error) {
            console.log(`❌ [${i+1}] Erro em ${fileName}: ${error.message}`);
        }

        // Pequena pausa entre envios para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n🎉 Teste múltiplo concluído!');
}

testMultipleFiles().catch(console.error);
