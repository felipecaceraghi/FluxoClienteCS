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
    })
};

module.exports = {
    validate,
    schemas
};
