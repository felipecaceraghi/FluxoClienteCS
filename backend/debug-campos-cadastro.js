const { parseSheet } = require('./src/services/planilha-parser.service');
const path = require('path');

async function verificarCamposCadastro() {
    try {
        const filePath = path.join(__dirname, 'src', 'storage', 'sharepoint-files', 'Cadastro_de_Clientes_v1.xlsm');
        const rows = parseSheet(filePath, 5, 'Clientes');

        if (rows.length === 0) {
            console.log('❌ Nenhuma linha encontrada na planilha');
            return;
        }

        console.log('🔍 Procurando especificamente pelos códigos mencionados pelo usuário:');
        console.log('   Código 2634 - Esperado: Tap Tap Perdizes, CNPJ: 426345730001171');
        console.log('   Código 2635 - Esperado: Inventcloud Tecnologia, CNPJ: 263557070001041');

        let encontrou2634 = false;
        let encontrou2635 = false;

        rows.forEach((row, index) => {
            const codigo = row['Código Domínio'];
            if (codigo) {
                if (String(codigo).trim() === '2634') {
                    encontrou2634 = true;
                    console.log(`\n✅ Código 2634 encontrado na linha ${index + 1}:`);
                    console.log(`   Nome Fantasia: ${row['Nome Fantasia'] || 'N/A'}`);
                    console.log(`   Razão Social: ${row['Razão Social'] || 'N/A'}`);
                    console.log(`   CNPJ: ${row['CNPJ'] || 'N/A'}`);
                    console.log(`   Código Domínio: ${codigo}`);
                } else if (String(codigo).trim() === '2635') {
                    encontrou2635 = true;
                    console.log(`\n✅ Código 2635 encontrado na linha ${index + 1}:`);
                    console.log(`   Nome Fantasia: ${row['Nome Fantasia'] || 'N/A'}`);
                    console.log(`   Razão Social: ${row['Razão Social'] || 'N/A'}`);
                    console.log(`   CNPJ: ${row['CNPJ'] || 'N/A'}`);
                    console.log(`   Código Domínio: ${codigo}`);
                }
            }
        });

        if (!encontrou2634) {
            console.log('\n❌ Código 2634 NÃO encontrado na planilha!');
        }
        if (!encontrou2635) {
            console.log('\n❌ Código 2635 NÃO encontrado na planilha!');
        }

        // Procurar pelas empresas mencionadas pelo nome
        console.log('\n🔍 Procurando pelas empresas mencionadas pelo nome:');
        rows.forEach((row, index) => {
            const nomeFantasia = row['Nome Fantasia'];
            const razaoSocial = row['Razão Social'];
            const cnpj = row['CNPJ'];

            if (nomeFantasia && nomeFantasia.toLowerCase().includes('tap tap')) {
                console.log(`\n📍 Empresa "Tap Tap" encontrada na linha ${index + 1}:`);
                console.log(`   Nome Fantasia: ${nomeFantasia}`);
                console.log(`   Razão Social: ${razaoSocial}`);
                console.log(`   CNPJ: ${cnpj}`);
                console.log(`   Código Domínio: ${row['Código Domínio']}`);
            }

            if (nomeFantasia && nomeFantasia.toLowerCase().includes('inventcloud')) {
                console.log(`\n📍 Empresa "Inventcloud" encontrada na linha ${index + 1}:`);
                console.log(`   Nome Fantasia: ${nomeFantasia}`);
                console.log(`   Razão Social: ${razaoSocial}`);
                console.log(`   CNPJ: ${cnpj}`);
                console.log(`   Código Domínio: ${row['Código Domínio']}`);
            }
        });

    } catch (error) {
        console.error('❌ Erro ao verificar campos:', error.message);
    }
}

verificarCamposCadastro();