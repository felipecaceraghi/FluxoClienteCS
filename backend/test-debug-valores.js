const path = require('path');
const excelService = require('./src/services/excel.service');
const xlsxService = require('./src/services/xlsx-generator.service');

console.log('🔍 Testando diretamente com arquivo local...');

async function testeDebugHonorarios() {
    try {
        // Usar arquivo mais recente
        const filePath = path.join(__dirname, 'src/storage/sharepoint-files/Clientes_2025-08-24T20-22-01-534Z.xlsm');
        console.log('📁 Usando arquivo:', filePath);
        
        // Extrair dados completos
        const allCompanies = await excelService.parseFullCompanyData(filePath);
        console.log('📊 Total de empresas na planilha:', allCompanies.length);
        
        // Filtrar por Teklamatik
        const teklamatikCompanies = allCompanies.filter(company => {
            const companyGroup = company.grupo ? company.grupo.toLowerCase().trim() : '';
            return companyGroup.includes('teklamatik');
        });
        
        console.log('🏢 Empresas do grupo Teklamatik:', teklamatikCompanies.length);
        
        if (teklamatikCompanies.length > 0) {
            console.log('\n=== DADOS DAS EMPRESAS ===');
            teklamatikCompanies.forEach((company, index) => {
                console.log(`\n📋 Empresa ${index + 1}: ${company.nome_fantasia}`);
                console.log(`  • bpo_cnd: "${company.bpo_cnd}" (${typeof company.bpo_cnd})`);
                console.log(`  • vl_bpo_legal: "${company.vl_bpo_legal}" (${typeof company.vl_bpo_legal})`);
                console.log(`  • bpo_contabil: "${company.bpo_contabil}" (${typeof company.bpo_contabil})`);
                console.log(`  • vl_bpo_contabil: "${company.vl_bpo_contabil}" (${typeof company.vl_bpo_contabil})`);
                console.log(`  • honorario_mensal_total: "${company.honorario_mensal_total}" (${typeof company.honorario_mensal_total})`);
                console.log(`  • vl_implantacao: "${company.vl_implantacao}" (${typeof company.vl_implantacao})`);
            });
            
            // Agora testar a geração da planilha diretamente
            console.log('\n🔄 Gerando planilha de honorários...');
            const result = await xlsxService.generateSpreadsheetByType('Teklamatik', 'cobranca', teklamatikCompanies);
            console.log('✅ Planilha gerada:', result.data.fileName);
        } else {
            console.log('❌ Nenhuma empresa encontrada para Teklamatik');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
    }
}

testeDebugHonorarios();
