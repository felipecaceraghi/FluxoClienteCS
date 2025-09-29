const xlsxGeneratorService = require('./src/services/xlsx-generator.service');
const companyService = require('./src/services/company.service');
const downloadService = require('./src/services/saida-clientes-download.service');

async function test() {
    try {
        console.log('🔍 Testando busca de dados completos com download prévio...');

        // Primeiro baixar as planilhas do SharePoint
        console.log('📥 Baixando planilhas do SharePoint...');
        const downloads = await Promise.allSettled([
            downloadService.downloadCadastroClientesPlanilha(),
            downloadService.downloadProdutosClientesPlanilha(),
            downloadService.downloadSaidaClientesPlanilha()
        ]);

        downloads.forEach((result, index) => {
            const files = ['Cadastro', 'Produtos', 'Saída'];
            if (result.status === 'fulfilled') {
                console.log(`✅ ${files[index]} baixada com sucesso`);
            } else {
                console.log(`❌ Erro ao baixar ${files[index]}:`, result.reason.message);
            }
        });

        // Buscar dados completos da empresa
        const result = await companyService.getCompanyCompleteData('1');
        console.log('Resultado da busca completa:', JSON.stringify(result, null, 2));

        if (!result.success) {
            console.log('❌ Empresa não encontrada');
            return;
        }

        console.log('✅ Empresa encontrada com dados completos');
        console.log('Fonte dos dados:', result.source);
        console.log('Campos disponíveis:', Object.keys(result.data));

        // Verificar campos importantes
        const importantFields = [
            'nome_fantasia', 'faturamento_anual', 'contato_principal_nome',
            'contato_principal_email', 'sistema_contabil', 'bpo_contabil'
        ];

        console.log('\n📋 Campos importantes:');
        importantFields.forEach(field => {
            const value = result.data[field];
            console.log(`   ${field}: "${value || 'VAZIO'}"`);
        });

        // Gerar planilha individual
        const nomeFantasia = result.data.nome_fantasia || result.data.name || 'Empresa_Sem_Nome';
        const genResult = await xlsxGeneratorService.generateSpreadsheetByType(
            'Cliente_1_' + nomeFantasia.replace(/\s+/g, '_'),
            [result.data],
            'entrada'
        );

        console.log('✅ Planilha gerada:', genResult.fileName);
        console.log('📁 Caminho:', genResult.filePath);

    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
    }
}

test();