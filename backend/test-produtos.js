const searchService = require('./src/services/planilha-search.service');

async function testProdutos() {
    try {
        console.log('🔍 Testando pesquisa na planilha de produtos...\n');
        
        console.log('1️⃣ Produtos do grupo ACX:');
        const produtosResult = await searchService.pesquisaGrupoProdutos('ACX');
        console.log('   📊 Resultado:', JSON.stringify(produtosResult, null, 2));
        
        console.log('\n2️⃣ Produtos do grupo Autotechnik:');
        const autotechnikResult = await searchService.pesquisaGrupoProdutos('Autotechnik');
        console.log('   📊 Resultado:', JSON.stringify(autotechnikResult, null, 2));
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
    }
}

testProdutos();
