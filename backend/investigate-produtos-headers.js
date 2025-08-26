const xlsx = require('xlsx');
const path = require('path');

async function investigateProdutosHeaders() {
    try {
        console.log('🔍 Investigando headers da planilha de produtos...\n');
        
        const filePath = path.join(__dirname, 'src/storage/sharepoint-files/Produtos_dos_Clientes_v1.xlsm');
        console.log('📁 Arquivo:', filePath);
        
        const workbook = xlsx.readFile(filePath);
        console.log('📄 Sheets disponíveis:', workbook.SheetNames);
        
        const sheet = workbook.Sheets['Produtos por Cliente'];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: null });
        
        console.log('\n📊 Primeiras 10 linhas da planilha:');
        for (let i = 0; i < Math.min(10, rows.length); i++) {
            console.log(`Linha ${i + 1}:`, rows[i]);
        }
        
        console.log('\n🎯 Analisando possíveis headers:');
        for (let i = 0; i < Math.min(10, rows.length); i++) {
            const row = rows[i];
            const hasHeaders = row && row.some(cell => 
                cell && typeof cell === 'string' && 
                (cell.toLowerCase().includes('codigo') || 
                 cell.toLowerCase().includes('nome') || 
                 cell.toLowerCase().includes('grupo') ||
                 cell.toLowerCase().includes('produto') ||
                 cell.toLowerCase().includes('cliente'))
            );
            
            if (hasHeaders) {
                console.log(`✅ Linha ${i + 1} parece ser header:`, row);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

investigateProdutosHeaders();
