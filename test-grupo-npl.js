Yeah. Yes. Hey. See. Anyway. Send a search mail, search me. What does that mean? About this. Soup. OK my stool. Case. Movies. Suing Prospero. Roy. Call Peter. It's a nice train. When is cell container at Paris? Cool. No. Play. Another facing Chido. I don't know. Also cheesy. Loss. What is two? This year. And there's so many. Do you have to particular? So. Pause. But. No. Because. OK. No. const axios = require('axios');

async function testGroupSearch() {
    try {
        console.log('🔍 Testando busca por grupo NPL...');
        
        // Primeiro fazer login para obter token
        console.log('📝 Fazendo login...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'teste@teste.com',
            password: '12345678'
        });
        
        const token = loginResponse.data.data?.token || loginResponse.data.token;
        console.log('✅ Login realizado com sucesso');
        console.log('📋 Dados do login:', JSON.stringify(loginResponse.data, null, 2));
        
        // Buscar por grupo NPL
        console.log('🔍 Buscando grupo NPL...');
        const searchResponse = await axios.get('http://localhost:3001/api/group-search/NPL', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📊 Resultado da busca:');
        console.log('====================');
        console.log(`✅ Sucesso: ${searchResponse.data.success}`);
        console.log(`📋 Termo buscado: ${searchResponse.data.searchCriteria?.termo_buscado}`);
        console.log(`📈 Total empresas na planilha: ${searchResponse.data.summary?.total_empresas_planilha}`);
        console.log(`🎯 Empresas encontradas: ${searchResponse.data.summary?.empresas_encontradas}`);
        console.log(`⏱️ Tempo de processamento: ${searchResponse.data.summary?.tempo_processamento}`);
        console.log(`📄 Arquivo origem: ${searchResponse.data.summary?.arquivo_origem}`);
        
        if (searchResponse.data.empresas && searchResponse.data.empresas.length > 0) {
            console.log('\n📋 Primeiras empresas encontradas:');
            console.log('====================================');
            searchResponse.data.empresas.slice(0, 5).forEach((empresa, index) => {
                console.log(`${index + 1}. ${empresa.nome_fantasia || 'N/A'}`);
                console.log(`   CNPJ: ${empresa.cnpj || 'N/A'}`);
                console.log(`   Grupo: ${empresa.grupo || 'N/A'}`);
                console.log('   ---');
            });
            
            if (searchResponse.data.empresas.length > 5) {
                console.log(`   ... e mais ${searchResponse.data.empresas.length - 5} empresas`);
            }
        } else {
            console.log('\n❌ Nenhuma empresa encontrada para o grupo NPL');
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        
        if (error.response) {
            console.error('📄 Status:', error.response.status);
            console.error('📋 Dados:', error.response.data);
        }
    }
}

// Executar teste
testGroupSearch();