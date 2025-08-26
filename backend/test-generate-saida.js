// Smoke test: stub planilha-search.service and call generateSaidaGrupoReport
const path = require('path');
const fs = require('fs');

// Prepare stubbed search service module in require cache
const stubPath = path.join(__dirname, 'src', 'services', 'planilha-search.service.js');
const resolved = require.resolve('./src/services/planilha-search.service.js');
require.cache[resolved] = {
  id: resolved,
  filename: resolved,
  loaded: true,
  exports: {
    pesquisaGrupoAll: async (grupo) => {
      return {
        success: true,
        details: {
          saida: {
            rows: [
              { codigo: '1', motivo_saida: 'Cliente migrou para concorrente', ultima_competencia: '01/2025', aviso_previo: '30 dias' }
            ]
          },
          cadastro: {
            rows: [
              { extra: { 'Código Domínio': '1' }, nome_fantasia: 'Empresa Teste', razao_social: 'Empresa Teste Ltda', cnpj: '12.345.678/0001-99', grupo: grupo, inicio_contrato: '01/2020' }
            ]
          },
          produtos: { rows: [] }
        }
      };
    },
    pesquisaClienteAll: async (cliente) => {
      return {
        success: true,
        details: {
          saida: { rows: [ { codigo: '1', motivo_saida: 'Teste', ultima_competencia: '01/2025', aviso_previo: '30 dias' } ] },
          cadastro: { rows: [ { extra: { 'Código Domínio': '1' }, nome_fantasia: 'Empresa Teste', razao_social: 'Empresa Teste Ltda', cnpj: '12.345.678/0001-99', grupo: 'Grupo Teste', inicio_contrato: '01/2020' } ] },
          produtos: { rows: [] }
        }
      };
    }
  }
};

(async () => {
  try {
    const svc = require('./src/services/xlsx-saida-generator.service.js');
    console.log('Exports available:', Object.keys(svc));
    const res = await svc.generateSaidaGrupoReport('Grupo Teste');
    console.log('Generation result:', res);

    // List generated files in storage dir
    const storageDir = svc.STORAGE_DIR;
    console.log('Storage dir:', storageDir);
    const files = fs.readdirSync(storageDir).filter(f => f.includes('Saida_Grupo_Grupo_Teste'));
    console.log('Generated files:', files);
  } catch (err) {
    console.error('Error in test-generate-saida:', err);
    process.exit(1);
  }
})();
