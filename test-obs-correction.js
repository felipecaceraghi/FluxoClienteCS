const axios = require('axios');

async function testObsCorrection() {
    try {
        console.log('🔍 Testando correção de observações...');
        
        // Fazer login
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'teste@teste.com',
            password: '12345678'
        });
        
        const token = loginResponse.data.data?.token || loginResponse.data.token;
        
        // Gerar planilha para rodomaxlog para testar as observações
        console.log('📊 Gerando planilha para testar observações...');
        const generateResponse = await axios.get('http://localhost:3001/api/xlsx-generator/generate/rodomaxlog', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Planilha gerada:', generateResponse.data.data?.fileName);
        console.log('🔗 URL de download:', generateResponse.data.data?.downloadUrl);
        
        console.log('\n📝 Teste concluído! Verifique a planilha gerada para ver se:');
        console.log('1. Campo "Obs Closer:" aparece na seção Comercial');
        console.log('2. Contém o texto do motivo_troca (informação sobre terceirização)');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        if (error.response) {
            console.error('📄 Status:', error.response.status);
            console.error('📋 Dados:', error.response.data);
        }
    }
}

testObsCorrection();