const companyService = require('./src/services/company.service');

async function testEmpresas() {
    const codigos = ['2634', '2635'];

    for (const codigo of codigos) {
        try {
            console.log(`\n🔍 Testando empresa código: ${codigo}`);
            const result = await companyService.getCompanyCompleteData(codigo);

            if (result.success) {
                const data = result.data;
                console.log(`✅ Empresa encontrada:`);
                console.log(`   Nome Fantasia: ${data.nome_fantasia || 'N/A'}`);
                console.log(`   Razão Social: ${data.razao_social || 'N/A'}`);
                console.log(`   CNPJ: ${data.cnpj || 'N/A'}`);
                console.log(`   Código Sistema: ${data.codigo_sistema || data.codigo || 'N/A'}`);
                console.log(`   Vigência Inicial: ${data.vigencia_inicial || 'N/A'}`);
                console.log(`   Source: ${result.source}`);
            } else {
                console.log(`❌ Erro: ${result.error}`);
            }
        } catch (error) {
            console.log(`❌ Erro ao buscar empresa ${codigo}:`, error.message);
        }
    }
}

testEmpresas();