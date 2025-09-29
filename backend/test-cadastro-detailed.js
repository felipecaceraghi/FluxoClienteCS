const planilhaSearchService = require('./src/services/planilha-search.service');

async function checkCadastroFields() {
  try {
    console.log('🔍 Verificando TODOS os campos na planilha de CADASTRO...');

    // Testar busca na planilha de cadastro
    const result = await planilhaSearchService.pesquisaClienteCadastro('2653');

    if (result.success && result.rows && result.rows.length > 0) {
      const cadastroRow = result.rows[0];
      console.log('📊 Campos na planilha de CADASTRO:');
      console.log('Total de campos:', Object.keys(cadastroRow).length);

      // Mostrar TODOS os campos disponíveis
      Object.keys(cadastroRow).forEach(key => {
        const value = cadastroRow[key];
        console.log(`${key}: ${value ? `"${value.toString().substring(0, 50)}"` : 'VAZIO'}`);
      });

      // Verificar se campos importantes existem com nomes diferentes
      console.log('\n🔍 Verificando variações de nomes para campos importantes:');

      const fieldVariations = {
        contato: ['contato', 'contato_principal', 'nome_contato', 'responsavel'],
        cargo: ['cargo', 'cargo_contato', 'funcao', 'posicao'],
        email: ['email', 'email_contato', 'e_mail', 'mail'],
        celular: ['celular', 'celular_contato', 'telefone', 'fone', 'tel'],
        faturamento: ['faturamento', 'faturamento_anual', 'receita', 'receita_anual'],
        regime: ['regime', 'regime_tributario', 'tributario'],
        nf_entradas: ['nf_entradas', 'entradas', 'nf_entrada'],
        nf_saidas: ['nf_saidas', 'saidas', 'nf_saida'],
        funcionarios: ['funcionarios', 'funcionarios_clt', 'clt', 'colaboradores'],
        sistema_contabil: ['sistema_contabil', 'contabil', 'erp_contabil'],
        sistema_folha: ['sistema_folha', 'folha', 'erp_folha'],
        sistema_fiscal: ['sistema_fiscal', 'fiscal', 'erp_fiscal'],
        deadline: ['deadline', 'prazo', 'vencimento'],
        cnae: ['cnae', 'atividade', 'atividade_economica'],
        closer: ['closer', 'fechador', 'vendedor'],
        prospector: ['prospector', 'prospectador', 'captador']
      };

      Object.keys(fieldVariations).forEach(fieldType => {
        console.log(`\n${fieldType.toUpperCase()}:`);
        fieldVariations[fieldType].forEach(variation => {
          if (cadastroRow[variation] !== undefined) {
            console.log(`  ✅ "${variation}": "${cadastroRow[variation]}"`);
          }
        });
      });

    } else {
      console.log('❌ Não foi possível obter dados da planilha de cadastro');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

checkCadastroFields();