const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userRepository = require('../repositories/user.repository');

class AuthService {
    async login(email, password) {
        try {
            // Buscar usuário por email
            const user = await userRepository.findByEmail(email);
            
            if (!user) {
                throw new Error('Credenciais inválidas');
            }

            // Validar senha
            const isValidPassword = await userRepository.validatePassword(password, user.password_hash);
            
            if (!isValidPassword) {
                throw new Error('Credenciais inválidas');
            }

            // Gerar JWT token
            const token = this.generateToken(user.id);

            // Atualizar último login
            await userRepository.updateLastLogin(user.id);

            // Retornar dados do usuário (sem senha) e token
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                },
                token
            };
        } catch (error) {
            console.error('Erro no login:', error);
            throw error;
        }
    }

    async forgotPassword(email) {
        try {
            // Verificar se usuário existe
            const user = await userRepository.findByEmail(email);
            
            if (!user) {
                // Por segurança, não revelar se email existe ou não
                return { message: 'Se o email existir, você receberá instruções para reset' };
            }

            // Gerar token de reset
            const resetToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hora

            // Salvar token no banco
            await userRepository.setResetToken(email, resetToken, expiresAt.toISOString());

            // TODO: Enviar email com o token
            // await emailService.sendPasswordReset(email, resetToken);

            return { 
                message: 'Se o email existir, você receberá instruções para reset',
                // Em desenvolvimento, retornar o token (remover em produção)
                ...(process.env.NODE_ENV === 'development' && { resetToken })
            };
        } catch (error) {
            console.error('Erro no forgot password:', error);
            throw error;
        }
    }

    async resetPassword(token, newPassword) {
        try {
            // Buscar usuário pelo token válido
            const user = await userRepository.findByResetToken(token);
            
            if (!user) {
                throw new Error('Token inválido ou expirado');
            }

            // Atualizar senha
            const success = await userRepository.updatePassword(user.id, newPassword);
            
            if (!success) {
                throw new Error('Erro ao atualizar senha');
            }

            return { message: 'Senha atualizada com sucesso' };
        } catch (error) {
            console.error('Erro no reset password:', error);
            throw error;
        }
    }

    generateToken(userId) {
        return jwt.sign(
            { userId },
            process.env.JWT_SECRET,
            { 
                expiresIn: process.env.JWT_EXPIRES_IN || '24h',
                issuer: 'fluxoclientecs-backend'
            }
        );
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error('Token inválido');
        }
    }

    async validateUser(userId) {
        try {
            const user = await userRepository.findById(userId);
            
            if (!user || !user.active) {
                throw new Error('Usuário não encontrado ou inativo');
            }

            return {
                id: user.id,
                email: user.email,
                name: user.name
            };
        } catch (error) {
            console.error('Erro ao validar usuário:', error);
            throw error;
        }
    }
}

module.exports = new AuthService();
