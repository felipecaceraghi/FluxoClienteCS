const searchService = require('./src/services/planilha-search.service');

async function testUpdatedDownload() {
    try {
        console.log('🔍 Testando download atualizado e busca...\n');
        
        console.log('1️⃣ Testando pesquisa que deve baixar planilhas automaticamente:');
        const start = Date.now();
        const result = await searchService.pesquisaGrupoSaida('ACX');
        const end = Date.now();
        
        console.log(`   ⏱️  Tempo de execução: ${end - start}ms`);
        console.log('   📊 Resultado:', JSON.stringify(result, null, 2));
        
        if (result.success && result.rows && result.rows.length > 0) {
            console.log('\n✅ Dados recebidos com novos campos:');
            result.rows.forEach((row, index) => {
                console.log(`   Empresa ${index + 1}:`);
                console.log(`   - Código: ${row.codigo}`);
                console.log(`   - Nome: ${row.nome}`);
                console.log(`   - Grupo: ${row.grupo}`);
                console.log(`   - Última Competência: ${row.ultima_competencia}`);
                console.log(`   - Motivo Saída: ${row.motivo_saida}`);
                console.log(`   - Observações: ${row.observacoes}`);
                console.log(`   - Campos extras:`, Object.keys(row.extra || {}));
                console.log('');
            });
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
    }
}

testUpdatedDownload();
