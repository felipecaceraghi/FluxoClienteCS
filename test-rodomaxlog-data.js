const axios = require('axios');

async function testRodomaxlogData() {
    try {
        console.log('🔍 Testando busca por grupo rodomaxlog...');
        
        // Primeiro fazer login para obter token
        console.log('📝 Fazendo login...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'teste@teste.com',
            password: '12345678'
        });
        
        const token = loginResponse.data.data?.token || loginResponse.data.token;
        console.log('✅ Login realizado com sucesso');
        
        // Buscar por grupo rodomaxlog
        console.log('🔍 Buscando grupo rodomaxlog...');
        const searchResponse = await axios.get('http://localhost:3001/api/group-search/rodomaxlog', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📊 DADOS BRUTOS DA API:');
        console.log('=======================');
        console.log(JSON.stringify(searchResponse.data, null, 2));
        
        if (searchResponse.data.empresas && searchResponse.data.empresas.length > 0) {
            console.log('\n📋 ANÁLISE DETALHADA DAS EMPRESAS:');
            console.log('===================================');
            
            searchResponse.data.empresas.forEach((empresa, index) => {
                console.log(`\n--- EMPRESA ${index + 1} ---`);
                console.log('DADOS BÁSICOS:');
                console.log(`  nome_fantasia: ${empresa.nome_fantasia || 'N/A'}`);
                console.log(`  razao_social: ${empresa.razao_social || 'N/A'}`);
                console.log(`  cnpj: ${empresa.cnpj || 'N/A'}`);
                console.log(`  grupo: ${empresa.grupo || 'N/A'}`);
                
                console.log('\nDADOS DE CONTRATO:');
                console.log(`  vigencia_inicial: ${empresa.vigencia_inicial || 'N/A'}`);
                console.log(`  plano_contratado: ${empresa.plano_contratado || 'N/A'}`);
                console.log(`  sla_para_retorno: ${empresa.sla_para_retorno || 'N/A'}`);
                console.log(`  implantacao: ${empresa.implantacao || 'N/A'}`);
                
                console.log('\nDADOS DE CONTATO:');
                console.log(`  nome_contato: ${empresa.nome_contato || 'N/A'}`);
                console.log(`  cargo_contato: ${empresa.cargo_contato || 'N/A'}`);
                console.log(`  email_contato: ${empresa.email_contato || 'N/A'}`);
                console.log(`  celular_contato: ${empresa.celular_contato || 'N/A'}`);
                
                console.log('\nOUTROS DADOS:');
                console.log(`  link_do_site: ${empresa.link_do_site || 'N/A'}`);
                console.log(`  faturamento_anual: ${empresa.faturamento_anual || 'N/A'}`);
                console.log(`  regime_tributario: ${empresa.regime_tributario || 'N/A'}`);
                console.log(`  closer: ${empresa.closer || 'N/A'}`);
                console.log(`  prospector: ${empresa.prospector || 'N/A'}`);
            });
        } else {
            console.log('\n❌ Nenhuma empresa encontrada para o grupo rodomaxlog');
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
testRodomaxlogData();