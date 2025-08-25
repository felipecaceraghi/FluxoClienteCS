const path = require('path');
const excelService = require('./src/services/excel.service');
const XlsxGeneratorService = require('./src/services/xlsx-generator.service');
const CurrencyUtils = require('./src/utils/currency');

console.log('🔍 Testando função addHonorarios diretamente...');

async function testeAddHonorarios() {
    try {
        // Usar arquivo mais recente
        const filePath = path.join(__dirname, 'src/storage/sharepoint-files/Clientes_2025-08-24T20-22-01-534Z.xlsm');
        
        // Extrair dados completos
        const allCompanies = await excelService.parseFullCompanyData(filePath);
        
        // Filtrar por Teklamatik
        const teklamatikCompanies = allCompanies.filter(company => {
            const companyGroup = company.grupo ? company.grupo.toLowerCase().trim() : '';
            return companyGroup.includes('teklamatik');
        });
        
        console.log('🏢 Empresas do grupo Teklamatik:', teklamatikCompanies.length);
        
        // Testar CurrencyUtils com valores reais
        console.log('\n=== TESTE CURRENCY UTILS ===');
        const exemploValores = [
            'R$ 325.00',
            'R$ 1,372.56',
            'R$ 2,841.36',
            'R$ 0.00'
        ];
        
        exemploValores.forEach(valor => {
            const resultado = CurrencyUtils.processForSpreadsheet(valor);
            console.log(`"${valor}" → ${resultado} (${typeof resultado})`);
        });
        
        // Criar instância do serviço
        const xlsxService = new XlsxGeneratorService();
        
        // Chamar addHonorarios diretamente
        console.log('\n🔄 Testando addHonorarios diretamente...');
        xlsxService.addHonorarios(teklamatikCompanies.slice(0, 3)); // Pegar apenas 3 empresas para teste
        
        console.log('✅ Função addHonorarios executada com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
    }
}

testeAddHonorarios();
