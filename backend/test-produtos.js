const planilhaSearchService = require('./src/services/planilha-search.service');

async function checkProdutosData() {
  try {
    console.log('🔍 Verificando dados na planilha de PRODUTOS...');

    // Testar busca na planilha de produtos
    const result = await planilhaSearchService.pesquisaClienteProdutos('2653');

    if (result.success && result.rows && result.rows.length > 0) {
      console.log('📊 Dados encontrados na planilha de produtos:');
      console.log('Total de linhas:', result.rows.length);

      // Mostrar campos da primeira linha
      const produtoRow = result.rows[0];
      console.log('\n🔍 Campos na planilha de PRODUTOS:');
      Object.keys(produtoRow).forEach(key => {
        const value = produtoRow[key];
        console.log(`${key}: ${value ? value.toString().substring(0, 50) : 'vazio'}`);
      });

      // Verificar campos importantes
      console.log('\n🔍 Campos importantes encontrados:');
      const importantFields = [
        'faturamento_anual', 'regime_tributario',
        'nf_entradas', 'nf_saidas', 'ctes_entrada', 'ctes_saida', 'nf_servicos_prestados', 'nf_servicos_tomados',
        'colab_clt', 'pro_labore', 'estagiarios', 'aprendizes', 'rpa', 'domesticas_clt',
        'sistema_contabil', 'sistema_folha', 'sistema_fiscal', 'sistema_financeiro',
        'deadline', 'atividade_especialidade',
        'closer', 'prospector'
      ];

      importantFields.forEach(field => {
        if (produtoRow[field] !== undefined) {
          console.log(`✅ ${field}: "${produtoRow[field]}"`);
        } else {
          console.log(`❌ ${field}: NÃO ENCONTRADO`);
        }
      });

    } else {
      console.log('❌ Não foi possível obter dados da planilha de produtos');
      console.log('Resultado:', result);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

checkProdutosData();
