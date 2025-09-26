const axios = require('axios');

async function testCAgrirVigenciaReal() {
    try {
        console.log('🔍 Testando vigência corrigida na planilha C.Agri...');
        
        // Fazer login
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'teste@teste.com',
            password: '12345678'
        });
        
        const token = loginResponse.data.data?.token || loginResponse.data.token;
        
        // Gerar planilha para C.Agri
        console.log('📊 Gerando planilha C.Agri para testar vigência corrigida...');
        const generateResponse = await axios.get('http://localhost:3001/api/xlsx-generator/generate/C.Agri', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Planilha gerada:', generateResponse.data.data?.fileName);
        console.log('🔗 URL de download:', generateResponse.data.data?.downloadUrl);
        
        console.log('\n📝 Teste concluído! Verifique a planilha gerada para ver se:');
        console.log('1. Vigência Inicial mudou de "jan/25" para "out/25"');
        console.log('2. Data "2025-01-10" foi interpretada como 1º de outubro (formato americano corrigido)');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        
        if (error.response) {
            console.error('📄 Status:', error.response.status);
            console.error('📋 Dados:', error.response.data);
        }
    }
}

testCAgrirVigenciaReal();