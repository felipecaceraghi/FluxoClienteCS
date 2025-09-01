require('dotenv').config();
const emailService = require('./src/services/email.service');
const path = require('path');

async function testCopiedDataEmail() {
    try {
        console.log('🔄 Testando envio de email com dados copiados...');

        // Usar um arquivo de exemplo que sabemos que existe
        const testFilePath = path.resolve('./src/storage/generated-reports/Grupo_Welucci_Ficha_Entrada_2025-08-29T17-50-01-910Z.xlsx');

        const fs = require('fs');
        if (!fs.existsSync(testFilePath)) {
            console.log('❌ Arquivo de teste não encontrado:', testFilePath);
            return;
        }

        console.log('📁 Arquivo encontrado:', testFilePath);

        const result = await emailService.sendFileAsCopiedDataEmail({
            to: 'felipe.caceraghi@gofurthergroup.com.br',
            subject: 'Teste - Dados Copiados da Planilha',
            grupo: 'AAMA',
            excelFilePath: testFilePath
        });

        console.log('✅ Email com dados copiados enviado com sucesso:', result);
    } catch (error) {
        console.log('❌ Erro no envio de email com dados copiados:', error.message);
        console.log('Stack:', error.stack);
    }
}

testCopiedDataEmail();
