const xlsxSaidaService = require('../src/services/xlsx-saida-generator.service');

(async () => {
    try {
        console.log('Testando geração de relatório por grupo...');
        
        // Test with a group that exists (from previous tests we know "Grupo Okena" is in saida sheet)
        const result = await xlsxSaidaService.generateSaidaGrupoReport('Grupo Okena');
        
        console.log('Resultado:', result);
        console.log('Arquivo gerado em:', result.filePath);

        process.exit(0);
    } catch (error) {
        console.error('Erro no teste:', error);
        process.exit(1);
    }
})();
