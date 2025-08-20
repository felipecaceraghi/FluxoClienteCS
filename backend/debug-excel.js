const excelService = require('./src/services/excel.service');
const path = require('path');

async function debugExcel() {
    try {
        console.log('🔍 Debugando processamento do Excel...\n');
        
        // Caminho do último arquivo baixado
        const downloadPath = path.join(__dirname, 'src/storage/sharepoint-files');
        const fs = require('fs');
        
        const files = fs.readdirSync(downloadPath)
            .filter(file => file.endsWith('.xlsm'))
            .map(file => ({
                name: file,
                path: path.join(downloadPath, file),
                stats: fs.statSync(path.join(downloadPath, file))
            }))
            .sort((a, b) => b.stats.mtime - a.stats.mtime);
        
        if (files.length === 0) {
            console.log('❌ Nenhum arquivo Excel encontrado');
            return;
        }
        
        const latestFile = files[0];
        console.log('📁 Arquivo mais recente:', latestFile.name);
        
        // Ler arquivo diretamente
        const rawData = excelService.readExcelFile(latestFile.path);
        
        console.log('\n=== DADOS BRUTOS ===');
        console.log('Primeiras 10 linhas:');
        for (let i = 0; i < Math.min(10, rawData.length); i++) {
            console.log(`Linha ${i + 1}:`, rawData[i]);
        }
        
        console.log('\n=== HEADER (Linha 5) ===');
        if (rawData[4]) {
            console.log('Header:', rawData[4]);
        }
        
        console.log('\n=== PRIMEIRA LINHA DE DADOS (Linha 6) ===');
        if (rawData[5]) {
            console.log('Dados:', rawData[5]);
            console.log('Coluna A (index 0):', rawData[5][0]);
            console.log('Coluna B (index 1):', rawData[5][1]);
            console.log('Coluna C (index 2):', rawData[5][2]);
        }
        
        console.log('\n=== PROCESSAMENTO ===');
        const companies = await excelService.parseCompaniesData(latestFile.path);
        
        console.log('\nPrimeiras 5 empresas processadas:');
        companies.slice(0, 5).forEach((company, index) => {
            console.log(`${index + 1}. Código: "${company.codigo}" | Nome: "${company.nome}" | Grupo: "${company.grupo}"`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

debugExcel();
