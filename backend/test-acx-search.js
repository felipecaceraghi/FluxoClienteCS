const searchService = require('./src/services/planilha-search.service');

async function testACX() {
    try {
        console.log('🔍 Testando pesquisa de ACX em cada planilha...\n');
        
        console.log('1️⃣ Saída de Clientes:');
        const saidaResult = await searchService.pesquisaGrupoSaida('ACX');
        console.log('   📊 Resultado:', JSON.stringify(saidaResult, null, 2));
        
        console.log('\n2️⃣ Cadastro de Clientes:');
        const cadastroResult = await searchService.pesquisaGrupoCadastro('ACX');
        console.log('   📊 Resultado:', JSON.stringify(cadastroResult, null, 2));
        
        console.log('\n3️⃣ Produtos dos Clientes:');
        const produtosResult = await searchService.pesquisaGrupoProdutos('ACX');
        console.log('   📊 Resultado:', JSON.stringify(produtosResult, null, 2));
        
        console.log('\n🔗 Pesquisa Agregada:');
        const allResult = await searchService.pesquisaGrupoAll('ACX');
        console.log('   📊 Resultado:', JSON.stringify(allResult, null, 2));
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
    }
}

testACX();
