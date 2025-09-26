const axios = require('axios');

async function testCAgrirData() {
    try {
        console.log('🔍 Testando busca por grupo C.Agri...');
        
        // Primeiro fazer login para obter token
        console.log('📝 Fazendo login...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'teste@teste.com',
            password: '12345678'
        });
        
        const token = loginResponse.data.data?.token || loginResponse.data.token;
        console.log('✅ Login realizado com sucesso');
        
        // Buscar por grupo C.Agri
        console.log('🔍 Buscando grupo C.Agri...');
        const searchResponse = await axios.get('http://localhost:3001/api/group-search/C.Agri', {
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
                
                console.log('\n📅 DADOS DE VIGÊNCIA:');
                console.log(`  inicio_contrato: "${empresa.inicio_contrato || 'N/A'}"`);
                console.log(`  termino_contrato: "${empresa.termino_contrato || 'N/A'}"`);
                console.log(`  situacao: "${empresa.situacao || 'N/A'}"`);
                
                // SIMULAR A LÓGICA DE VIGÊNCIA INICIAL
                console.log('\n🔄 SIMULAÇÃO DO PROCESSAMENTO DE VIGÊNCIA:');
                let dataInicio;
                const dateStringFromApi = empresa.inicio_contrato;
                
                if (dateStringFromApi && dateStringFromApi.trim()) {
                    const dateStr = dateStringFromApi.trim();
                    console.log(`  📥 Input da API: "${dateStr}"`);
                    
                    // FORMATO 1: DD/MM/YY (ex: "22/09/25")
                    if (dateStr.includes('/')) {
                        const parts = dateStr.split('/');
                        if (parts.length === 3) {
                            const day = parts[0];
                            const month = parts[1];
                            let year = parts[2];
                            
                            // Se ano tem 2 dígitos, assumir 20XX
                            if (year.length === 2) {
                                year = '20' + year;
                            }
                            
                            // Formato ISO: YYYY-MM-DD
                            const isoDateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`;
                            dataInicio = new Date(isoDateString);
                            console.log(`  🔄 Formato DD/MM/YY detectado`);
                            console.log(`  📊 Conversão: day=${day}, month=${month}, year=${year}`);
                            console.log(`  📅 ISO String: "${isoDateString}"`);
                        }
                    }
                    // FORMATO 2: YYYY-MM-DD (ex: "2025-01-10") 
                    else if (dateStr.includes('-')) {
                        const parts = dateStr.split('-');
                        if (parts.length === 3) {
                            const year = parts[0];
                            const month = parts[1];
                            const day = parts[2];
                            
                            const isoDateString = `${year}-${month}-${day}T00:00:00`;
                            dataInicio = new Date(isoDateString);
                            console.log(`  🔄 Formato YYYY-MM-DD detectado`);
                            console.log(`  📊 Conversão: year=${year}, month=${month}, day=${day}`);
                            console.log(`  📅 ISO String: "${isoDateString}"`);
                        }
                    }
                    else {
                        dataInicio = new Date(dateStr);
                        console.log(`  🔄 Formato direto usado`);
                    }
                } else {
                    dataInicio = new Date();
                    console.log(`  ⚠️ Sem data de início, usando atual`);
                }
                
                // Verificar se a data é válida e formatar
                if (dataInicio && !isNaN(dataInicio)) {
                    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                    const mesAbreviado = meses[dataInicio.getMonth()];
                    const anoCurto = String(dataInicio.getFullYear()).slice(-2);
                    const vigenciaFormatada = `${mesAbreviado}/${anoCurto}`;
                    
                    console.log(`  📅 Data válida: ${dataInicio.toISOString()}`);
                    console.log(`  📊 Mês: ${dataInicio.getMonth()} → "${mesAbreviado}"`);
                    console.log(`  📊 Ano: ${dataInicio.getFullYear()} → "${anoCurto}"`);
                    console.log(`  ✅ VIGÊNCIA INICIAL FINAL: "${vigenciaFormatada}"`);
                } else {
                    console.log(`  ❌ Data inválida, campo ficará vazio na planilha`);
                }
                
                console.log('\n' + '='.repeat(50));
            });
        } else {
            console.log('\n❌ Nenhuma empresa encontrada para o grupo C.Agri');
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
testCAgrirData();