const axios = require('axios');

// Script para mostrar o mapeamento RAW dos dados
async function mostrarMapeamentoRaw() {
    try {
        console.log('📋 MAPEAMENTO RAW - DADOS BRUTOS DA API');
        console.log('='.repeat(60));
        
        // Simular dados raw típicos da API (baseado no que sabemos dos problemas)
        const dadosRaw = {
            // IDENTIFICAÇÃO BÁSICA
            nome_fantasia: "COOPERATIVA CENTRAL AGROCOMMERCIAL", 
            razao_social: "COOPERATIVA CENTRAL AGROCOMMERCIAL",
            cnpj: "02.617.552/0001-30",
            codigo: 1001,
            grupo: "Grupo C.Agri",
            
            // DATA (formato americano problemático)
            inicio_contrato: "2025-01-09", // MM/DD trocados
            
            // CONTATOS (desalinhados)
            contato_principal_nome: "", // ❌ VAZIO
            contato_principal_cargo: "João Silva", // ❌ NOME aqui
            contato_principal_email: "Gerente Comercial", // ❌ CARGO aqui
            contato_principal_celular: "joao@cagri.com.br", // ❌ EMAIL aqui
            
            // PLANO/SLA (trocados)
            plano_contratado: "(11) 98765-4321", // ❌ CELULAR aqui
            sla: "Plano Premium", // ❌ PLANO aqui
            
            // SERVIÇOS BPO (não detecta "10 horas úteis")
            bpo_contabil: "10 horas úteis", // ❌ NÃO É "Sim"
            bpo_fiscal: "Sim",
            bpo_folha: "Não", 
            bpo_financeiro: "Sim",
            bpo_rh: "20 horas mensais", // ❌ NÃO É "Sim"
            bpo_cnd: "Sim",
            
            // VALORES
            vl_bpo_contabil: "R$ 2.500,00",
            vl_bpo_fiscal: "R$ 1.800,00",
            vl_bpo_rh: "R$ 3.200,00",
            
            // OBSERVAÇÕES (mapeamento incorreto)
            observacao_closer: "", // ❌ VAZIO
            motivo_troca: "Cliente migrou de outro escritório por insatisfação com atendimento", // ❌ CONTEÚDO aqui
            
            // OUTROS CAMPOS TÍPICOS
            faturamento_anual: "R$ 12.500.000,00",
            sistema_contabil: "Domínio",
            sistema_fiscal: "Domínio",
            sistema_folha: "Folha Online",
            regime_tributario_atual: "Lucro Presumido",
            closer: "Ana Silva",
            prospector: "Carlos Santos"
        };
        
        console.log('🗂️  ESTRUTURA BRUTA DOS DADOS:');
        console.log('-'.repeat(40));
        
        // Mostrar todos os campos organizados por categoria
        const categorias = {
            'IDENTIFICAÇÃO': [
                'nome_fantasia', 'razao_social', 'cnpj', 'codigo', 'grupo'
            ],
            'DATAS': [
                'inicio_contrato'
            ],
            'CONTATOS (PROBLEMA: DESALINHADOS)': [
                'contato_principal_nome', 'contato_principal_cargo', 
                'contato_principal_email', 'contato_principal_celular'
            ],
            'PLANO/SLA (PROBLEMA: TROCADOS)': [
                'plano_contratado', 'sla'
            ],
            'SERVIÇOS BPO (PROBLEMA: NÃO DETECTA VALORES ≠ "Sim")': [
                'bpo_contabil', 'bpo_fiscal', 'bpo_folha', 
                'bpo_financeiro', 'bpo_rh', 'bpo_cnd'
            ],
            'VALORES MONETÁRIOS': [
                'vl_bpo_contabil', 'vl_bpo_fiscal', 'vl_bpo_rh', 'faturamento_anual'
            ],
            'OBSERVAÇÕES (PROBLEMA: MAPEAMENTO INCORRETO)': [
                'observacao_closer', 'motivo_troca'
            ],
            'SISTEMAS': [
                'sistema_contabil', 'sistema_fiscal', 'sistema_folha'
            ],
            'COMERCIAL': [
                'closer', 'prospector', 'regime_tributario_atual'
            ]
        };
        
        Object.entries(categorias).forEach(([categoria, campos]) => {
            console.log(`\n📂 ${categoria}:`);
            campos.forEach(campo => {
                const valor = dadosRaw[campo] || '(vazio)';
                const status = valor === '(vazio)' ? '❌' : 
                             valor === 'Não' ? '⚪' : 
                             valor === 'Sim' ? '✅' : '📝';
                console.log(`   ${status} ${campo}: "${valor}"`);
            });
        });
        
        console.log('\n' + '='.repeat(60));
        console.log('🔍 PROBLEMAS IDENTIFICADOS:');
        console.log('1. ❌ CONTATOS: campos deslocados (nome→cargo→email→celular)');
        console.log('2. ❌ PLANO/SLA: valores trocados (celular no plano, plano no SLA)');
        console.log('3. ❌ SERVIÇOS: só detecta "Sim", ignora "10 horas úteis", "20 horas mensais"');
        console.log('4. ❌ OBSERVAÇÃO: motivo_troca tem conteúdo, observacao_closer vazio');
        console.log('5. ❌ DATA: formato americano MM/DD pode ser interpretado incorretamente');
        
        console.log('\n✅ MAPEAMENTO ESPERADO APÓS CORREÇÃO:');
        console.log('📞 CONTATOS CORRETOS:');
        console.log('   ✅ Nome: "João Silva"');
        console.log('   ✅ Cargo: "Gerente Comercial"');
        console.log('   ✅ Email: "joao@cagri.com.br"');
        console.log('   ✅ Celular: "(11) 98765-4321"');
        
        console.log('\n📋 PLANO/SLA CORRETOS:');
        console.log('   ✅ Plano: "Plano Premium"');
        console.log('   ✅ SLA: "Conforme necessidade"');
        
        console.log('\n🛠️  SERVIÇOS DETECTADOS (LÓGICA MELHORADA):');
        console.log('   ✅ BPO Contábil: "10 horas úteis" → DEVERIA SER DETECTADO');
        console.log('   ✅ BPO Fiscal: "Sim" → DETECTADO');
        console.log('   ✅ BPO RH: "20 horas mensais" → DEVERIA SER DETECTADO');
        console.log('   ✅ BPO Financeiro: "Sim" → DETECTADO');
        
        console.log('\n📝 OBSERVAÇÃO CORRETA:');
        console.log('   ✅ Observação Closer: "Cliente migrou de outro escritório por insatisfação com atendimento"');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

mostrarMapeamentoRaw();