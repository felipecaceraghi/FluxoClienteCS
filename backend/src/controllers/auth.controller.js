const authService = require('../services/auth.service');

class AuthController {
    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            const result = await authService.login(email, password);

            res.json({
                success: true,
                message: 'Login realizado com sucesso',
                data: result
            });
        } catch (error) {
            if (error.message === 'Credenciais inválidas') {
                return res.status(401).json({
                    success: false,
                    error: 'Email ou senha incorretos',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            next(error);
        }
    }

    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;

            const result = await authService.forgotPassword(email);

            res.json({
                success: true,
                message: result.message,
                // Em desenvolvimento, incluir o token
                ...(process.env.NODE_ENV === 'development' && result.resetToken && {
                    resetToken: result.resetToken
                })
            });
        } catch (error) {
            next(error);
        }
    }

    async resetPassword(req, res, next) {
        try {
            const { token, newPassword } = req.body;

            const result = await authService.resetPassword(token, newPassword);

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            if (error.message === 'Token inválido ou expirado') {
                return res.status(400).json({
                    success: false,
                    error: 'Token inválido ou expirado',
                    code: 'INVALID_TOKEN'
                });
            }

            next(error);
        }
    }

    async validateToken(req, res, next) {
        try {
            // Middleware de auth já validou o token e adicionou user ao req
            const user = req.user;

            res.json({
                success: true,
                message: 'Token válido',
                data: {
                    user
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async logout(req, res, next) {
        try {
            // Com JWT, o logout é feito no frontend removendo o token
            // Aqui apenas confirmamos que foi "deslogado"
            
            res.json({
                success: true,
                message: 'Logout realizado com sucesso'
            });
        } catch (error) {
            next(error);
        }
    }

    async me(req, res, next) {
        try {
            // Retornar dados do usuário logado
            const user = req.user;

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        active: user.active
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
