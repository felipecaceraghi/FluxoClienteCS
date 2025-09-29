const companyRepository = require('./src/repositories/company.repository');

async function checkDatabase() {
    try {
        console.log('🔍 Verificando códigos no banco de dados:');

        // Verificar códigos mencionados pelo usuário
        const codigosUsuario = ['2634', '2635'];
        for (const codigo of codigosUsuario) {
            const company = await companyRepository.findByCode(codigo);
            if (company) {
                console.log(`\n✅ Código ${codigo} no banco:`);
                console.log(`   Nome: ${company.nome || 'N/A'}`);
                console.log(`   Código: ${company.codigo}`);
            } else {
                console.log(`\n❌ Código ${codigo} NÃO encontrado no banco`);
            }
        }

        // Verificar códigos reais da planilha
        console.log('\n🔍 Verificando códigos reais da planilha:');
        const codigosReais = ['2112', '810'];
        for (const codigo of codigosReais) {
            const company = await companyRepository.findByCode(codigo);
            if (company) {
                console.log(`\n✅ Código ${codigo} no banco:`);
                console.log(`   Nome: ${company.nome || 'N/A'}`);
                console.log(`   Código: ${company.codigo}`);
            } else {
                console.log(`\n❌ Código ${codigo} NÃO encontrado no banco`);
            }
        }

    } catch (error) {
        console.error('Erro:', error.message);
    }
}

checkDatabase();