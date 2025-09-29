const companyService = require('./src/services/company.service');

async function testExpandedMapping() {
  try {
    console.log('🔍 Testando mapeamento expandido dos dados...');

    const result = await companyService.getCompanyCompleteData('2653');

    if (result.success) {
      console.log('✅ Dados obtidos com sucesso');
      console.log('Fonte:', result.data.source);

      // Verificar campos que antes estavam vazios
      const fieldsToCheck = [
        { field: 'faturamento_anual', label: 'Faturamento Anual' },
        { field: 'nf_entradas', label: 'NF Entradas' },
        { field: 'nf_saidas', label: 'NF Saídas' },
        { field: 'nf_servicos_prestados', label: 'NF Serviços Prestados' },
        { field: 'pro_labore', label: 'Pró-labore' },
        { field: 'estagiarios', label: 'Estagiários' },
        { field: 'aprendizes', label: 'Aprendizes' },
        { field: 'domesticas_clt', label: 'Domésticas CLT' },
        { field: 'sistema_contabil', label: 'Sistema Contábil' },
        { field: 'sistema_folha', label: 'Sistema Folha' },
        { field: 'sistema_fiscal', label: 'Sistema Fiscal' },
        { field: 'sistema_financeiro', label: 'Sistema Financeiro' },
        { field: 'sla', label: 'SLA' },
        { field: 'bpo_rh', label: 'BPO RH' },
        { field: 'bpo_cnd', label: 'BPO CND' },
        { field: 'vl_bpo_contabil', label: 'Valor BPO Contábil' },
        { field: 'vl_bpo_fiscal', label: 'Valor BPO Fiscal' },
        { field: 'vl_bpo_folha', label: 'Valor BPO Folha' },
        { field: 'vl_bpo_legal', label: 'Valor BPO Legal' },
        { field: 'honorario_mensal_total', label: 'Honorário Total' },
        { field: 'implantacao', label: 'Implantação' },
        { field: 'bpo_contabil_faturado', label: 'BPO Contábil Faturado' },
        { field: 'bpo_fiscal_faturado', label: 'BPO Fiscal Faturado' },
        { field: 'bpo_folha_faturado', label: 'BPO Folha Faturado' },
        { field: 'bpo_legal_faturado', label: 'BPO Legal Faturado' },
        { field: 'closer', label: 'Closer' },
        { field: 'prospector', label: 'Prospector' }
      ];

      console.log('\n📊 Campos verificados:');
      fieldsToCheck.forEach(({ field, label }) => {
        const value = result.data[field];
        const status = value !== undefined && value !== null && value !== '' ? '✅' : '❌';
        console.log(`${status} ${label}: ${value || 'VAZIO'}`);
      });

      // Verificar campos que ainda estão faltando
      const stillMissing = [
        'contato_principal_nome', 'contato_principal_cargo',
        'contato_principal_email', 'contato_principal_celular',
        'regime_tributario_atual', 'ctes_entrada', 'ctes_saida',
        'nf_servicos_tomados', 'colab_clt', 'rpa'
      ];

      console.log('\n❓ Campos que ainda podem estar faltando:');
      stillMissing.forEach(field => {
        const value = result.data[field];
        console.log(`- ${field}: ${value || 'VAZIO'}`);
      });

    } else {
      console.log('❌ Erro ao obter dados:', result.error);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testExpandedMapping();