const { parseSheet } = require('./src/services/planilha-parser.service');
const path = require('path');

async function verificarCamposCodigo() {
    try {
        const filePath = path.join(__dirname, 'src', 'storage', 'sharepoint-files', 'Cadastro_de_Clientes_v1.xlsm');
        const rows = parseSheet(filePath, 5, 'Clientes');

        console.log('🔍 Verificando campos de código na planilha:');

        // Pegar apenas as primeiras 10 linhas para ver os headers e alguns dados
        const sampleRows = rows.slice(0, 10);

        console.log('\n📊 Headers e primeiras linhas:');
        sampleRows.forEach((row, index) => {
            console.log(`Linha ${index + 6}:`, {
                'Código Domínio': row['Código Domínio'],
                'Nome Fantasia': row['Nome Fantasia'],
                'Razão Social': row['Razão Social'],
                'CNPJ': row['CNPJ']
            });
        });

        console.log('\n🔍 Procurando por outros campos que podem conter códigos:');

        // Verificar se há outros campos que contenham números que podem ser códigos
        const possibleCodeFields = [];
        const firstRow = rows[0];

        for (const [key, value] of Object.entries(firstRow)) {
            if (key.toLowerCase().includes('codigo') || key.toLowerCase().includes('code')) {
                possibleCodeFields.push(key);
            }
        }

        console.log('Campos que podem conter códigos:', possibleCodeFields);

        // Verificar especificamente as empresas que o usuário quer
        console.log('\n🔍 Verificando dados completos das empresas específicas:');

        const empresasBuscadas = ['Tap Tap Perdizes', 'Inventcloud Tecnologia'];

        empresasBuscadas.forEach(empresa => {
            const empresaData = rows.find(row => row['Nome Fantasia'] === empresa);
            if (empresaData) {
                console.log(`\nEmpresa "${empresa}":`);
                // Mostrar todos os campos que podem conter códigos
                const codeFields = Object.entries(empresaData).filter(([key, value]) =>
                    key.toLowerCase().includes('codigo') ||
                    key.toLowerCase().includes('code') ||
                    (typeof value === 'string' && /^\d+$/.test(value) && value.length >= 3)
                );

                codeFields.forEach(([field, value]) => {
                    console.log(`  ${field}: ${value}`);
                });
            } else {
                console.log(`\nEmpresa "${empresa}": NÃO ENCONTRADA`);
            }
        });

    } catch (error) {
        console.error('Erro:', error.message);
    }
}

verificarCamposCodigo();