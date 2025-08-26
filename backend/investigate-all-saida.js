const xlsx = require('xlsx');
const path = require('path');

async function investigateAllSaidaColumns() {
    try {
        console.log('🔍 Investigando TODAS as colunas da planilha de saída...\n');
        
        const filePath = path.join(__dirname, 'src/storage/sharepoint-files/Saida_de_Clientes.xlsx');
        console.log('📁 Arquivo:', filePath);
        
        const workbook = xlsx.readFile(filePath);
        console.log('📄 Sheets disponíveis:', workbook.SheetNames);
        
        const sheet = workbook.Sheets['Base de Dados'];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: null });
        
        console.log('\n📊 Headers completos da linha 2:');
        const headers = rows[1]; // Linha 2 (índice 1)
        headers.forEach((header, index) => {
            if (header) {
                console.log(`Coluna ${index + 1}: "${header}"`);
            }
        });
        
        console.log('\n🔍 Procurando por campos relacionados a "motivo":');
        headers.forEach((header, index) => {
            if (header && header.toLowerCase().includes('motivo')) {
                console.log(`✅ ENCONTRADO - Coluna ${index + 1}: "${header}"`);
            }
        });
        
        console.log('\n📋 Dados de exemplo (primeiras 3 empresas):');
        for (let i = 2; i < Math.min(5, rows.length); i++) {
            console.log(`\nEmpresa ${i - 1}:`);
            const row = rows[i];
            headers.forEach((header, index) => {
                if (header && row[index]) {
                    console.log(`  ${header}: ${row[index]}`);
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

investigateAllSaidaColumns();
