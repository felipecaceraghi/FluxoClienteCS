require('dotenv').config();
const emailService = require('./src/services/email.service');

async function testEmail() {
    try {
        console.log('🔄 Testando envio de email...');
        console.log('Variáveis de ambiente:');
        console.log('- GRAPH_CLIENT_ID:', process.env.GRAPH_CLIENT_ID ? '✅ Definido' : '❌ Não definido');
        console.log('- GRAPH_CLIENT_SECRET:', process.env.GRAPH_CLIENT_SECRET ? '✅ Definido' : '❌ Não definido');
        console.log('- GRAPH_TENANT_ID:', process.env.GRAPH_TENANT_ID ? '✅ Definido' : '❌ Não definido');
        console.log('- EMAIL_SENDER:', process.env.EMAIL_SENDER ? '✅ Definido' : '❌ Não definido');

        const result = await emailService.sendTestEmail('felipe.caceraghi@gofurthergroup.com.br');
        console.log('✅ Email enviado com sucesso:', result);
    } catch (error) {
        console.log('❌ Erro no envio de email:', error.message);
        console.log('Stack:', error.stack);
    }
}

testEmail();
