// Script para testar o download da planilha de saída de clientes
const { downloadSaidaClientesPlanilha } = require('../src/services/saida-clientes-download.service');

downloadSaidaClientesPlanilha()
  .then((filePath) => {
    console.log('Download concluído:', filePath);
  })
  .catch((err) => {
    console.error('Erro ao baixar planilha:', err);
  });
