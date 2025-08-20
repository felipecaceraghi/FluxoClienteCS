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
                SELECT id, codigo, nome, dados_sharepoint, created_at, updated_at
                FROM companies 
                WHERE codigo = ? AND active = 1
            `;
            
            const company = await db.get(query, [codigo]);
            
            // Parse dos dados do SharePoint se existirem
            if (company && company.dados_sharepoint) {
                try {
                    company.dados_sharepoint = JSON.parse(company.dados_sharepoint);
                } catch (e) {
                    console.warn('Erro ao fazer parse dos dados do SharePoint:', e);
                    company.dados_sharepoint = null;
                }
            }
            
            return company;
        } catch (error) {
            console.error('Erro ao buscar empresa por código:', error);
            throw error;
        }
    }

    async findById(id) {
        try {
            const query = `
                SELECT id, codigo, nome, dados_sharepoint, created_at, updated_at
                FROM companies 
                WHERE id = ? AND active = 1
            `;
            
            const company = await db.get(query, [id]);
            
            if (company && company.dados_sharepoint) {
                try {
                    company.dados_sharepoint = JSON.parse(company.dados_sharepoint);
                } catch (e) {
                    console.warn('Erro ao fazer parse dos dados do SharePoint:', e);
                    company.dados_sharepoint = null;
                }
            }
            
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
                INSERT INTO companies (id, codigo, nome, dados_sharepoint, active)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            const dadosSharePoint = companyData.dados_sharepoint 
                ? JSON.stringify(companyData.dados_sharepoint) 
                : null;
            
            await db.run(query, [
                id,
                companyData.codigo,
                companyData.nome,
                dadosSharePoint,
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
            
            if (companyData.dados_sharepoint !== undefined) {
                fields.push('dados_sharepoint = ?');
                values.push(companyData.dados_sharepoint ? JSON.stringify(companyData.dados_sharepoint) : null);
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
                SELECT id, codigo, nome, created_at, updated_at
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
                    COUNT(CASE WHEN dados_sharepoint IS NOT NULL THEN 1 END) as com_dados_sharepoint,
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
}

module.exports = new CompanyRepository();
