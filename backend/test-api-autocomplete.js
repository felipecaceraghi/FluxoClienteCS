const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

async function testAPI() {
    try {
        console.log('🔍 Testando APIs do sistema de busca...\n');
        
        // Login para obter token
        console.log('🔐 Fazendo login...');
        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            email: 'teste@teste.com',
            password: '12345678'
        });
        
        console.log('   📊 Login response:', loginResponse.data);
        
        if (!loginResponse.data.success || !loginResponse.data.data.token) {
            throw new Error('Login falhou ou token não retornado');
        }
        
        const token = loginResponse.data.data.token;
        console.log('✅ Login realizado com sucesso\n');
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        // Teste 1: Autocomplete
        console.log('1️⃣ Testando autocomplete com "tek":');
        const autocompleteResponse = await axios.get(`${API_BASE_URL}/api/companies/autocomplete`, {
            params: { q: 'tek', limit: 5 },
            headers
        });
        
        console.log('   📊 Status:', autocompleteResponse.status);
        console.log('   📊 Resultados:', autocompleteResponse.data.data.length);
        console.log('   📊 Primeiros 2:', JSON.stringify(autocompleteResponse.data.data.slice(0, 2), null, 2));
        
        // Teste 2: Busca geral
        console.log('\n2️⃣ Testando busca geral com "ACX":');
        const searchResponse = await axios.get(`${API_BASE_URL}/api/companies/search`, {
            params: { q: 'ACX', limit: 5 },
            headers
        });
        
        console.log('   📊 Status:', searchResponse.status);
        console.log('   📊 Resultados:', searchResponse.data.data.length);
        console.log('   📊 Primeira empresa:', JSON.stringify(searchResponse.data.data[0], null, 2));
        
        // Teste 3: Busca sem query (todas as empresas)
        console.log('\n3️⃣ Testando busca sem query (todas):');
        const allSearchResponse = await axios.get(`${API_BASE_URL}/api/companies/search`, {
            params: { limit: 3 },
            headers
        });
        
        console.log('   📊 Status:', allSearchResponse.status);
        console.log('   📊 Resultados:', allSearchResponse.data.data.length);
        console.log('   📊 Total páginas:', allSearchResponse.data.pagination.totalPages);
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.response?.data || error.message);
    }
}

testAPI().then(() => {
    console.log('\n✅ Teste de API concluído!');
    process.exit(0);
}).catch(err => {
    console.error('💥 Erro:', err);
    process.exit(1);
});
