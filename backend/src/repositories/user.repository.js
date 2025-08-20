const db = require('../database/connection');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class UserRepository {
    async findByEmail(email) {
        try {
            const query = `
                SELECT id, email, password_hash, name, active, 
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
                SELECT id, email, password_hash, name, active,
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

    async create(userData) {
        try {
            const id = uuidv4();
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            
            const query = `
                INSERT INTO users (id, email, password_hash, name, active)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            await db.run(query, [
                id,
                userData.email,
                hashedPassword,
                userData.name,
                1
            ]);

            // Retornar usuário criado (sem senha)
            return await this.findById(id);
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
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
