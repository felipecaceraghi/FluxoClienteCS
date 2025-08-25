const userService = require('../services/user.service');
const logger = require('../utils/logger');

class UserController {
    // GET /api/users - Listar usuários com filtros e paginação
    async getUsers(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                email,
                name,
                role,
                active,
                includeInactive
            } = req.query;

            const filters = {};
            
            // Aplicar filtros se fornecidos
            if (email) filters.email = email;
            if (name) filters.name = name;
            if (role) filters.role = role;
            if (active !== undefined) filters.active = active === 'true';

            let result;

            // Se não há filtros específicos, usar método simples
            if (Object.keys(filters).length === 0 && !email && !name && !role && active === undefined) {
                result = await userService.getAllUsers(includeInactive === 'true');
            } else {
                // Usar busca com filtros e paginação
                result = await userService.searchUsers(filters, parseInt(page), parseInt(limit));
            }

            res.json(result);
        } catch (error) {
            logger.error('Erro ao buscar usuários:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor',
                message: error.message
            });
        }
    }

    // GET /api/users/:id - Obter usuário por ID
    async getUserById(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || typeof id !== 'string' || id.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'ID do usuário inválido'
                });
            }

            const result = await userService.getUserById(id);
            res.json(result);
        } catch (error) {
            logger.error('Erro ao buscar usuário:', error);
            
            if (error.message === 'Usuário não encontrado') {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor',
                message: error.message
            });
        }
    }

    // POST /api/users - Criar novo usuário
    async createUser(req, res) {
        try {
            const userData = req.body;
            const createdBy = req.user.id;

            // Validar dados
            const validationErrors = userService.validateUserData(userData, false);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Dados inválidos',
                    details: validationErrors
                });
            }

            const result = await userService.createUser(userData, createdBy);
            res.status(201).json(result);
        } catch (error) {
            logger.error('Erro ao criar usuário:', error);
            
            if (error.message.includes('já está em uso') || 
                error.message.includes('obrigatório') ||
                error.message.includes('inválida')) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor',
                message: error.message
            });
        }
    }

    // PUT /api/users/:id - Atualizar usuário
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const userData = req.body;
            const updatedBy = req.user.id;

            if (!id || typeof id !== 'string' || id.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'ID do usuário inválido'
                });
            }

            // Validar dados
            const validationErrors = userService.validateUserData(userData, true);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Dados inválidos',
                    details: validationErrors
                });
            }

            const result = await userService.updateUser(id, userData, updatedBy);
            res.json(result);
        } catch (error) {
            logger.error('Erro ao atualizar usuário:', error);
            
            if (error.message === 'Usuário não encontrado') {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            if (error.message.includes('já está em uso') || 
                error.message.includes('inválida')) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor',
                message: error.message
            });
        }
    }

    // PATCH /api/users/:id/deactivate - Desativar usuário
    async deactivateUser(req, res) {
        try {
            const { id } = req.params;
            const deactivatedBy = req.user.id;

            if (!id || typeof id !== 'string' || id.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'ID do usuário inválido'
                });
            }

            const result = await userService.deactivateUser(id, deactivatedBy);
            res.json(result);
        } catch (error) {
            logger.error('Erro ao desativar usuário:', error);
            
            if (error.message === 'Usuário não encontrado') {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            if (error.message.includes('já está desativado') ||
                error.message.includes('não pode desativar sua própria conta')) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor',
                message: error.message
            });
        }
    }

    // PATCH /api/users/:id/reactivate - Reativar usuário
    async reactivateUser(req, res) {
        try {
            const { id } = req.params;
            const reactivatedBy = req.user.id;

            if (!id || typeof id !== 'string' || id.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'ID do usuário inválido'
                });
            }

            const result = await userService.reactivateUser(id, reactivatedBy);
            res.json(result);
        } catch (error) {
            logger.error('Erro ao reativar usuário:', error);
            
            if (error.message === 'Usuário não encontrado') {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            if (error.message.includes('já está ativo')) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor',
                message: error.message
            });
        }
    }

    // DELETE /api/users/:id - Excluir usuário permanentemente
    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const deletedBy = req.user.id;

            if (!id || typeof id !== 'string' || id.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'ID do usuário inválido'
                });
            }

            const result = await userService.deleteUser(id, deletedBy);
            res.json(result);
        } catch (error) {
            logger.error('Erro ao excluir usuário:', error);
            
            if (error.message === 'Usuário não encontrado') {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            if (error.message.includes('não pode excluir sua própria conta')) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor',
                message: error.message
            });
        }
    }

    // PATCH /api/users/:id/password - Alterar senha do usuário
    async changePassword(req, res) {
        try {
            const { id } = req.params;
            const { newPassword } = req.body;
            const changedBy = req.user.id;

            if (!id || typeof id !== 'string' || id.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'ID do usuário inválido'
                });
            }

            if (!newPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Nova senha é obrigatória'
                });
            }

            const result = await userService.changeUserPassword(id, newPassword, changedBy);
            res.json(result);
        } catch (error) {
            logger.error('Erro ao alterar senha:', error);
            
            if (error.message === 'Usuário não encontrado') {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            if (error.message.includes('pelo menos 6 caracteres')) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor',
                message: error.message
            });
        }
    }

    // GET /api/users/stats - Obter estatísticas de usuários
    async getUserStats(req, res) {
        try {
            const result = await userService.getUserStats();
            res.json(result);
        } catch (error) {
            logger.error('Erro ao obter estatísticas:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor',
                message: error.message
            });
        }
    }

    // GET /api/users/me - Obter dados do usuário atual
    async getCurrentUser(req, res) {
        try {
            const userId = req.user.id;
            const result = await userService.getUserById(userId);
            res.json(result);
        } catch (error) {
            logger.error('Erro ao obter usuário atual:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor',
                message: error.message
            });
        }
    }
}

module.exports = new UserController();
