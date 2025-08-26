const searchService = require('./src/services/planilha-search.service');
const xlsxSaidaService = require('./src/services/xlsx-saida-generator.service');

async function testSaidaGeneration() {
    try {
        console.log('🔍 Testando pesquisa de grupo ACX...');
        const searchResult = await searchService.pesquisaGrupoAll('ACX');
        console.log('✅ Resultado da pesquisa:', JSON.stringify(searchResult, null, 2));
        
        if (searchResult.success) {
            console.log('\n📊 Gerando planilha de saída para ACX...');
            const result = await xlsxSaidaService.generateSaidaGrupoReport('ACX');
            console.log('✅ Planilha gerada:', result);
        } else {
            console.log('❌ Grupo ACX não encontrado ou não presente em todas as planilhas');
            console.log('📝 Planilhas faltando:', searchResult.missing);
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
    }
}

testSaidaGeneration();
