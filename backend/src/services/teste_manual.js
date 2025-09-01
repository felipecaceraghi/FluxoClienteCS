// Nome do arquivo: teste_manual.js

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const emailService = require('./email.service.js');

// --- CONFIGURAÇÕES DO TESTE ---
const DADOS_DO_TESTE = {
    // Caminho completo para a planilha que vamos usar no teste
    excelFilePath: 'C:\\Users\\estatistica007\\Documents\\FluxoClienteCS\\backend\\src\\services\\teste.xlsx',
    
    // O e-mail para onde o relatório será enviado
    to: 'felipe.caceraghi@gofurthergroup.com.br',

    // O assunto do e-mail
    subject: 'TESTE FINAL - Relatório Automatizado',

    // O nome do grupo/cliente
    grupo: 'Grupo de Teste Definitivo'
};
// ---------------------------------

// Função principal para executar o teste
async function rodarTeste() {
    console.log('--- INICIANDO TESTE MANUAL DO FLUXO DE E-MAIL ---');
    try {
        // AQUI ESTÁ A CORREÇÃO: Usando o nome da função que realmente existe no seu EmailService
        const resultado = await emailService.sendFileAsNativeHtmlEmail(DADOS_DO_TESTE);
        
        console.log('\n\n--- TESTE CONCLUÍDO ---');
        console.log('✅ SUCESSO:', resultado);
        
    } catch (error) {
        console.log('\n\n--- TESTE FALHOU ---');
        console.error('❌ ERRO:', error.message);
    }
}

// Executa a função de teste
rodarTeste();