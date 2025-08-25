const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                error: 'Token de acesso requerido',
                code: 'TOKEN_REQUIRED'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Buscar usuário no banco
        const user = await userRepository.findById(decoded.userId);
        
        if (!user || !user.active) {
            return res.status(401).json({
                error: 'Usuário não encontrado ou inativo',
                code: 'USER_INVALID'
            });
        }

        // Adicionar usuário à requisição
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Token inválido',
                code: 'TOKEN_INVALID'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expirado',
                code: 'TOKEN_EXPIRED'
            });
        }

        console.error('Erro na autenticação:', error);
        return res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
};

module.exports = authenticateToken;
