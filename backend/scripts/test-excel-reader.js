#!/usr/bin/env node

// Script para testar a leitura da planilha Excel
// Uso: node scripts/test-excel-reader.js

const path = require('path');
const fs = require('fs');

// Configurar caminho para o módulo
const projectRoot = path.join(__dirname, '..');
const excelReaderService = require('../src/services/excel-reader.service');

async function testExcelReader() {
    console.log('🧪 Testando ExcelReaderService...\n');

    try {
        // 1. Ler dados da planilha
        console.log('📖 Lendo dados da aba "Clientes"...');
        const result = await excelReaderService.readClientesSheet();

        console.log('\n✅ Dados extraídos com sucesso!');
        console.log(`📄 Arquivo: ${result.fileName}`);
        console.log(`📋 Aba: ${result.sheetName}`);
        console.log(`📊 Total de registros: ${result.totalRows}`);
        console.log(`📝 Cabeçalhos: ${result.headers.length} colunas`);

        // 2. Mostrar cabeçalhos
        console.log('\n📋 Cabeçalhos encontrados:');
        result.headers.forEach((header, index) => {
            console.log(`  ${index + 1}. ${header || '(vazio)'}`);
        });

        // 3. Mostrar primeiros registros
        console.log('\n📊 Primeiros 3 registros:');
        result.clients.slice(0, 3).forEach((client, index) => {
            console.log(`\n--- Registro ${index + 1} ---`);
            Object.keys(client).forEach(key => {
                if (key !== '_rowIndex') {
                    console.log(`  ${key}: ${client[key]}`);
                }
            });
        });

        // 4. Analisar estrutura dos dados
        console.log('\n🔍 Analisando estrutura dos dados...');
        const analysis = await excelReaderService.analyzeDataStructure(result.clients);

        console.log('\n📈 Análise dos campos:');
        analysis.fields.forEach(field => {
            console.log(`\n📌 Campo: "${field.field}"`);
            console.log(`  └─ Preenchimento: ${field.fillRate} (${field.totalValues}/${field.totalValues + field.nullValues})`);
            console.log(`  └─ Valores únicos: ${field.uniqueValues}`);
            console.log(`  └─ Tipos: ${field.dataTypes.join(', ')}`);
            console.log(`  └─ Exemplos: ${field.samples.slice(0, 3).join(', ')}`);
        });

        // 5. Salvar em arquivo JSON
        console.log('\n💾 Salvando dados em arquivo JSON...');
        const saveResult = await excelReaderService.saveToJsonFile(result);
        console.log(`✅ Arquivo salvo: ${saveResult.fileName}`);

        console.log('\n🎉 Teste concluído com sucesso!');
        
        return {
            success: true,
            data: result,
            analysis,
            jsonFile: saveResult.fileName
        };

    } catch (error) {
        console.error('\n❌ Erro durante o teste:');
        console.error(error.message);
        console.error('\nStack trace:');
        console.error(error.stack);
        
        return {
            success: false,
            error: error.message
        };
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    testExcelReader()
        .then(result => {
            if (result.success) {
                console.log('\n✅ Script executado com sucesso!');
                process.exit(0);
            } else {
                console.log('\n❌ Script falhou!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 Erro não tratado:', error);
            process.exit(1);
        });
}

module.exports = testExcelReader;
