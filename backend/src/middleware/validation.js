const Joi = require('joi');

const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false, // Retorna todos os erros
            stripUnknown: true // Remove campos não definidos no schema
        });

        if (error) {
            return res.status(400).json({
                error: 'Dados inválidos',
                code: 'VALIDATION_ERROR',
                details: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message.replace(/"/g, ''), // Remove aspas
                    value: detail.context.value
                }))
            });
        }

        // Substitui os dados validados
        req[property] = value;
        next();
    };
};

// Schemas de validação
const schemas = {
    // Autenticação
    login: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Email deve ter um formato válido',
                'any.required': 'Email é obrigatório'
            }),
        password: Joi.string()
            .min(6)
            .required()
            .messages({
                'string.min': 'Senha deve ter pelo menos 6 caracteres',
                'any.required': 'Senha é obrigatória'
            })
    }),

    forgotPassword: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Email deve ter um formato válido',
                'any.required': 'Email é obrigatório'
            })
    }),

    resetPassword: Joi.object({
        token: Joi.string()
            .required()
            .messages({
                'any.required': 'Token é obrigatório'
            }),
        newPassword: Joi.string()
            .min(6)
            .required()
            .messages({
                'string.min': 'Nova senha deve ter pelo menos 6 caracteres',
                'any.required': 'Nova senha é obrigatória'
            })
    }),

    // Busca de empresas
    searchCompanies: Joi.object({
        q: Joi.string()
            .min(1)
            .max(100)
            .required()
            .messages({
                'string.min': 'Termo de busca deve ter pelo menos 1 caractere',
                'string.max': 'Termo de busca deve ter no máximo 100 caracteres',
                'any.required': 'Termo de busca é obrigatório'
            }),
        page: Joi.number()
            .integer()
            .min(1)
            .default(1),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(50)
            .default(10)
    }),

    // Geração de relatório
    generateReport: Joi.object({
        companyCode: Joi.string()
            .required()
            .messages({
                'any.required': 'Código da empresa é obrigatório'
            }),
        reportType: Joi.string()
            .valid('X', 'Y', 'BOTH')
            .default('BOTH')
            .messages({
                'any.only': 'Tipo de relatório deve ser X, Y ou BOTH'
            })
    }),

    // Cliente
    cliente: Joi.object({
        codigo: Joi.string()
            .required()
            .max(50)
            .messages({
                'any.required': 'Código é obrigatório',
                'string.max': 'Código deve ter no máximo 50 caracteres'
            }),
        nome_fantasia: Joi.string()
            .max(255)
            .allow('', null),
        grupo: Joi.string()
            .max(255)
            .allow('', null),
        razao_social: Joi.string()
            .max(255)
            .allow('', null),
        inicio_contrato: Joi.date()
            .iso()
            .allow(null),
        termino_contrato: Joi.date()
            .iso()
            .allow(null),
        situacao: Joi.string()
            .max(100)
            .allow('', null),
        cnpj: Joi.string()
            .max(20)
            .allow('', null),
        ie: Joi.string()
            .max(50)
            .allow('', null),
        endereco: Joi.string()
            .allow('', null),
        municipio_uf: Joi.string()
            .max(255)
            .allow('', null),
        estado: Joi.string()
            .max(100)
            .allow('', null),
        uf: Joi.string()
            .max(2)
            .allow('', null),
        observacoes_cadastro: Joi.string()
            .allow('', null),
        setor: Joi.string()
            .max(255)
            .allow('', null),
        segmento: Joi.string()
            .max(255)
            .allow('', null),
        atividade_especialidade: Joi.string()
            .allow('', null),
        faturamento_anual: Joi.number()
            .precision(2)
            .allow(null),
        porte: Joi.string()
            .max(100)
            .allow('', null),
        regime_tributario_proposta: Joi.string()
            .max(100)
            .allow('', null),
        regime_tributario_atual: Joi.string()
            .max(100)
            .allow('', null),
        deadline_periodicidade: Joi.string()
            .max(100)
            .allow('', null),
        deadline_dia: Joi.string()
            .max(50)
            .allow('', null),
        deadline_util_corrente: Joi.string()
            .max(50)
            .allow('', null),
        centro_custo_possui: Joi.string()
            .max(10)
            .allow('', null),
        centro_custo_quantidade: Joi.number()
            .integer()
            .min(0)
            .allow(null),
        departamentalizacao_possui: Joi.string()
            .max(10)
            .allow('', null),
        departamentalizacao_quantidade: Joi.number()
            .integer()
            .min(0)
            .allow(null),
        scp_quantidade: Joi.number()
            .integer()
            .min(0)
            .allow(null),
        importacao_processos_ano: Joi.number()
            .integer()
            .min(0)
            .allow(null),
        exportacao_processos_ano: Joi.number()
            .integer()
            .min(0)
            .allow(null),
        nf_entradas: Joi.number()
            .integer()
            .min(0)
            .allow(null),
        nf_saidas: Joi.number()
            .integer()
            .min(0)
            .allow(null),
        ctes_entrada: Joi.number()
            .integer()
            .min(0)
            .allow(null),
        ctes_saida: Joi.number()
            .integer()
            .min(0)
            .allow(null),
        cupom_fiscal: Joi.number()
            .integer()
            .min(0)
            .allow(null),
        nf_servicos_prestados: Joi.number()
            .integer()
            .min(0)
            .allow(null),
        servicos_tomados: Joi.number()
            .integer()
            .min(0)
            .allow(null),
        nf_pjs: Joi.number()
            .integer()
            .min(0)
            .allow(null),
        pro_labore: Joi.number()
            .integer()
            .min(0)
            .allow(null),
        estagiarios: Joi.number()
            .integer()
            .min(0)
            .allow(null),
        aprendizes: Joi.number()
            .integer()
            .min(0)
            .allow(null),
        rpa: Joi.number()
            .integer()
            .min(0)
            .allow(null),
        domesticas_clt: Joi.number()
            .integer()
            .min(0)
            .allow(null),
        colab_clt: Joi.number()
            .integer()
            .min(0)
            .allow(null),
        total_colaboradores: Joi.number()
            .integer()
            .min(0)
            .allow(null),
        data_adiantamento: Joi.date()
            .iso()
            .allow(null),
        data_pagamento: Joi.date()
            .iso()
            .allow(null),
        sistema_contabil: Joi.string()
            .max(255)
            .allow('', null),
        sistema_fiscal: Joi.string()
            .max(255)
            .allow('', null),
        sistema_folha: Joi.string()
            .max(255)
            .allow('', null),
        sistema_financeiro: Joi.string()
            .max(255)
            .allow('', null),
        sistema_rh: Joi.string()
            .max(255)
            .allow('', null),
        sistema_outros: Joi.string()
            .max(255)
            .allow('', null),
        empresa_aberta_go: Joi.string()
            .max(10)
            .allow('', null),
        contato_principal_nome: Joi.string()
            .max(255)
            .allow('', null),
        contato_principal_cargo: Joi.string()
            .max(255)
            .allow('', null),
        contato_principal_email: Joi.string()
            .email()
            .max(255)
            .allow('', null),
        contato_principal_celular: Joi.string()
            .max(50)
            .allow('', null),
        plano_contratado: Joi.string()
            .max(255)
            .allow('', null),
        sla: Joi.string()
            .max(255)
            .allow('', null),
        bpo_contabil: Joi.string()
            .max(10)
            .allow('', null),
        bpo_fiscal: Joi.string()
            .max(10)
            .allow('', null),
        bpo_folha: Joi.string()
            .max(10)
            .allow('', null),
        bpo_financeiro: Joi.string()
            .max(10)
            .allow('', null),
        bpo_rh: Joi.string()
            .max(10)
            .allow('', null),
        bpo_cnd: Joi.string()
            .max(10)
            .allow('', null),
        vl_bpo_contabil: Joi.number()
            .precision(2)
            .min(0)
            .allow(null),
        vl_bpo_fiscal: Joi.number()
            .precision(2)
            .min(0)
            .allow(null),
        vl_bpo_folha: Joi.number()
            .precision(2)
            .min(0)
            .allow(null),
        vl_bpo_financeiro: Joi.number()
            .precision(2)
            .min(0)
            .allow(null),
        vl_bpo_rh: Joi.number()
            .precision(2)
            .min(0)
            .allow(null),
        vl_bpo_legal: Joi.number()
            .precision(2)
            .min(0)
            .allow(null),
        honorario_mensal_total: Joi.number()
            .precision(2)
            .min(0)
            .allow(null),
        competencia_inicial_fixo: Joi.date()
            .iso()
            .allow(null),
        diversos_inicial: Joi.string()
            .max(255)
            .allow('', null),
        competencia_diversos_inicial: Joi.date()
            .iso()
            .allow(null),
        vl_diversos_inicial: Joi.number()
            .precision(2)
            .min(0)
            .allow(null),
        implantacao: Joi.string()
            .max(255)
            .allow('', null),
        forma_pgto: Joi.string()
            .max(255)
            .allow('', null),
        vl_implantacao: Joi.number()
            .precision(2)
            .min(0)
            .allow(null),
        bpo_contabil_faturado: Joi.number()
            .precision(2)
            .min(0)
            .allow(null),
        bpo_fiscal_faturado: Joi.number()
            .precision(2)
            .min(0)
            .allow(null),
        bpo_folha_faturado: Joi.number()
            .precision(2)
            .min(0)
            .allow(null),
        bpo_financeiro_faturado: Joi.number()
            .precision(2)
            .min(0)
            .allow(null),
        bpo_rh_faturado: Joi.number()
            .precision(2)
            .min(0)
            .allow(null),
        bpo_legal_faturado: Joi.number()
            .precision(2)
            .min(0)
            .allow(null),
        diversos_in_faturado: Joi.number()
            .precision(2)
            .min(0)
            .allow(null),
        implantacao_faturado: Joi.number()
            .precision(2)
            .min(0)
            .allow(null),
        closer: Joi.string()
            .max(255)
            .allow('', null),
        prospector: Joi.string()
            .max(255)
            .allow('', null),
        origem_lead: Joi.string()
            .max(255)
            .allow('', null),
        motivo_troca: Joi.string()
            .allow('', null)
    })
};

module.exports = {
    validate,
    schemas,
    validateLogin: validate(schemas.login),
    validateForgotPassword: validate(schemas.forgotPassword),
    validateResetPassword: validate(schemas.resetPassword),
    validateSearchCompanies: validate(schemas.searchCompanies, 'query'),
    validateGenerateReport: validate(schemas.generateReport),
    validateClienteData: validate(schemas.cliente)
};
