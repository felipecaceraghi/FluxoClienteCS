// Script para testar o download da planilha de saída de clientes via SharePoint
const saidaSharePointService = require('../src/services/saida-clientes-sharepoint.service');

saidaSharePointService.downloadFile()
  .then((result) => {
    if (result.success) {
      console.log('Download concluído:', result.filePath);
    } else {
      console.error('Erro ao baixar planilha:', result.message);
    }
  })
  .catch((err) => {
    console.error('Erro inesperado:', err);
  });
