const logger = require('../utils/logger');

// Middleware para verificar se o usuário é admin
const requireAdmin = (req, res, next) => {
    try {
        // Verificar se o usuário está autenticado (middleware de auth deve vir antes)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Token de autenticação necessário',
                code: 'AUTH_REQUIRED'
            });
        }

        // Verificar se o usuário tem role de admin
        if (req.user.role !== 'admin') {
            logger.warn('Tentativa de acesso admin negada', {
                userId: req.user.id,
                email: req.user.email,
                role: req.user.role,
                endpoint: req.originalUrl,
                method: req.method
            });

            return res.status(403).json({
                success: false,
                error: 'Acesso negado. Apenas administradores podem realizar esta ação.',
                code: 'ADMIN_REQUIRED'
            });
        }

        // Se chegou até aqui, é admin - prosseguir
        logger.info('Acesso admin autorizado', {
            userId: req.user.id,
            email: req.user.email,
            endpoint: req.originalUrl,
            method: req.method
        });

        next();
    } catch (error) {
        logger.error('Erro no middleware requireAdmin', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
};

// Middleware mais flexível que verifica role específica
const requireRole = (requiredRole) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Token de autenticação necessário',
                    code: 'AUTH_REQUIRED'
                });
            }

            if (req.user.role !== requiredRole) {
                logger.warn('Tentativa de acesso com role insuficiente', {
                    userId: req.user.id,
                    email: req.user.email,
                    userRole: req.user.role,
                    requiredRole: requiredRole,
                    endpoint: req.originalUrl,
                    method: req.method
                });

                return res.status(403).json({
                    success: false,
                    error: `Acesso negado. Role '${requiredRole}' necessária.`,
                    code: 'INSUFFICIENT_ROLE'
                });
            }

            next();
        } catch (error) {
            logger.error('Erro no middleware requireRole', error);
            return res.status(500).json({
                success: false,
                error: 'Erro interno do servidor'
            });
        }
    };
};

// Middleware que permite múltiplas roles
const requireAnyRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Token de autenticação necessário',
                    code: 'AUTH_REQUIRED'
                });
            }

            if (!allowedRoles.includes(req.user.role)) {
                logger.warn('Tentativa de acesso com role não permitida', {
                    userId: req.user.id,
                    email: req.user.email,
                    userRole: req.user.role,
                    allowedRoles: allowedRoles,
                    endpoint: req.originalUrl,
                    method: req.method
                });

                return res.status(403).json({
                    success: false,
                    error: `Acesso negado. Uma das seguintes roles é necessária: ${allowedRoles.join(', ')}`,
                    code: 'INSUFFICIENT_ROLE'
                });
            }

            next();
        } catch (error) {
            logger.error('Erro no middleware requireAnyRole', error);
            return res.status(500).json({
                success: false,
                error: 'Erro interno do servidor'
            });
        }
    };
};

module.exports = {
    requireAdmin,
    requireRole,
    requireAnyRole
};
