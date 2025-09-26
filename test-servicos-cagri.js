const axios = require('axios');

async function analisarServicosCAgriri() {
    try {
        console.log('🔍 Analisando serviços contratados pelo Grupo C.Agri...');
        
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
        
        if (searchResponse.data.empresas && searchResponse.data.empresas.length > 0) {
            console.log('📊 ANÁLISE DE SERVIÇOS CONTRATADOS - GRUPO C.AGRI');
            console.log('='.repeat(60));
            
            searchResponse.data.empresas.forEach((empresa, index) => {
                console.log(`\n--- EMPRESA ${index + 1}: ${empresa.nome_fantasia} ---`);
                console.log(`CNPJ: ${empresa.cnpj}`);
                
                console.log('\n🔧 SERVIÇOS BPO CONTRATADOS:');
                
                // Mapear todos os serviços BPO disponíveis
                const servicosDisponiveis = [
                    { campo: 'bpo_contabil', nome: 'BPO Contábil', valor: empresa.bpo_contabil },
                    { campo: 'bpo_fiscal', nome: 'BPO Fiscal', valor: empresa.bpo_fiscal },
                    { campo: 'bpo_folha', nome: 'BPO Folha', valor: empresa.bpo_folha },
                    { campo: 'bpo_financeiro', nome: 'BPO Financeiro', valor: empresa.bpo_financeiro },
                    { campo: 'bpo_rh', nome: 'BPO RH', valor: empresa.bpo_rh },
                    { campo: 'bpo_cnd', nome: 'BPO CND/Legal', valor: empresa.bpo_cnd }
                ];
                
                let servicosContratados = [];
                let servicosNaoContratados = [];
                
                servicosDisponiveis.forEach(servico => {
                    const valor = servico.valor || '';
                    const isContratado = (valor === 'Sim' || valor === '10 horas úteis' || (valor && valor !== 'Não' && valor.trim() !== ''));
                    
                    if (isContratado) {
                        servicosContratados.push(`✅ ${servico.nome}: "${valor}"`);
                    } else {
                        servicosNaoContratados.push(`❌ ${servico.nome}: "${valor || 'Não'}"`);
                    }
                });
                
                console.log('\n📋 SERVIÇOS CONTRATADOS:');
                if (servicosContratados.length > 0) {
                    servicosContratados.forEach(servico => console.log(`  ${servico}`));
                } else {
                    console.log('  Nenhum serviço contratado');
                }
                
                console.log('\n📋 SERVIÇOS NÃO CONTRATADOS:');
                if (servicosNaoContratados.length > 0) {
                    servicosNaoContratados.forEach(servico => console.log(`  ${servico}`));
                }
                
                console.log('\n💰 VALORES DOS SERVIÇOS:');
                const valores = [
                    { nome: 'BPO Contábil', valor: empresa.vl_bpo_contabil },
                    { nome: 'BPO Fiscal', valor: empresa.vl_bpo_fiscal },
                    { nome: 'BPO Folha', valor: empresa.vl_bpo_folha },
                    { nome: 'BPO Financeiro', valor: empresa.vl_bpo_financeiro },
                    { nome: 'BPO RH', valor: empresa.vl_bpo_rh },
                    { nome: 'BPO Legal', valor: empresa.vl_bpo_legal }
                ];
                
                valores.forEach(item => {
                    if (item.valor && item.valor.trim() !== '' && item.valor !== 'Sim' && item.valor !== 'Não') {
                        console.log(`  💵 ${item.nome}: ${item.valor}`);
                    }
                });
                
                if (empresa.honorario_mensal_total) {
                    console.log(`  💼 TOTAL MENSAL: ${empresa.honorario_mensal_total}`);
                }
                
                console.log('\n🏢 FATURAMENTO POR:');
                const faturamento = [
                    { nome: 'Contábil', campo: 'bpo_contabil_faturado' },
                    { nome: 'Fiscal', campo: 'bpo_fiscal_faturado' },
                    { nome: 'Folha', campo: 'bpo_folha_faturado' },
                    { nome: 'Financeiro', campo: 'bpo_financeiro_faturado' },
                    { nome: 'RH', campo: 'bpo_rh_faturado' },
                    { nome: 'Legal', campo: 'bpo_legal_faturado' }
                ];
                
                faturamento.forEach(item => {
                    const valor = empresa[item.campo];
                    if (valor && valor.trim() !== '') {
                        console.log(`  🏦 ${item.nome}: ${valor}`);
                    }
                });
                
                console.log('\n' + '-'.repeat(50));
            });
            
            // RESUMO GERAL DO GRUPO
            console.log('\n📊 RESUMO GERAL - GRUPO C.AGRI');
            console.log('='.repeat(40));
            
            const servicosGrupo = new Set();
            let totalEmpresas = searchResponse.data.empresas.length;
            
            searchResponse.data.empresas.forEach(empresa => {
                if (empresa.bpo_contabil === 'Sim' || empresa.bpo_contabil === '10 horas úteis') servicosGrupo.add('BPO Contábil');
                if (empresa.bpo_fiscal === 'Sim') servicosGrupo.add('BPO Fiscal');
                if (empresa.bpo_folha === 'Sim') servicosGrupo.add('BPO Folha');
                if (empresa.bpo_financeiro === 'Sim') servicosGrupo.add('BPO Financeiro');
                if (empresa.bpo_rh === 'Sim') servicosGrupo.add('BPO RH');
                if (empresa.bpo_cnd === 'Sim') servicosGrupo.add('BPO CND/Legal');
            });
            
            console.log(`📈 Total de empresas: ${totalEmpresas}`);
            console.log(`🔧 Serviços únicos contratados pelo grupo: ${servicosGrupo.size}`);
            console.log('📋 Lista de serviços:');
            Array.from(servicosGrupo).forEach((servico, index) => {
                console.log(`  ${index + 1}. ${servico}`);
            });
            
        } else {
            console.log('\n❌ Nenhuma empresa encontrada para o grupo C.Agri');
        }
        
    } catch (error) {
        console.error('❌ Erro na análise:', error.message);
        
        if (error.response) {
            console.error('📄 Status:', error.response.status);
            console.error('📋 Dados:', error.response.data);
        }
    }
}

analisarServicosCAgriri();