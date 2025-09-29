const companyService = require('./src/services/company.service');

async function testarBusca() {
    try {
        console.log('Testando busca de empresas por codigo...');

        const codigos = ['2112', '810'];

        for (const codigo of codigos) {
            console.log(`\nBuscando empresa com codigo ${codigo}:`);

            const empresa = await companyService.getCompanyCompleteData(codigo);

            if (empresa) {
                console.log(`   Empresa encontrada:`);
                console.log(`      Nome: ${empresa.nome_fantasia}`);
                console.log(`      Codigo: ${empresa.codigo}`);
                console.log(`      Grupo: ${empresa.grupo}`);
            } else {
                console.log(`   Empresa nao encontrada`);
            }
        }

    } catch (error) {
        console.error('Erro no teste:', error.message);
    }
}

testarBusca();