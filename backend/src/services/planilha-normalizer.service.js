const logger = require('../utils/logger');

function slugHeader(h) {
    if (h === undefined || h === null) return '';
    const s = String(h).trim();
    // remove accents
    const noAcc = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return noAcc.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function cleanCnpj(v) {
    if (!v) return null;
    const s = String(v);
    const digits = s.replace(/\D/g, '');
    return digits.length ? digits : null;
}

function buildDtoFromRow(row, mapping) {
    const dto = {};
    const extras = {};

    for (const rawKey of Object.keys(row)) {
        const keySlug = slugHeader(rawKey);
        const mapped = mapping[keySlug];
        const value = row[rawKey] === undefined ? null : row[rawKey];

        if (mapped) {
            dto[mapped] = value;
        } else {
            extras[rawKey] = value;
        }
    }

    // post-process common fields
    if (dto.cnpj) dto.cnpj = cleanCnpj(dto.cnpj);

    if (Object.keys(extras).length > 0) dto.extra = extras;
    return dto;
}

// mapping dictionaries: normalized header slug -> canonical field
const cadastroMapping = {
    'cnpj': 'cnpj',
    'nome_fantasia': 'nome_fantasia',
    'razao_social': 'razao_social',
    'grupo': 'grupo',
    'situacao': 'situacao',
    'inicio_de_contrato': 'inicio_contrato',
    'termino_de_contrato': 'termino_contrato',
    'endereco': 'endereco',
    'municipio_uf': 'municipio_uf',
    'estado': 'estado',
    'uf': 'uf',
    'total_colaboradores': 'total_colaboradores',
    'plano_contratado': 'plano_contratado',
    'bpo_contabil': 'bpo_contabil',
    'bpo_fiscal': 'bpo_fiscal',
    'bpo_folha': 'bpo_folha',
    'bpo_financeiro': 'bpo_financeiro'
};

const produtosMapping = {
    'codigo': 'codigo',
    'nome_do_cliente': 'nome_cliente',
    'cliente': 'nome_cliente',
    'grupo': 'grupo',
    'regime_tributario': 'regime_tributario',
    'situacao_do_produto': 'situacao_produto',
    'situacao': 'situacao_produto',
    'data_inicio_do_produto': 'data_inicio',
    'data_termino_do_produto': 'data_termino',
    'produto': 'produto',
    'tipo_de_produto': 'tipo_produto',
    'valor_do_produto': 'valor_produto',
    'hrs_contr': 'horas_contratadas',
    'valor_hora': 'valor_hora',
    'qtd_de_vidas': 'quantidade_vidas',
    'valor_vida': 'valor_vida',
    'periodicidade_contabil': 'periodicidade',
    'deadline': 'deadline',
    'util_ou_corrente': 'util_corrente',
    'observacao': 'observacao',
    'cod_produto_data_inicio': 'codigo_produto_data'
};

const saidaMapping = {
    'codigo': 'codigo',
    'cnpj': 'cnpj',
    'empresa': 'nome',
    'nome': 'nome',
    'grupo': 'grupo',
    'ultima_competencia': 'ultima_competencia',
    'aviso_previo': 'aviso_previo',
    'servicos_contratados': 'servicos_contratados',
    'formalizacao_e_mail': 'formalizacao_email',
    'atualizacao_cadastro_crm': 'atualizacao_cadastro_crm',
    'atualizacao_produtos_e_subprodutos_crm': 'atualizacao_produtos_crm',
    'ficha_de_saida': 'ficha_saida',
    'tarefas_de_saida': 'tarefas_saida',
    'cadastro_do_novo_responsavel_no_gestta': 'novo_responsavel_gestta',
    'desfazer_grupos_apos_30_dias': 'desfazer_grupos',
    'distrato': 'distrato',
    'motivo': 'motivo_saida',
    'motivo_da_saida': 'motivo_saida',
    'motivo_saida': 'motivo_saida',
    'pendencias_no_pagamento': 'pendencias',
    'sem_contrato': 'sem_contrato',
    'bpo_financeiro': 'bpo_financeiro',
    'observacoes': 'observacoes'
};

function normalizeCadastro(row) {
    try {
        return buildDtoFromRow(row, cadastroMapping);
    } catch (err) {
        logger.error('normalizeCadastro error', err);
        throw err;
    }
}

function normalizeProdutos(row) {
    try {
        // Mapeamento específico para todos os campos da planilha de produtos
        const dynamicMap = {};
        for (const k of Object.keys(row)) {
            const s = slugHeader(k);
            
            // Mapeamento direto dos campos conhecidos
            if (s.includes('codigo')) dynamicMap[s] = 'codigo';
            else if (s.includes('nome_do_cliente') || s.includes('nome') && s.includes('cliente')) dynamicMap[s] = 'nome_cliente';
            else if (s.includes('grupo')) dynamicMap[s] = 'grupo';
            else if (s.includes('regime_tributario') || s.includes('regime')) dynamicMap[s] = 'regime_tributario';
            else if (s.includes('situacao') && s.includes('produto')) dynamicMap[s] = 'situacao_produto';
            else if (s.includes('data_inicio') || (s.includes('data') && s.includes('inicio'))) dynamicMap[s] = 'data_inicio';
            else if (s.includes('data_termino') || (s.includes('data') && s.includes('termino'))) dynamicMap[s] = 'data_termino';
            else if (s === 'produto') dynamicMap[s] = 'produto';
            else if (s.includes('tipo') && s.includes('produto')) dynamicMap[s] = 'tipo_produto';
            else if (s.includes('valor') && s.includes('produto')) dynamicMap[s] = 'valor_produto';
            else if (s.includes('hrs') || s.includes('horas')) dynamicMap[s] = 'horas_contratadas';
            else if (s.includes('valor') && s.includes('hora')) dynamicMap[s] = 'valor_hora';
            else if (s.includes('qtd') && s.includes('vidas')) dynamicMap[s] = 'quantidade_vidas';
            else if (s.includes('valor') && s.includes('vida')) dynamicMap[s] = 'valor_vida';
            else if (s.includes('periodicidade')) dynamicMap[s] = 'periodicidade';
            else if (s === 'deadline') dynamicMap[s] = 'deadline';
            else if (s.includes('util') || s.includes('corrente')) dynamicMap[s] = 'util_corrente';
            else if (s.includes('observacao')) dynamicMap[s] = 'observacao';
            else if (s.includes('cod') && s.includes('produto') && s.includes('data')) dynamicMap[s] = 'codigo_produto_data';
            else if (produtosMapping[s]) dynamicMap[s] = produtosMapping[s];
        }
        
        return buildDtoFromRow(row, dynamicMap);
    } catch (err) {
        logger.error('normalizeProdutos error', err);
        throw err;
    }
}

function normalizeSaida(row) {
    try {
        const dynamicMap = {};
        for (const k of Object.keys(row)) {
            const s = slugHeader(k);
            if (s.includes('codigo')) dynamicMap[s] = 'codigo';
            else if (s.includes('cnpj')) dynamicMap[s] = 'cnpj';
            else if (s.includes('empresa') || s.includes('nome')) dynamicMap[s] = 'nome';
            else if (s.includes('grupo')) dynamicMap[s] = 'grupo';
            else if (s.includes('ultima_competencia') || s.includes('competencia')) dynamicMap[s] = 'ultima_competencia';
            else if (s.includes('aviso_previo') || s.includes('previo')) dynamicMap[s] = 'aviso_previo';
            else if (s.includes('servicos_contratados') || s.includes('servicos')) dynamicMap[s] = 'servicos_contratados';
            else if (s.includes('formalizacao') || (s.includes('formalizacao') && s.includes('email'))) dynamicMap[s] = 'formalizacao_email';
            else if (s.includes('atualizacao') && s.includes('cadastro')) dynamicMap[s] = 'atualizacao_cadastro_crm';
            else if (s.includes('atualizacao') && s.includes('produtos')) dynamicMap[s] = 'atualizacao_produtos_crm';
            else if (s.includes('ficha') && s.includes('saida')) dynamicMap[s] = 'ficha_saida';
            else if (s.includes('tarefas') && s.includes('saida')) dynamicMap[s] = 'tarefas_saida';
            else if (s.includes('novo') && s.includes('responsavel')) dynamicMap[s] = 'novo_responsavel_gestta';
            else if (s.includes('desfazer') && s.includes('grupos')) dynamicMap[s] = 'desfazer_grupos';
            else if (s.includes('distrato')) dynamicMap[s] = 'distrato';
            else if (s.includes('motivo')) dynamicMap[s] = 'motivo_saida';
            else if (s.includes('pendencia') || s.includes('pendencias')) dynamicMap[s] = 'pendencias';
            else if (s.includes('contrato')) dynamicMap[s] = 'sem_contrato';
            else if (s.includes('observacoes')) dynamicMap[s] = 'observacoes';
            else if (saidaMapping[s]) dynamicMap[s] = saidaMapping[s];
        }
        return buildDtoFromRow(row, dynamicMap);
    } catch (err) {
        logger.error('normalizeSaida error', err);
        throw err;
    }
}

module.exports = {
    normalizeCadastro,
    normalizeProdutos,
    normalizeSaida,
    // helpers exported for tests
    slugHeader,
    buildDtoFromRow
};
