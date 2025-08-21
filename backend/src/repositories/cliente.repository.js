const db = require('../database/connection');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class ClienteRepository {
    /**
     * Busca todos os clientes ativos
     */
    async getAllActive() {
        try {
            const query = `
                SELECT * FROM clientes 
                WHERE active = 1 
                ORDER BY nome_fantasia
            `;
            return await db.query(query);
        } catch (error) {
            logger.error('Erro ao buscar clientes ativos', { error: error.message });
            throw error;
        }
    }

    /**
     * Busca cliente por código
     */
    async getByCodigo(codigo) {
        try {
            const query = 'SELECT * FROM clientes WHERE codigo = ? AND active = 1';
            return await db.get(query, [codigo]);
        } catch (error) {
            logger.error('Erro ao buscar cliente por código', { codigo, error: error.message });
            throw error;
        }
    }

    /**
     * Busca cliente por ID
     */
    async getById(id) {
        try {
            const query = 'SELECT * FROM clientes WHERE id = ? AND active = 1';
            return await db.get(query, [id]);
        } catch (error) {
            logger.error('Erro ao buscar cliente por ID', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Cria um novo cliente
     */
    async create(clienteData) {
        try {
            const id = uuidv4();
            const now = new Date().toISOString();
            
            const query = `
                INSERT INTO clientes (
                    id, codigo, nome_fantasia, grupo, razao_social, inicio_contrato, termino_contrato,
                    situacao, cnpj, ie, endereco, municipio_uf, estado, uf, observacoes_cadastro,
                    setor, segmento, atividade_especialidade, faturamento_anual, porte,
                    regime_tributario_proposta, regime_tributario_atual, deadline_periodicidade,
                    deadline_dia, deadline_util_corrente, centro_custo_possui, centro_custo_quantidade,
                    departamentalizacao_possui, departamentalizacao_quantidade, scp_quantidade,
                    importacao_processos_ano, exportacao_processos_ano, nf_entradas, nf_saidas,
                    ctes_entrada, ctes_saida, cupom_fiscal, nf_servicos_prestados, servicos_tomados,
                    nf_pjs, pro_labore, estagiarios, aprendizes, rpa, domesticas_clt, colab_clt,
                    total_colaboradores, data_adiantamento, data_pagamento, sistema_contabil,
                    sistema_fiscal, sistema_folha, sistema_financeiro, sistema_rh, sistema_outros,
                    empresa_aberta_go, contato_principal_nome, contato_principal_cargo,
                    contato_principal_email, contato_principal_celular, plano_contratado, sla,
                    bpo_contabil, bpo_fiscal, bpo_folha, bpo_financeiro, bpo_rh, bpo_cnd,
                    vl_bpo_contabil, vl_bpo_fiscal, vl_bpo_folha, vl_bpo_financeiro, vl_bpo_rh,
                    vl_bpo_legal, honorario_mensal_total, competencia_inicial_fixo, diversos_inicial,
                    competencia_diversos_inicial, vl_diversos_inicial, implantacao, forma_pgto,
                    vl_implantacao, bpo_contabil_faturado, bpo_fiscal_faturado, bpo_folha_faturado,
                    bpo_financeiro_faturado, bpo_rh_faturado, bpo_legal_faturado, diversos_in_faturado,
                    implantacao_faturado, closer, prospector, origem_lead, motivo_troca,
                    active, created_at, updated_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
            `;

            const values = [
                id, clienteData.codigo, clienteData.nome_fantasia, clienteData.grupo,
                clienteData.razao_social, clienteData.inicio_contrato, clienteData.termino_contrato,
                clienteData.situacao, clienteData.cnpj, clienteData.ie, clienteData.endereco,
                clienteData.municipio_uf, clienteData.estado, clienteData.uf, clienteData.observacoes_cadastro,
                clienteData.setor, clienteData.segmento, clienteData.atividade_especialidade,
                clienteData.faturamento_anual, clienteData.porte, clienteData.regime_tributario_proposta,
                clienteData.regime_tributario_atual, clienteData.deadline_periodicidade,
                clienteData.deadline_dia, clienteData.deadline_util_corrente, clienteData.centro_custo_possui,
                clienteData.centro_custo_quantidade, clienteData.departamentalizacao_possui,
                clienteData.departamentalizacao_quantidade, clienteData.scp_quantidade,
                clienteData.importacao_processos_ano, clienteData.exportacao_processos_ano,
                clienteData.nf_entradas, clienteData.nf_saidas, clienteData.ctes_entrada,
                clienteData.ctes_saida, clienteData.cupom_fiscal, clienteData.nf_servicos_prestados,
                clienteData.servicos_tomados, clienteData.nf_pjs, clienteData.pro_labore,
                clienteData.estagiarios, clienteData.aprendizes, clienteData.rpa,
                clienteData.domesticas_clt, clienteData.colab_clt, clienteData.total_colaboradores,
                clienteData.data_adiantamento, clienteData.data_pagamento, clienteData.sistema_contabil,
                clienteData.sistema_fiscal, clienteData.sistema_folha, clienteData.sistema_financeiro,
                clienteData.sistema_rh, clienteData.sistema_outros, clienteData.empresa_aberta_go,
                clienteData.contato_principal_nome, clienteData.contato_principal_cargo,
                clienteData.contato_principal_email, clienteData.contato_principal_celular,
                clienteData.plano_contratado, clienteData.sla, clienteData.bpo_contabil,
                clienteData.bpo_fiscal, clienteData.bpo_folha, clienteData.bpo_financeiro,
                clienteData.bpo_rh, clienteData.bpo_cnd, clienteData.vl_bpo_contabil,
                clienteData.vl_bpo_fiscal, clienteData.vl_bpo_folha, clienteData.vl_bpo_financeiro,
                clienteData.vl_bpo_rh, clienteData.vl_bpo_legal, clienteData.honorario_mensal_total,
                clienteData.competencia_inicial_fixo, clienteData.diversos_inicial,
                clienteData.competencia_diversos_inicial, clienteData.vl_diversos_inicial,
                clienteData.implantacao, clienteData.forma_pgto, clienteData.vl_implantacao,
                clienteData.bpo_contabil_faturado, clienteData.bpo_fiscal_faturado,
                clienteData.bpo_folha_faturado, clienteData.bpo_financeiro_faturado,
                clienteData.bpo_rh_faturado, clienteData.bpo_legal_faturado,
                clienteData.diversos_in_faturado, clienteData.implantacao_faturado,
                clienteData.closer, clienteData.prospector, clienteData.origem_lead,
                clienteData.motivo_troca, 1, now, now
            ];

            await db.run(query, values);
            
            logger.info('Cliente criado com sucesso', { id, codigo: clienteData.codigo });
            return await this.getById(id);
        } catch (error) {
            logger.error('Erro ao criar cliente', { clienteData, error: error.message });
            throw error;
        }
    }

    /**
     * Atualiza um cliente existente
     */
    async update(id, clienteData) {
        try {
            const now = new Date().toISOString();
            
            const query = `
                UPDATE clientes SET
                    nome_fantasia = ?, grupo = ?, razao_social = ?, inicio_contrato = ?, termino_contrato = ?,
                    situacao = ?, cnpj = ?, ie = ?, endereco = ?, municipio_uf = ?, estado = ?, uf = ?,
                    observacoes_cadastro = ?, setor = ?, segmento = ?, atividade_especialidade = ?,
                    faturamento_anual = ?, porte = ?, regime_tributario_proposta = ?, regime_tributario_atual = ?,
                    deadline_periodicidade = ?, deadline_dia = ?, deadline_util_corrente = ?,
                    centro_custo_possui = ?, centro_custo_quantidade = ?, departamentalizacao_possui = ?,
                    departamentalizacao_quantidade = ?, scp_quantidade = ?, importacao_processos_ano = ?,
                    exportacao_processos_ano = ?, nf_entradas = ?, nf_saidas = ?, ctes_entrada = ?,
                    ctes_saida = ?, cupom_fiscal = ?, nf_servicos_prestados = ?, servicos_tomados = ?,
                    nf_pjs = ?, pro_labore = ?, estagiarios = ?, aprendizes = ?, rpa = ?, domesticas_clt = ?,
                    colab_clt = ?, total_colaboradores = ?, data_adiantamento = ?, data_pagamento = ?,
                    sistema_contabil = ?, sistema_fiscal = ?, sistema_folha = ?, sistema_financeiro = ?,
                    sistema_rh = ?, sistema_outros = ?, empresa_aberta_go = ?, contato_principal_nome = ?,
                    contato_principal_cargo = ?, contato_principal_email = ?, contato_principal_celular = ?,
                    plano_contratado = ?, sla = ?, bpo_contabil = ?, bpo_fiscal = ?, bpo_folha = ?,
                    bpo_financeiro = ?, bpo_rh = ?, bpo_cnd = ?, vl_bpo_contabil = ?, vl_bpo_fiscal = ?,
                    vl_bpo_folha = ?, vl_bpo_financeiro = ?, vl_bpo_rh = ?, vl_bpo_legal = ?,
                    honorario_mensal_total = ?, competencia_inicial_fixo = ?, diversos_inicial = ?,
                    competencia_diversos_inicial = ?, vl_diversos_inicial = ?, implantacao = ?,
                    forma_pgto = ?, vl_implantacao = ?, bpo_contabil_faturado = ?, bpo_fiscal_faturado = ?,
                    bpo_folha_faturado = ?, bpo_financeiro_faturado = ?, bpo_rh_faturado = ?,
                    bpo_legal_faturado = ?, diversos_in_faturado = ?, implantacao_faturado = ?,
                    closer = ?, prospector = ?, origem_lead = ?, motivo_troca = ?, updated_at = ?
                WHERE id = ?
            `;

            const values = [
                clienteData.nome_fantasia, clienteData.grupo, clienteData.razao_social,
                clienteData.inicio_contrato, clienteData.termino_contrato, clienteData.situacao,
                clienteData.cnpj, clienteData.ie, clienteData.endereco, clienteData.municipio_uf,
                clienteData.estado, clienteData.uf, clienteData.observacoes_cadastro,
                clienteData.setor, clienteData.segmento, clienteData.atividade_especialidade,
                clienteData.faturamento_anual, clienteData.porte, clienteData.regime_tributario_proposta,
                clienteData.regime_tributario_atual, clienteData.deadline_periodicidade,
                clienteData.deadline_dia, clienteData.deadline_util_corrente, clienteData.centro_custo_possui,
                clienteData.centro_custo_quantidade, clienteData.departamentalizacao_possui,
                clienteData.departamentalizacao_quantidade, clienteData.scp_quantidade,
                clienteData.importacao_processos_ano, clienteData.exportacao_processos_ano,
                clienteData.nf_entradas, clienteData.nf_saidas, clienteData.ctes_entrada,
                clienteData.ctes_saida, clienteData.cupom_fiscal, clienteData.nf_servicos_prestados,
                clienteData.servicos_tomados, clienteData.nf_pjs, clienteData.pro_labore,
                clienteData.estagiarios, clienteData.aprendizes, clienteData.rpa,
                clienteData.domesticas_clt, clienteData.colab_clt, clienteData.total_colaboradores,
                clienteData.data_adiantamento, clienteData.data_pagamento, clienteData.sistema_contabil,
                clienteData.sistema_fiscal, clienteData.sistema_folha, clienteData.sistema_financeiro,
                clienteData.sistema_rh, clienteData.sistema_outros, clienteData.empresa_aberta_go,
                clienteData.contato_principal_nome, clienteData.contato_principal_cargo,
                clienteData.contato_principal_email, clienteData.contato_principal_celular,
                clienteData.plano_contratado, clienteData.sla, clienteData.bpo_contabil,
                clienteData.bpo_fiscal, clienteData.bpo_folha, clienteData.bpo_financeiro,
                clienteData.bpo_rh, clienteData.bpo_cnd, clienteData.vl_bpo_contabil,
                clienteData.vl_bpo_fiscal, clienteData.vl_bpo_folha, clienteData.vl_bpo_financeiro,
                clienteData.vl_bpo_rh, clienteData.vl_bpo_legal, clienteData.honorario_mensal_total,
                clienteData.competencia_inicial_fixo, clienteData.diversos_inicial,
                clienteData.competencia_diversos_inicial, clienteData.vl_diversos_inicial,
                clienteData.implantacao, clienteData.forma_pgto, clienteData.vl_implantacao,
                clienteData.bpo_contabil_faturado, clienteData.bpo_fiscal_faturado,
                clienteData.bpo_folha_faturado, clienteData.bpo_financeiro_faturado,
                clienteData.bpo_rh_faturado, clienteData.bpo_legal_faturado,
                clienteData.diversos_in_faturado, clienteData.implantacao_faturado,
                clienteData.closer, clienteData.prospector, clienteData.origem_lead,
                clienteData.motivo_troca, now, id
            ];

            const result = await db.run(query, values);
            
            if (result.changes === 0) {
                throw new Error('Cliente não encontrado ou nenhuma alteração realizada');
            }

            logger.info('Cliente atualizado com sucesso', { id });
            return await this.getById(id);
        } catch (error) {
            logger.error('Erro ao atualizar cliente', { id, clienteData, error: error.message });
            throw error;
        }
    }

    /**
     * Desativa um cliente (soft delete)
     */
    async deactivate(id) {
        try {
            const now = new Date().toISOString();
            const query = 'UPDATE clientes SET active = 0, updated_at = ? WHERE id = ?';
            const result = await db.run(query, [now, id]);
            
            if (result.changes === 0) {
                throw new Error('Cliente não encontrado');
            }

            logger.info('Cliente desativado com sucesso', { id });
            return true;
        } catch (error) {
            logger.error('Erro ao desativar cliente', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Desativa cliente por código
     */
    async deactivateByCodigo(codigo) {
        try {
            const now = new Date().toISOString();
            const query = 'UPDATE clientes SET active = 0, updated_at = ? WHERE codigo = ?';
            const result = await db.run(query, [now, codigo]);
            
            logger.info('Cliente desativado por código', { codigo, changes: result.changes });
            return result.changes > 0;
        } catch (error) {
            logger.error('Erro ao desativar cliente por código', { codigo, error: error.message });
            throw error;
        }
    }

    /**
     * Busca todos os códigos ativos para comparação durante sync
     */
    async getAllActiveCodes() {
        try {
            const query = 'SELECT codigo FROM clientes WHERE active = 1';
            const result = await db.query(query);
            return result.map(row => row.codigo);
        } catch (error) {
            logger.error('Erro ao buscar códigos ativos', { error: error.message });
            throw error;
        }
    }

    /**
     * Upsert de cliente (usado para sincronização do SharePoint)
     */
    async upsertFromSharePoint(clienteData) {
        try {
            const existing = await this.getByCodigo(clienteData.codigo);
            
            if (existing) {
                // Atualizar registro existente
                return await this.update(existing.id, clienteData);
            } else {
                // Criar novo registro
                return await this.create(clienteData);
            }
        } catch (error) {
            logger.error('Erro no upsert de cliente do SharePoint', { 
                codigo: clienteData.codigo, 
                error: error.message 
            });
            throw error;
        }
    }

    /**
     * Bulk upsert para sincronização em lote
     */
    async bulkUpsertFromSharePoint(clientesData) {
        try {
            const results = {
                processados: 0,
                novos: 0,
                atualizados: 0,
                erros: []
            };

            for (const clienteData of clientesData) {
                try {
                    const existing = await this.getByCodigo(clienteData.codigo);
                    
                    if (existing) {
                        await this.update(existing.id, clienteData);
                        results.atualizados++;
                    } else {
                        await this.create(clienteData);
                        results.novos++;
                    }
                    
                    results.processados++;
                } catch (error) {
                    results.erros.push({
                        codigo: clienteData.codigo,
                        erro: error.message
                    });
                    logger.error('Erro no bulk upsert individual', { 
                        codigo: clienteData.codigo, 
                        error: error.message 
                    });
                }
            }

            logger.info('Bulk upsert de clientes concluído', results);
            return results;
        } catch (error) {
            logger.error('Erro no bulk upsert de clientes', { error: error.message });
            throw error;
        }
    }

    /**
     * Conta total de clientes ativos
     */
    async countActive() {
        try {
            const query = 'SELECT COUNT(*) as count FROM clientes WHERE active = 1';
            const result = await db.get(query);
            return result.count;
        } catch (error) {
            logger.error('Erro ao contar clientes ativos', { error: error.message });
            throw error;
        }
    }
}

module.exports = new ClienteRepository();
