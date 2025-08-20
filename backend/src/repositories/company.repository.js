const db = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

class CompanyRepository {
    async search(query, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            
            // Busca por código ou nome
            const searchQuery = `
                SELECT id, codigo, nome, created_at, updated_at
                FROM companies 
                WHERE active = 1 
                AND (LOWER(codigo) LIKE LOWER(?) OR LOWER(nome) LIKE LOWER(?))
                ORDER BY nome ASC
                LIMIT ? OFFSET ?
            `;
            
            const searchTerm = `%${query}%`;
            const companies = await db.query(searchQuery, [searchTerm, searchTerm, limit, offset]);

            // Contar total para paginação
            const countQuery = `
                SELECT COUNT(*) as total
                FROM companies 
                WHERE active = 1 
                AND (LOWER(codigo) LIKE LOWER(?) OR LOWER(nome) LIKE LOWER(?))
            `;
            
            const countResult = await db.get(countQuery, [searchTerm, searchTerm]);
            const total = countResult.total;

            return {
                companies,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            console.error('Erro ao buscar empresas:', error);
            throw error;
        }
    }

    async findByCode(codigo) {
        try {
            const query = `
                SELECT id, codigo, nome, grupo, created_at, updated_at
                FROM companies 
                WHERE codigo = ? AND active = 1
            `;
            
            const company = await db.get(query, [codigo]);
            return company;
        } catch (error) {
            console.error('Erro ao buscar empresa por código:', error);
            throw error;
        }
    }

    async findById(id) {
        try {
            const query = `
                SELECT id, codigo, nome, grupo, created_at, updated_at
                FROM companies 
                WHERE id = ? AND active = 1
            `;
            
            const company = await db.get(query, [id]);
            return company;
        } catch (error) {
            console.error('Erro ao buscar empresa por ID:', error);
            throw error;
        }
    }

    async create(companyData) {
        try {
            const id = uuidv4();
            
            const query = `
                INSERT INTO companies (id, codigo, nome, grupo, active)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            await db.run(query, [
                id,
                companyData.codigo,
                companyData.nome,
                companyData.grupo || null,
                1
            ]);

            return await this.findById(id);
        } catch (error) {
            console.error('Erro ao criar empresa:', error);
            throw error;
        }
    }

    async update(id, companyData) {
        try {
            const fields = [];
            const values = [];
            
            if (companyData.nome !== undefined) {
                fields.push('nome = ?');
                values.push(companyData.nome);
            }
            
            if (companyData.grupo !== undefined) {
                fields.push('grupo = ?');
                values.push(companyData.grupo);
            }
            
            if (fields.length === 0) {
                throw new Error('Nenhum campo para atualizar');
            }
            
            fields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);
            
            const query = `
                UPDATE companies 
                SET ${fields.join(', ')}
                WHERE id = ? AND active = 1
            `;
            
            const result = await db.run(query, values);
            
            if (result.changes === 0) {
                throw new Error('Empresa não encontrada');
            }
            
            return await this.findById(id);
        } catch (error) {
            console.error('Erro ao atualizar empresa:', error);
            throw error;
        }
    }

    async upsertByCode(codigo, companyData) {
        try {
            // Verificar se empresa já existe
            const existing = await this.findByCode(codigo);
            
            if (existing) {
                // Atualizar empresa existente
                return await this.update(existing.id, companyData);
            } else {
                // Criar nova empresa
                return await this.create({
                    codigo,
                    ...companyData
                });
            }
        } catch (error) {
            console.error('Erro ao fazer upsert da empresa:', error);
            throw error;
        }
    }

    async getAll() {
        try {
            const query = `
                SELECT id, codigo, nome, grupo, created_at, updated_at
                FROM companies 
                WHERE active = 1
                ORDER BY nome ASC
            `;
            
            const companies = await db.query(query);
            return companies;
        } catch (error) {
            console.error('Erro ao buscar todas as empresas:', error);
            throw error;
        }
    }

    async getStats() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN grupo IS NOT NULL THEN 1 END) as com_grupo,
                    MIN(created_at) as primeira_empresa,
                    MAX(updated_at) as ultima_atualizacao
                FROM companies 
                WHERE active = 1
            `;
            
            const stats = await db.get(query);
            return stats;
        } catch (error) {
            console.error('Erro ao buscar estatísticas das empresas:', error);
            throw error;
        }
    }

    // Métodos específicos para sincronização
    async getAllActiveCodes() {
        try {
            const query = `
                SELECT codigo FROM companies 
                WHERE active = 1
            `;
            
            const result = await db.query(query);
            return result.map(row => row.codigo);
        } catch (error) {
            console.error('Erro ao buscar códigos ativos:', error);
            throw error;
        }
    }

    async deactivateByCode(codigo) {
        try {
            const query = `
                UPDATE companies 
                SET active = 0, updated_at = CURRENT_TIMESTAMP
                WHERE codigo = ? AND active = 1
            `;
            
            const result = await db.run(query, [codigo]);
            return result.changes > 0;
        } catch (error) {
            console.error('Erro ao desativar empresa:', error);
            throw error;
        }
    }

    async upsertFromSharePoint(companyData) {
        try {
            // Verificar se empresa já existe
            const existing = await this.findByCode(companyData.codigo);
            
            if (existing) {
                // Verificar se precisa atualizar
                const needsUpdate = 
                    existing.nome !== companyData.nome || 
                    existing.grupo !== companyData.grupo;
                
                if (needsUpdate) {
                    const updated = await this.update(existing.id, {
                        nome: companyData.nome,
                        grupo: companyData.grupo
                    });
                    return { action: 'updated', company: updated };
                } else {
                    return { action: 'unchanged', company: existing };
                }
            } else {
                // Criar nova empresa
                const created = await this.create(companyData);
                return { action: 'created', company: created };
            }
        } catch (error) {
            console.error('Erro no upsert da empresa:', error);
            throw error;
        }
    }

    async bulkUpsertFromSharePoint(companiesData) {
        try {
            const results = {
                created: 0,
                updated: 0,
                unchanged: 0,
                errors: 0,
                companies: []
            };

            for (const companyData of companiesData) {
                try {
                    const result = await this.upsertFromSharePoint(companyData);
                    results[result.action]++;
                    results.companies.push({
                        codigo: companyData.codigo,
                        action: result.action,
                        company: result.company
                    });
                } catch (error) {
                    results.errors++;
                    console.error(`Erro ao processar empresa ${companyData.codigo}:`, error);
                }
            }

            return results;
        } catch (error) {
            console.error('Erro no bulk upsert:', error);
            throw error;
        }
    }
}

module.exports = new CompanyRepository();
