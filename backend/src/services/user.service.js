const userRepository = require('../repositories/user.repository');
const logger = require('../utils/logger');

class UserService {
    // Listar todos os usuários (admin)
    async getAllUsers(includeInactive = false) {
        try {
            const users = await userRepository.getAll(includeInactive);
            
            return {
                success: true,
                data: users,
                total: users.length
            };
        } catch (error) {
            logger.error('Erro ao listar usuários:', error);
            throw new Error('Erro ao buscar usuários');
        }
    }

    // Buscar usuários com filtros e paginação
    async searchUsers(filters = {}, page = 1, limit = 10) {
        try {
            const result = await userRepository.search(filters, page, limit);
            
            return {
                success: true,
                data: result.users,
                pagination: result.pagination
            };
        } catch (error) {
            logger.error('Erro ao buscar usuários:', error);
            throw new Error('Erro ao buscar usuários');
        }
    }

    // Obter usuário por ID
    async getUserById(id) {
        try {
            const user = await userRepository.findByIdPublic(id);
            
            if (!user) {
                throw new Error('Usuário não encontrado');
            }

            return {
                success: true,
                data: user
            };
        } catch (error) {
            logger.error('Erro ao buscar usuário por ID:', error);
            throw error;
        }
    }

    // Criar novo usuário (admin)
    async createUser(userData, createdBy) {
        try {
            // Validações
            if (!userData.email || !userData.password || !userData.name) {
                throw new Error('Email, senha e nome são obrigatórios');
            }

            // Verificar se email já existe
            const emailExists = await userRepository.emailExists(userData.email);
            if (emailExists) {
                throw new Error('Email já está em uso');
            }

            // Validar role
            const validRoles = ['admin', 'user'];
            if (userData.role && !validRoles.includes(userData.role)) {
                throw new Error('Role inválida. Use: admin, user');
            }

            // Criar usuário
            const newUser = await userRepository.create({
                email: userData.email.toLowerCase().trim(),
                password: userData.password,
                name: userData.name.trim(),
                role: userData.role || 'user',
                active: userData.active !== undefined ? userData.active : true
            });

            logger.info('Usuário criado com sucesso', {
                newUserId: newUser.id,
                newUserEmail: newUser.email,
                newUserRole: newUser.role,
                createdBy: createdBy
            });

            return {
                success: true,
                data: newUser,
                message: 'Usuário criado com sucesso'
            };
        } catch (error) {
            logger.error('Erro ao criar usuário:', error);
            throw error;
        }
    }

    // Atualizar usuário (admin)
    async updateUser(id, userData, updatedBy) {
        try {
            // Verificar se usuário existe
            const existingUser = await userRepository.findByIdPublic(id);
            if (!existingUser) {
                throw new Error('Usuário não encontrado');
            }

            // Verificar se email já existe (excluindo o usuário atual)
            if (userData.email) {
                const emailExists = await userRepository.emailExists(userData.email, id);
                if (emailExists) {
                    throw new Error('Email já está em uso');
                }
                userData.email = userData.email.toLowerCase().trim();
            }

            // Validar role
            if (userData.role) {
                const validRoles = ['admin', 'user'];
                if (!validRoles.includes(userData.role)) {
                    throw new Error('Role inválida. Use: admin, user');
                }
            }

            // Sanitizar nome
            if (userData.name) {
                userData.name = userData.name.trim();
            }

            // Atualizar usuário
            const updatedUser = await userRepository.update(id, userData);

            logger.info('Usuário atualizado com sucesso', {
                userId: id,
                updatedFields: Object.keys(userData),
                updatedBy: updatedBy
            });

            return {
                success: true,
                data: updatedUser,
                message: 'Usuário atualizado com sucesso'
            };
        } catch (error) {
            logger.error('Erro ao atualizar usuário:', error);
            throw error;
        }
    }

    // Desativar usuário (soft delete)
    async deactivateUser(id, deactivatedBy) {
        try {
            // Verificar se usuário existe e está ativo
            const user = await userRepository.findByIdPublic(id);
            if (!user) {
                throw new Error('Usuário não encontrado');
            }

            if (!user.active) {
                throw new Error('Usuário já está desativado');
            }

            // Não permitir desativar o próprio usuário
            if (id === deactivatedBy) {
                throw new Error('Você não pode desativar sua própria conta');
            }

            const success = await userRepository.softDelete(id);
            
            if (!success) {
                throw new Error('Erro ao desativar usuário');
            }

            logger.warn('Usuário desativado', {
                userId: id,
                userEmail: user.email,
                deactivatedBy: deactivatedBy
            });

            return {
                success: true,
                message: 'Usuário desativado com sucesso'
            };
        } catch (error) {
            logger.error('Erro ao desativar usuário:', error);
            throw error;
        }
    }

    // Reativar usuário
    async reactivateUser(id, reactivatedBy) {
        try {
            // Verificar se usuário existe
            const user = await userRepository.findByIdPublic(id);
            if (!user) {
                throw new Error('Usuário não encontrado');
            }

            if (user.active) {
                throw new Error('Usuário já está ativo');
            }

            const success = await userRepository.reactivate(id);
            
            if (!success) {
                throw new Error('Erro ao reativar usuário');
            }

            logger.info('Usuário reativado', {
                userId: id,
                userEmail: user.email,
                reactivatedBy: reactivatedBy
            });

            return {
                success: true,
                message: 'Usuário reativado com sucesso'
            };
        } catch (error) {
            logger.error('Erro ao reativar usuário:', error);
            throw error;
        }
    }

    // Excluir usuário permanentemente (usar com cuidado!)
    async deleteUser(id, deletedBy) {
        try {
            // Verificar se usuário existe
            const user = await userRepository.findByIdPublic(id);
            if (!user) {
                throw new Error('Usuário não encontrado');
            }

            // Não permitir excluir o próprio usuário
            if (id === deletedBy) {
                throw new Error('Você não pode excluir sua própria conta');
            }

            const success = await userRepository.hardDelete(id);
            
            if (!success) {
                throw new Error('Erro ao excluir usuário');
            }

            logger.warn('Usuário excluído permanentemente', {
                userId: id,
                userEmail: user.email,
                userName: user.name,
                deletedBy: deletedBy
            });

            return {
                success: true,
                message: 'Usuário excluído permanentemente'
            };
        } catch (error) {
            logger.error('Erro ao excluir usuário:', error);
            throw error;
        }
    }

    // Alterar senha de usuário (admin)
    async changeUserPassword(id, newPassword, changedBy) {
        try {
            // Verificar se usuário existe
            const user = await userRepository.findByIdPublic(id);
            if (!user) {
                throw new Error('Usuário não encontrado');
            }

            // Validar senha
            if (!newPassword || newPassword.length < 6) {
                throw new Error('Senha deve ter pelo menos 6 caracteres');
            }

            const success = await userRepository.updatePassword(id, newPassword);
            
            if (!success) {
                throw new Error('Erro ao alterar senha');
            }

            logger.info('Senha alterada por admin', {
                userId: id,
                userEmail: user.email,
                changedBy: changedBy
            });

            return {
                success: true,
                message: 'Senha alterada com sucesso'
            };
        } catch (error) {
            logger.error('Erro ao alterar senha:', error);
            throw error;
        }
    }

    // Obter estatísticas de usuários
    async getUserStats() {
        try {
            const stats = await userRepository.getStats();
            
            return {
                success: true,
                data: stats
            };
        } catch (error) {
            logger.error('Erro ao obter estatísticas de usuários:', error);
            throw new Error('Erro ao buscar estatísticas');
        }
    }

    // Validar dados de usuário
    validateUserData(userData, isUpdate = false) {
        const errors = [];

        // Email
        if (!isUpdate || userData.email !== undefined) {
            if (!userData.email) {
                errors.push('Email é obrigatório');
            } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
                errors.push('Email deve ter um formato válido');
            }
        }

        // Nome
        if (!isUpdate || userData.name !== undefined) {
            if (!userData.name || userData.name.trim().length === 0) {
                errors.push('Nome é obrigatório');
            } else if (userData.name.trim().length < 2) {
                errors.push('Nome deve ter pelo menos 2 caracteres');
            }
        }

        // Senha (apenas na criação ou se fornecida na atualização)
        if (!isUpdate || userData.password) {
            if (!userData.password) {
                if (!isUpdate) {
                    errors.push('Senha é obrigatória');
                }
            } else if (userData.password.length < 6) {
                errors.push('Senha deve ter pelo menos 6 caracteres');
            }
        }

        // Role
        if (userData.role !== undefined) {
            const validRoles = ['admin', 'user'];
            if (!validRoles.includes(userData.role)) {
                errors.push('Role deve ser: admin ou user');
            }
        }

        return errors;
    }
}

module.exports = new UserService();
