const errorHandler = (err, req, res, next) => {
    console.error('🔥 Erro capturado:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    // Erro de validação Joi
    if (err.isJoi) {
        return res.status(400).json({
            error: 'Dados inválidos',
            code: 'VALIDATION_ERROR',
            details: err.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }))
        });
    }

    // Erro de sintaxe JSON
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            error: 'JSON inválido',
            code: 'JSON_SYNTAX_ERROR'
        });
    }

    // Erro de banco SQLite
    if (err.code && err.code.startsWith('SQLITE_')) {
        return res.status(500).json({
            error: 'Erro no banco de dados',
            code: 'DATABASE_ERROR'
        });
    }

    // Erro de token JWT
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token inválido ou expirado',
            code: 'TOKEN_ERROR'
        });
    }

    // Erro personalizado da aplicação
    if (err.isOperational) {
        return res.status(err.statusCode || 400).json({
            error: err.message,
            code: err.code || 'APPLICATION_ERROR'
        });
    }

    // Erro genérico (não expor detalhes em produção)
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
        ...(isDevelopment && {
            message: err.message,
            stack: err.stack
        })
    });
};

module.exports = errorHandler;
