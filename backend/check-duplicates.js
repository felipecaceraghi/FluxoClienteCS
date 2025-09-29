const { parseSheet } = require('./src/services/planilha-parser.service');
const path = require('path');

async function verificarDuplicatas() {
    try {
        const filePath = path.join(__dirname, 'src', 'storage', 'sharepoint-files', 'Cadastro_de_Clientes_v1.xlsm');
        const rows = parseSheet(filePath, 5, 'Clientes');

        console.log('🔍 Verificando duplicatas de códigos na planilha:');

        const codigosMap = new Map();
        const nomesMap = new Map();

        rows.forEach((row, index) => {
            const codigo = row['Código Domínio'];
            const nomeFantasia = row['Nome Fantasia'];

            if (codigo) {
                if (!codigosMap.has(codigo)) {
                    codigosMap.set(codigo, []);
                }
                codigosMap.get(codigo).push({ linha: index + 1, nome: nomeFantasia });
            }

            if (nomeFantasia) {
                if (!nomesMap.has(nomeFantasia)) {
                    nomesMap.set(nomeFantasia, []);
                }
                nomesMap.get(nomeFantasia).push({ linha: index + 1, codigo: codigo });
            }
        });

        console.log('\n📊 Códigos duplicados:');
        let hasDuplicates = false;
        for (const [codigo, ocorrencias] of codigosMap) {
            if (ocorrencias.length > 1) {
                hasDuplicates = true;
                console.log(`Código ${codigo}:`);
                ocorrencias.forEach(oc => {
                    console.log(`  - Linha ${oc.linha}: ${oc.nome}`);
                });
            }
        }

        if (!hasDuplicates) {
            console.log('Nenhum código duplicado encontrado.');
        }

        console.log('\n🔍 Verificando empresas específicas:');
        const empresasBuscadas = ['Tap Tap Perdizes', 'Inventcloud Tecnologia'];

        empresasBuscadas.forEach(empresa => {
            if (nomesMap.has(empresa)) {
                console.log(`\nEmpresa "${empresa}":`);
                nomesMap.get(empresa).forEach(oc => {
                    console.log(`  - Código: ${oc.codigo}, Linha: ${oc.linha}`);
                });
            } else {
                console.log(`\nEmpresa "${empresa}": NÃO ENCONTRADA`);
            }
        });

    } catch (error) {
        console.error('Erro:', error.message);
    }
}

verificarDuplicatas();