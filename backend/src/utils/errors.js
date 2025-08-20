class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

// Funções helper para criar erros comuns
const createError = {
    badRequest: (message, code = 'BAD_REQUEST') => new AppError(message, 400, code),
    unauthorized: (message = 'Não autorizado', code = 'UNAUTHORIZED') => new AppError(message, 401, code),
    forbidden: (message = 'Acesso negado', code = 'FORBIDDEN') => new AppError(message, 403, code),
    notFound: (message = 'Recurso não encontrado', code = 'NOT_FOUND') => new AppError(message, 404, code),
    conflict: (message, code = 'CONFLICT') => new AppError(message, 409, code),
    tooManyRequests: (message = 'Muitas tentativas', code = 'TOO_MANY_REQUESTS') => new AppError(message, 429, code),
    internal: (message = 'Erro interno do servidor', code = 'INTERNAL_ERROR') => new AppError(message, 500, code)
};

module.exports = {
    AppError,
    createError
};
