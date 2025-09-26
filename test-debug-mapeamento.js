const axios = require('axios');

// Função para buscar dados do grupo C.Agri e mostrar problemas específicos
async function debugMapeamento() {
    try {
        console.log('🔍 DIAGNÓSTICO DE MAPEAMENTO - GRUPO C.AGRI');
        console.log('='.repeat(60));
        
        // Simular busca de dados (vamos usar os dados que já conhecemos)
        const empresasRaw = [
            {
                nome_fantasia: "COOPERATIVA CENTRAL AGROCOMMERCIAL",
                razao_social: "COOPERATIVA CENTRAL AGROCOMMERCIAL",
                cnpj: "02.617.552/0001-30",
                codigo: 1001,
                grupo: "Grupo C.Agri",
                inicio_contrato: "2025-01-09", // Formato americano problemático
                
                // PROBLEMAS DE CONTATOS (campos desalinhados)
                contato_principal_nome: "", // VAZIO - problema!
                contato_principal_cargo: "João Silva", // NOME está aqui
                contato_principal_email: "Gerente Comercial", // CARGO está aqui  
                contato_principal_celular: "joao@cagri.com.br", // EMAIL está aqui
                
                // PROBLEMAS DE PLANO/SLA
                plano_contratado: "(11) 98765-4321", // CELULAR está aqui
                sla: "Plano Premium", // PLANO está aqui
                
                // PROBLEMAS DE SERVIÇOS - NÃO DETECTA "10 horas úteis"
                bpo_contabil: "10 horas úteis", // ❌ NÃO É "Sim"
                bpo_fiscal: "Sim",
                bpo_folha: "Não", 
                bpo_financeiro: "Sim",
                
                vl_bpo_contabil: "R$ 2.500,00",
                vl_bpo_fiscal: "R$ 1.800,00",
                
                observacao_closer: "", // VAZIO
                motivo_troca: "Cliente migrou de outro escritório por insatisfação com atendimento" // CONTEÚDO está aqui
            }
        ];
        
        console.log('📋 DADOS ORIGINAIS (PROBLEMAS):');
        console.log('--------------------------------');
        const empresa = empresasRaw[0];
        
        console.log('🔴 PROBLEMA 1 - CONTATOS DESALINHADOS:');
        console.log(`   Nome: "${empresa.contato_principal_nome}" (VAZIO)`);
        console.log(`   Cargo: "${empresa.contato_principal_cargo}" (NA VERDADE É O NOME)`);
        console.log(`   Email: "${empresa.contato_principal_email}" (NA VERDADE É O CARGO)`);
        console.log(`   Celular: "${empresa.contato_principal_celular}" (NA VERDADE É O EMAIL)`);
        console.log('');
        
        console.log('🔴 PROBLEMA 2 - PLANO/SLA TROCADOS:');
        console.log(`   Plano: "${empresa.plano_contratado}" (NA VERDADE É O CELULAR)`);
        console.log(`   SLA: "${empresa.sla}" (NA VERDADE É O PLANO)`);
        console.log('');
        
        console.log('🔴 PROBLEMA 3 - SERVIÇOS NÃO DETECTADOS:');
        console.log(`   BPO Contábil: "${empresa.bpo_contabil}" (≠ "Sim", logo NÃO SERÁ DETECTADO)`);
        console.log(`   BPO Fiscal: "${empresa.bpo_fiscal}" (= "Sim", SERÁ DETECTADO)`);
        console.log('');
        
        console.log('🔴 PROBLEMA 4 - OBSERVAÇÃO MAPEAMENTO INCORRETO:');
        console.log(`   Observação Closer: "${empresa.observacao_closer}" (VAZIO)`);
        console.log(`   Motivo Troca: "${empresa.motivo_troca}" (TEM CONTEÚDO)`);
        console.log('');
        
        console.log('🔴 PROBLEMA 5 - DATA FORMATO AMERICANO:');
        console.log(`   Data API: "${empresa.inicio_contrato}" (2025-01-09 = 09/01/2025, mas pode ser interpretado como 01/09/2025)`);
        
        console.log('');
        console.log('🛠️  TESTANDO CORREÇÕES ATUAIS...');
        console.log('='.repeat(60));
        
        // Testar função de correção atual
        const XlsxGeneratorService = require('./backend/src/services/xlsx-generator.service');
        const empresaCorrigida = XlsxGeneratorService.fixDataMisalignment(empresa);
        
        console.log('✅ APÓS CORREÇÃO:');
        console.log('------------------');
        console.log('📞 CONTATOS CORRIGIDOS:');
        console.log(`   Nome: "${empresaCorrigida.contato_principal_nome}"`);
        console.log(`   Cargo: "${empresaCorrigida.contato_principal_cargo}"`);
        console.log(`   Email: "${empresaCorrigida.contato_principal_email}"`);
        console.log(`   Celular: "${empresaCorrigida.contato_principal_celular}"`);
        console.log('');
        
        console.log('📋 PLANO/SLA CORRIGIDOS:');
        console.log(`   Plano: "${empresaCorrigida.plano_contratado}"`);
        console.log(`   SLA: "${empresaCorrigida.sla}"`);
        console.log('');
        
        console.log('📝 OBSERVAÇÃO CORRIGIDA:');
        console.log(`   Observação Closer: "${empresaCorrigida.observacao_closer}"`);
        console.log('');
        
        // Testar detecção de serviços
        console.log('🔍 TESTANDO DETECÇÃO DE SERVIÇOS:');
        console.log('----------------------------------');
        
        const servicosDisponiveis = [
            { campo: 'bpo_contabil', nome: 'BPO Contábil' },
            { campo: 'bpo_fiscal', nome: 'BPO Fiscal' },
            { campo: 'bpo_folha', nome: 'BPO Folha' },
            { campo: 'bpo_financeiro', nome: 'BPO Financeiro' },
        ];
        
        console.log('❌ LÓGICA ATUAL (DETECTA APENAS "Sim"):');
        servicosDisponiveis.forEach(servico => {
            const valor = empresaCorrigida[servico.campo];
            const detectado = valor === 'Sim' ? '✅ DETECTADO' : '❌ NÃO DETECTADO';
            console.log(`   ${servico.nome}: "${valor}" → ${detectado}`);
        });
        
        console.log('');
        console.log('✅ LÓGICA MELHORADA (DEVERIA DETECTAR):');
        servicosDisponiveis.forEach(servico => {
            const valor = empresaCorrigida[servico.campo];
            // Lógica melhorada: detecta "Sim" ou valores que não sejam "Não", vazios ou nulos
            const detectado = valor && valor.trim() && valor.toLowerCase() !== 'não' ? '✅ DEVERIA SER DETECTADO' : '❌ NÃO DETECTADO';
            console.log(`   ${servico.nome}: "${valor}" → ${detectado}`);
        });
        
    } catch (error) {
        console.error('❌ Erro no diagnóstico:', error.message);
    }
}

debugMapeamento();