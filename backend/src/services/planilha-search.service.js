const path = require('path');
const { parseSheet } = require('./planilha-parser.service');
const { normalizeCadastro, normalizeProdutos, normalizeSaida } = require('./planilha-normalizer.service');
const downloadService = require('./saida-clientes-download.service');
const logger = require('../utils/logger');

function slug(s) {
    if (!s && s !== 0) return '';
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function valueIncludes(val, term) {
    if (val === null || val === undefined) return false;
    return String(val).toLowerCase().includes(term.toLowerCase());
}

function rowMatchesGroup(row, term) {
    for (const key of Object.keys(row)) {
        const keySlug = slug(key);
        if (keySlug.includes('grupo')) {
            if (valueIncludes(row[key], term)) return true;
        }
    }
    // fallback: check any value that contains the term
    for (const key of Object.keys(row)) {
        if (valueIncludes(row[key], term)) return true;
    }
    return false;
}

function rowMatchesClient(row, term) {
    for (const key of Object.keys(row)) {
        const keySlug = slug(key);
        if (keySlug.includes('nome') || keySlug.includes('cliente') || keySlug.includes('empresa') || keySlug.includes('fantasia')) {
            if (valueIncludes(row[key], term)) return true;
        }
    }
    // fallback: any value contains term
    for (const key of Object.keys(row)) {
        if (valueIncludes(row[key], term)) return true;
    }
    return false;
}

// Função para garantir que todas as planilhas estão atualizadas
async function ensureUpdatedFiles() {
    try {
        logger.info('🔄 Baixando planilhas atualizadas do SharePoint...');
        
        // Baixar as 3 planilhas em paralelo
        const downloads = await Promise.allSettled([
            downloadService.downloadSaidaClientesPlanilha(),
            downloadService.downloadCadastroClientesPlanilha(),
            downloadService.downloadProdutosClientesPlanilha()
        ]);

        const results = downloads.map((result, index) => {
            const files = ['Saída', 'Cadastro', 'Produtos'];
            if (result.status === 'fulfilled') {
                logger.info(`✅ ${files[index]} baixada com sucesso`);
                return { file: files[index], success: true };
            } else {
                logger.warn(`⚠️ Erro ao baixar ${files[index]}:`, result.reason);
                return { file: files[index], success: false, error: result.reason };
            }
        });

        logger.info('📊 Downloads concluídos');
        return results;
    } catch (error) {
        logger.error('❌ Erro ao atualizar planilhas:', error);
        // Continuar com arquivos locais se houver erro no download
        return [];
    }
}

async function searchInFile(filePath, headerRow, sheetName, term, type) {
    try {
        const rows = parseSheet(filePath, headerRow, sheetName);

        const matches = rows.filter(r => {
            if (type === 'group') return rowMatchesGroup(r, term);
            return rowMatchesClient(r, term);
        });

        // normalize results according to file type
        const normalized = matches.map(r => {
            if (type === 'cadastro') return normalizeCadastro(r);
            if (type === 'produtos') return normalizeProdutos(r);
            if (type === 'saida') return normalizeSaida(r);
            // if searching by group/client, attempt to normalize by inspecting sheetName
            return r;
        });

        return { success: true, count: matches.length, rows: normalized };
    } catch (error) {
        logger.error('searchInFile error', error);
        return { success: false, error: error.message };
    }
}

// convenience wrappers using storage paths
const STORAGE_DIR = path.join(__dirname, '../storage/sharepoint-files');

async function pesquisaGrupoSaida(term) {
    await ensureUpdatedFiles(); // Garantir arquivos atualizados
    const file = path.join(STORAGE_DIR, process.env.SAIDA_CLIENTES_FILE_NAME || 'Saida_de_Clientes.xlsx');
    return searchInFile(file, parseInt(process.env.SAIDA_HEADER_ROW) || 2, process.env.SAIDA_SHEET_NAME || 'Base de Dados', term, 'saida');
}

async function pesquisaClienteSaida(term) {
    await ensureUpdatedFiles(); // Garantir arquivos atualizados
    const file = path.join(STORAGE_DIR, process.env.SAIDA_CLIENTES_FILE_NAME || 'Saida_de_Clientes.xlsx');
    return searchInFile(file, parseInt(process.env.SAIDA_HEADER_ROW) || 2, process.env.SAIDA_SHEET_NAME || 'Base de Dados', term, 'saida');
}

async function pesquisaGrupoCadastro(term) {
    // Não precisa baixar novamente, já foi baixado em pesquisaGrupoSaida
    const file = path.join(STORAGE_DIR, process.env.CADASTRO_CLIENTES_FILE_NAME || 'Cadastro_de_Clientes_v1.xlsm');
    return searchInFile(file, parseInt(process.env.CADASTRO_HEADER_ROW) || 5, process.env.CADASTRO_SHEET_NAME || 'Clientes', term, 'cadastro');
}

async function pesquisaClienteCadastro(term) {
    // Não precisa baixar novamente, já foi baixado em pesquisaClienteSaida
    const file = path.join(STORAGE_DIR, process.env.CADASTRO_CLIENTES_FILE_NAME || 'Cadastro_de_Clientes_v1.xlsm');
    return searchInFile(file, parseInt(process.env.CADASTRO_HEADER_ROW) || 5, process.env.CADASTRO_SHEET_NAME || 'Clientes', term, 'cadastro');
}

async function pesquisaGrupoProdutos(term) {
    // Não precisa baixar novamente, já foi baixado em pesquisaGrupoSaida
    const file = path.join(STORAGE_DIR, process.env.PRODUTOS_CLIENTES_FILE_NAME || 'Produtos_dos_Clientes_v1.xlsm');
    return searchInFile(file, parseInt(process.env.PRODUTOS_HEADER_ROW) || 4, process.env.PRODUTOS_SHEET_NAME || 'Produtos por Cliente', term, 'produtos');
}

async function pesquisaClienteProdutos(term) {
    // Não precisa baixar novamente, já foi baixado em pesquisaClienteSaida
    const file = path.join(STORAGE_DIR, process.env.PRODUTOS_CLIENTES_FILE_NAME || 'Produtos_dos_Clientes_v1.xlsm');
    return searchInFile(file, parseInt(process.env.PRODUTOS_HEADER_ROW) || 4, process.env.PRODUTOS_SHEET_NAME || 'Produtos por Cliente', term, 'produtos');
}

module.exports = {
    pesquisaGrupoSaida,
    pesquisaClienteSaida,
    pesquisaGrupoCadastro,
    pesquisaClienteCadastro,
    pesquisaGrupoProdutos,
    pesquisaClienteProdutos
};

// Aggregate searches across all three planilhas
async function pesquisaGrupoAll(term) {
    // run searches separately
    const r1 = await pesquisaGrupoSaida(term);
    const r2 = await pesquisaGrupoCadastro(term);
    const r3 = await pesquisaGrupoProdutos(term);

    const missing = [];
    if (!r1 || !r1.success || r1.count === 0) missing.push('saida');
    if (!r2 || !r2.success || r2.count === 0) missing.push('cadastro');
    if (!r3 || !r3.success || r3.count === 0) missing.push('produtos');

    if (missing.length > 0) {
        return { success: false, error: 'Grupo não encontrado em todas as planilhas', missing };
    }

    // aggregate rows from all sources
    const totalRows = [];
    totalRows.push(...(r1.rows || []));
    totalRows.push(...(r2.rows || []));
    totalRows.push(...(r3.rows || []));

    return { success: true, count: totalRows.length, rows: totalRows, details: { saida: r1, cadastro: r2, produtos: r3 } };
}

async function pesquisaClienteAll(term) {
    const r1 = await pesquisaClienteSaida(term);
    const r2 = await pesquisaClienteCadastro(term);
    const r3 = await pesquisaClienteProdutos(term);

    const missing = [];
    if (!r1 || !r1.success || r1.count === 0) missing.push('saida');
    if (!r2 || !r2.success || r2.count === 0) missing.push('cadastro');
    if (!r3 || !r3.success || r3.count === 0) missing.push('produtos');

    if (missing.length > 0) {
        return { success: false, error: 'Empresa não encontrada em todas as planilhas', missing };
    }

    const totalRows = [];
    totalRows.push(...(r1.rows || []));
    totalRows.push(...(r2.rows || []));
    totalRows.push(...(r3.rows || []));

    return { success: true, count: totalRows.length, rows: totalRows, details: { saida: r1, cadastro: r2, produtos: r3 } };
}

module.exports = Object.assign(module.exports, {
    pesquisaGrupoAll,
    pesquisaClienteAll
});
