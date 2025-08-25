const db = require('../database/connection');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class UserRepository {
    async findByEmail(email) {
        try {
            const query = `
                SELECT id, email, password_hash, name, role, active, 
                       reset_token, reset_token_expires,
                       created_at, updated_at
                FROM users 
                WHERE email = ? AND active = 1
            `;
            
            const user = await db.get(query, [email]);
            return user;
        } catch (error) {
            console.error('Erro ao buscar usuário por email:', error);
            throw error;
        }
    }

    async findById(id) {
        try {
            const query = `
                SELECT id, email, password_hash, name, role, active,
                       reset_token, reset_token_expires,
                       created_at, updated_at
                FROM users 
                WHERE id = ? AND active = 1
            `;
            
            const user = await db.get(query, [id]);
            return user;
        } catch (error) {
            console.error('Erro ao buscar usuário por ID:', error);
            throw error;
        }
    }

    // Novo método para buscar usuário com dados públicos (sem senha)
    async findByIdPublic(id) {
        try {
            const query = `
                SELECT id, email, name, role, active, created_at, updated_at
                FROM users 
                WHERE id = ?
            `;
            
            const user = await db.get(query, [id]);
            return user;
        } catch (error) {
            console.error('Erro ao buscar usuário por ID (público):', error);
            throw error;
        }
    }

    // Listar todos os usuários (admin)
    async getAll(includeInactive = false) {
        try {
            const query = `
                SELECT id, email, name, role, active, created_at, updated_at
                FROM users 
                ${includeInactive ? '' : 'WHERE active = 1'}
                ORDER BY created_at DESC
            `;
            
            const users = await db.query(query);
            return users;
        } catch (error) {
            console.error('Erro ao listar usuários:', error);
            throw error;
        }
    }

    // Buscar usuários com paginação e filtros
    async search(filters = {}, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            let whereConditions = [];
            let params = [];

            // Filtros
            if (filters.email) {
                whereConditions.push('email LIKE ?');
                params.push(`%${filters.email}%`);
            }

            if (filters.name) {
                whereConditions.push('name LIKE ?');
                params.push(`%${filters.name}%`);
            }

            if (filters.role) {
                whereConditions.push('role = ?');
                params.push(filters.role);
            }

            if (filters.active !== undefined) {
                whereConditions.push('active = ?');
                params.push(filters.active ? 1 : 0);
            } else {
                // Por padrão, mostrar apenas ativos
                whereConditions.push('active = 1');
            }

            const whereClause = whereConditions.length > 0 ? 
                `WHERE ${whereConditions.join(' AND ')}` : '';

            // Query principal
            const query = `
                SELECT id, email, name, role, active, created_at, updated_at
                FROM users 
                ${whereClause}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `;

            // Query para contar total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM users 
                ${whereClause}
            `;

            const users = await db.query(query, [...params, limit, offset]);
            const countResult = await db.get(countQuery, params);
            const total = countResult.total;

            return {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            throw error;
        }
    }

    async create(userData) {
        try {
            const id = uuidv4();
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            
            const query = `
                INSERT INTO users (id, email, password_hash, name, role, active)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            await db.run(query, [
                id,
                userData.email,
                hashedPassword,
                userData.name,
                userData.role || 'user',
                userData.active !== undefined ? userData.active : 1
            ]);

            // Retornar usuário criado (sem senha)
            return await this.findByIdPublic(id);
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            throw error;
        }
    }

    // Atualizar usuário (admin)
    async update(id, userData) {
        try {
            let setClause = [];
            let params = [];

            // Campos que podem ser atualizados
            if (userData.name !== undefined) {
                setClause.push('name = ?');
                params.push(userData.name);
            }

            if (userData.email !== undefined) {
                setClause.push('email = ?');
                params.push(userData.email);
            }

            if (userData.role !== undefined) {
                setClause.push('role = ?');
                params.push(userData.role);
            }

            if (userData.active !== undefined) {
                setClause.push('active = ?');
                params.push(userData.active ? 1 : 0);
            }

            // Se uma nova senha foi fornecida
            if (userData.password) {
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                setClause.push('password_hash = ?');
                params.push(hashedPassword);
            }

            if (setClause.length === 0) {
                throw new Error('Nenhum campo para atualizar foi fornecido');
            }

            setClause.push('updated_at = CURRENT_TIMESTAMP');
            params.push(id);

            const query = `
                UPDATE users 
                SET ${setClause.join(', ')}
                WHERE id = ?
            `;

            const result = await db.run(query, params);
            
            if (result.changes === 0) {
                throw new Error('Usuário não encontrado');
            }

            // Retornar usuário atualizado
            return await this.findByIdPublic(id);
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            throw error;
        }
    }

    // Soft delete (marcar como inativo)
    async softDelete(id) {
        try {
            const query = `
                UPDATE users 
                SET active = 0, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND active = 1
            `;

            const result = await db.run(query, [id]);
            return result.changes > 0;
        } catch (error) {
            console.error('Erro ao desativar usuário:', error);
            throw error;
        }
    }

    // Hard delete (remover permanentemente)
    async hardDelete(id) {
        try {
            const query = `DELETE FROM users WHERE id = ?`;
            const result = await db.run(query, [id]);
            return result.changes > 0;
        } catch (error) {
            console.error('Erro ao excluir usuário permanentemente:', error);
            throw error;
        }
    }

    // Reativar usuário
    async reactivate(id) {
        try {
            const query = `
                UPDATE users 
                SET active = 1, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            const result = await db.run(query, [id]);
            return result.changes > 0;
        } catch (error) {
            console.error('Erro ao reativar usuário:', error);
            throw error;
        }
    }

    // Verificar se email já existe (para validação)
    async emailExists(email, excludeId = null) {
        try {
            let query = `SELECT id FROM users WHERE email = ?`;
            let params = [email];

            if (excludeId) {
                query += ` AND id != ?`;
                params.push(excludeId);
            }

            const user = await db.get(query, params);
            return !!user;
        } catch (error) {
            console.error('Erro ao verificar se email existe:', error);
            throw error;
        }
    }

    // Obter estatísticas de usuários
    async getStats() {
        try {
            const stats = await db.get(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN active = 1 THEN 1 END) as active,
                    COUNT(CASE WHEN active = 0 THEN 1 END) as inactive,
                    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
                    COUNT(CASE WHEN role = 'user' THEN 1 END) as users
                FROM users
            `);

            return stats;
        } catch (error) {
            console.error('Erro ao obter estatísticas de usuários:', error);
            throw error;
        }
    }

    async validatePassword(plainPassword, hashedPassword) {
        try {
            return await bcrypt.compare(plainPassword, hashedPassword);
        } catch (error) {
            console.error('Erro ao validar senha:', error);
            throw error;
        }
    }

    async setResetToken(email, token, expiresAt) {
        try {
            const query = `
                UPDATE users 
                SET reset_token = ?, reset_token_expires = ?, updated_at = CURRENT_TIMESTAMP
                WHERE email = ? AND active = 1
            `;
            
            const result = await db.run(query, [token, expiresAt, email]);
            return result.changes > 0;
        } catch (error) {
            console.error('Erro ao definir token de reset:', error);
            throw error;
        }
    }

    async findByResetToken(token) {
        try {
            const query = `
                SELECT id, email, name, reset_token_expires
                FROM users 
                WHERE reset_token = ? AND active = 1
                AND reset_token_expires > datetime('now')
            `;
            
            const user = await db.get(query, [token]);
            return user;
        } catch (error) {
            console.error('Erro ao buscar usuário por token de reset:', error);
            throw error;
        }
    }

    async updatePassword(userId, newPassword) {
        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            const query = `
                UPDATE users 
                SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND active = 1
            `;
            
            const result = await db.run(query, [hashedPassword, userId]);
            return result.changes > 0;
        } catch (error) {
            console.error('Erro ao atualizar senha:', error);
            throw error;
        }
    }

    async updateLastLogin(userId) {
        try {
            const query = `
                UPDATE users 
                SET updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND active = 1
            `;
            
            await db.run(query, [userId]);
        } catch (error) {
            console.error('Erro ao atualizar último login:', error);
            // Não falha a operação se não conseguir atualizar
        }
    }
}

module.exports = new UserRepository();
