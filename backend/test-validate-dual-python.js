const xlsxGeneratorController = require('./src/controllers/xlsx-generator.controller');
const xlsxGeneratorService = require('./src/services/xlsx-generator.service');

async function testValidateAndSendDual() {
    try {
        console.log('🧪 TESTANDO INTEGRAÇÃO PYTHON NA API validateAndSendDual...');

        // Verificar se existem arquivos para teste
        const fs = require('fs');
        const path = require('path');
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

        console.log(`📁 Encontrados ${files.length} arquivos para teste:`);
        files.forEach((file, index) => {
            console.log(`   ${index + 1}. ${file}`);
        });

        // Usar os primeiros 2 arquivos para teste
        const testFiles = files.slice(0, 2);
        const grupo = 'TesteGrupoPython';

        console.log(`\n🎯 Testando com ${testFiles.length} arquivos:`);
        console.log(`   Grupo: ${grupo}`);
        console.log(`   Arquivos: ${testFiles.join(', ')}`);

        // Simular requisição para validateAndSendDual
        const mockReq = {
            body: {
                fileNames: testFiles,
                grupo: grupo,
                approved: true,
                enviarSeparado: true // Testar envio separado primeiro
            }
        };

        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    console.log(`📡 Resposta HTTP ${code}:`, JSON.stringify(data, null, 2));
                    return data;
                }
            }),
            json: (data) => {
                console.log('📡 Resposta JSON:', JSON.stringify(data, null, 2));
                return data;
            }
        };

        console.log('\n🚀 Executando validateAndSendDual...');
        await xlsxGeneratorController.validateAndSendDual(mockReq, mockRes);

        console.log('\n✅ Teste concluído! Verifique os emails enviados.');

    } catch (error) {
        console.error('❌ Erro no teste:', error);
        console.error('Stack:', error.stack);
    }
}

// Executar teste se chamado diretamente
if (require.main === module) {
    testValidateAndSendDual();
}

module.exports = { testValidateAndSendDual };
