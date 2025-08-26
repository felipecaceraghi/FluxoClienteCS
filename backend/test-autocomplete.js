const companyRepository = require('./src/repositories/company.repository');

async function testAutocomplete() {
    try {
        console.log('🔍 Testando sistema de autocomplete para grupos e nomes...\n');
        
        // Teste 1: Buscar por "tek" (deveria encontrar Teklamatik)
        console.log('1️⃣ Teste busca por "tek":');
        const result1 = await companyRepository.searchGroupsAndNames('tek', 10);
        console.log('   📊 Resultados:', JSON.stringify(result1, null, 2));
        
        // Teste 2: Buscar por "ACX"
        console.log('\n2️⃣ Teste busca por "ACX":');
        const result2 = await companyRepository.searchGroupsAndNames('ACX', 10);
        console.log('   📊 Resultados:', JSON.stringify(result2, null, 2));
        
        // Teste 3: Buscar por "grupo"
        console.log('\n3️⃣ Teste busca por "grupo":');
        const result3 = await companyRepository.searchGroupsAndNames('grupo', 10);
        console.log('   📊 Resultados:', JSON.stringify(result3, null, 2));
        
        // Teste 4: Busca geral ampliada
        console.log('\n4️⃣ Teste busca geral (todas as empresas):');
        const allResult = await companyRepository.search('', 1, 10);
        console.log('   📊 Total encontrado:', allResult.companies.length);
        console.log('   📊 Primeiras 3:', allResult.companies.slice(0, 3).map(c => ({
            codigo: c.codigo,
            nome: c.nome,
            grupo: c.grupo
        })));
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

testAutocomplete().then(() => {
    console.log('\n✅ Teste concluído!');
    process.exit(0);
}).catch(err => {
    console.error('💥 Erro:', err);
    process.exit(1);
});
