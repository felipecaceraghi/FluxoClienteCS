const axios = require('axios');

async function buscarDadosCompletosCAgriri() {
    try {
        console.log('🔍 Buscando TODOS os dados brutos do Grupo C.Agri...');
        
        // Fazer login
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'teste@teste.com',
            password: '12345678'
        });
        
        const token = loginResponse.data.data?.token || loginResponse.data.token;
        
        // Buscar dados do C.Agri
        const searchResponse = await axios.get('http://localhost:3001/api/group-search/C.Agri', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📊 DADOS BRUTOS COMPLETOS - GRUPO C.AGRI');
        console.log('='.repeat(80));
        console.log(JSON.stringify(searchResponse.data, null, 2));
        
        if (searchResponse.data.empresas && searchResponse.data.empresas.length > 0) {
            console.log('\n\n📋 ANÁLISE CAMPO POR CAMPO POR EMPRESA:');
            console.log('='.repeat(80));
            
            searchResponse.data.empresas.forEach((empresa, index) => {
                console.log(`\n--- EMPRESA ${index + 1}: ${empresa.nome_fantasia} ---`);
                console.log(`CNPJ: ${empresa.cnpj}`);
                console.log('\n🔧 TODOS OS CAMPOS BPO:');
                
                // Listar TODOS os campos relacionados a BPO
                const camposBPO = [
                    'bpo_contabil', 'bpo_fiscal', 'bpo_folha', 'bpo_financeiro', 'bpo_rh', 'bpo_cnd',
                    'vl_bpo_contabil', 'vl_bpo_fiscal', 'vl_bpo_folha', 'vl_bpo_financeiro', 'vl_bpo_rh', 'vl_bpo_legal',
                    'bpo_contabil_faturado', 'bpo_fiscal_faturado', 'bpo_folha_faturado', 'bpo_financeiro_faturado', 'bpo_rh_faturado', 'bpo_legal_faturado'
                ];
                
                camposBPO.forEach(campo => {
                    const valor = empresa[campo];
                    const valorString = typeof valor === 'string' ? `"${valor}"` : valor;
                    console.log(`  ${campo}: ${valorString}`);
                });
                
                console.log('\n💰 CAMPOS FINANCEIROS:');
                const camposFinanceiros = [
                    'honorario_mensal_total', 'competencia_inicial_fixo', 'diversos_inicial', 
                    'vl_diversos_inicial', 'implantacao', 'vencimento_implantacao', 'vl_implantacao'
                ];
                
                camposFinanceiros.forEach(campo => {
                    const valor = empresa[campo];
                    const valorString = typeof valor === 'string' ? `"${valor}"` : valor;
                    console.log(`  ${campo}: ${valorString}`);
                });
                
                console.log('\n👥 CAMPOS DE CONTATO:');
                const camposContato = [
                    'contato_principal_nome', 'contato_principal_cargo', 
                    'contato_principal_email', 'contato_principal_celular'
                ];
                
                camposContato.forEach(campo => {
                    const valor = empresa[campo];
                    const valorString = typeof valor === 'string' ? `"${valor}"` : valor;
                    console.log(`  ${campo}: ${valorString}`);
                });
                
                console.log('\n📊 OUTROS CAMPOS IMPORTANTES:');
                const outrosCampos = [
                    'plano_contratado', 'sla', 'sistema_contabil', 'sistema_fiscal', 'sistema_folha',
                    'closer', 'prospector', 'observacao_closer', 'observacoes_cadastro'
                ];
                
                outrosCampos.forEach(campo => {
                    const valor = empresa[campo];
                    const valorString = typeof valor === 'string' ? `"${valor}"` : valor;
                    console.log(`  ${campo}: ${valorString}`);
                });
                
                console.log('\n' + '-'.repeat(60));
            });
        }
        
    } catch (error) {
        console.error('❌ Erro na busca:', error.message);
        
        if (error.response) {
            console.error('📄 Status:', error.response.status);
            console.error('📋 Dados:', error.response.data);
        }
    }
}

buscarDadosCompletosCAgriri();