const searchService = require('./src/services/planilha-search.service');

async function testFixedACX() {
    try {
        console.log('🔍 Testando pesquisa corrigida de ACX...\n');
        
        console.log('1️⃣ Saída de Clientes (header corrigido para linha 2):');
        const saidaResult = await searchService.pesquisaGrupoSaida('ACX');
        console.log('   📊 Resultado:', JSON.stringify(saidaResult, null, 2));
        
        if (saidaResult.success && saidaResult.rows && saidaResult.rows.length > 0) {
            console.log('\n✅ Agora vamos testar a geração do Excel...');
            
            const xlsxSaidaService = require('./src/services/xlsx-saida-generator.service');
            const result = await xlsxSaidaService.generateSaidaGrupoReport('ACX');
            console.log('📊 Excel gerado:', result);
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
    }
}

testFixedACX();
