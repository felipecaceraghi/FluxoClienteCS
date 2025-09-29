const companyRepository = require('../repositories/company.repository');
const logger = require('../utils/logger');

class CompanyService {
    async searchCompanies(query, page = 1, limit = 10) {
        try {
            const result = await companyRepository.search(query ? query.trim() : '', page, limit);
            
            return {
                success: true,
                data: result.companies,
                pagination: result.pagination
            };
        } catch (error) {
            console.error('Erro ao buscar empresas:', error);
            throw error;
        }
    }

    // Novo método para autocomplete de grupos e nomes
    async searchGroupsAndNames(query, limit = 20) {
        try {
            if (!query || query.trim().length < 2) {
                return {
                    success: true,
                    data: []
                };
            }
            
            const results = await companyRepository.searchGroupsAndNames(query.trim(), limit);
            return {
                success: true,
                data: results
            };
        } catch (error) {
            console.error('Erro ao buscar grupos e nomes:', error);
            throw error;
        }
    }

    async getCompanyByCode(codigo) {
        try {
            if (!codigo) {
                throw new Error('Código da empresa é obrigatório');
            }

            const company = await companyRepository.findByCode(codigo);
            
            if (!company) {
                throw new Error('Empresa não encontrada');
            }

            return {
                success: true,
                data: company
            };
        } catch (error) {
            console.error('Erro ao buscar empresa por código:', error);
            throw error;
        }
    }

    // Novo método para buscar dados completos da empresa das planilhas do SharePoint
    async getCompanyCompleteData(codigo) {
        try {
            if (!codigo) {
                throw new Error('Código da empresa é obrigatório');
            }

            // Primeiro verificar se a empresa existe no banco
            const basicCompany = await companyRepository.findByCode(codigo);
            if (!basicCompany) {
                throw new Error('Empresa não encontrada');
            }

            // Buscar dados completos das planilhas do SharePoint
            const planilhaSearchService = require('./planilha-search.service');
            
            logger.info(`🔍 Buscando dados completos para empresa código: ${codigo}`);
            
            const searchResult = await planilhaSearchService.pesquisaClientePorCodigo(codigo);
            
            if (!searchResult.success || !searchResult.rows || searchResult.rows.length === 0) {
                logger.warn(`⚠️ Dados completos não encontrados para empresa ${codigo}, usando dados básicos`);
                return {
                    success: true,
                    data: basicCompany,
                    source: 'database_only'
                };
            }

            // Combinar dados básicos do banco com dados completos do SharePoint
            const completeData = {
                ...basicCompany,
                ...searchResult.rows[0], // Dados detalhados da planilha
                source: 'sharepoint_enriched'
            };

            logger.info(`✅ Dados completos encontrados para empresa ${codigo}`);
            
            return {
                success: true,
                data: completeData,
                source: 'sharepoint_enriched'
            };

        } catch (error) {
            logger.error('Erro ao buscar dados completos da empresa:', error);
            throw error;
        }
    }

    async getAllCompanies() {
        try {
            const companies = await companyRepository.getAll();
            
            return {
                success: true,
                data: companies,
                total: companies.length
            };
        } catch (error) {
            console.error('Erro ao buscar todas as empresas:', error);
            throw error;
        }
    }

    async getCompaniesCount() {
        try {
            const companies = await companyRepository.getAll();
            
            return {
                success: true,
                count: companies.length
            };
        } catch (error) {
            console.error('Erro ao contar empresas:', error);
            throw error;
        }
    }

    async getCompaniesStats() {
        try {
            const stats = await companyRepository.getStats();
            
            return {
                success: true,
                data: {
                    total: stats.total,
                    comDadosSharePoint: stats.com_dados_sharepoint,
                    semDadosSharePoint: stats.total - stats.com_dados_sharepoint,
                    primeiraEmpresa: stats.primeira_empresa,
                    ultimaAtualizacao: stats.ultima_atualizacao
                }
            };
        } catch (error) {
            console.error('Erro ao buscar estatísticas das empresas:', error);
            throw error;
        }
    }

    async createCompany(companyData) {
        try {
            if (!companyData.codigo || !companyData.nome) {
                throw new Error('Código e nome da empresa são obrigatórios');
            }

            // Verificar se já existe
            const existing = await companyRepository.findByCode(companyData.codigo);
            if (existing) {
                throw new Error('Empresa com este código já existe');
            }

            const company = await companyRepository.create(companyData);
            
            return {
                success: true,
                data: company
            };
        } catch (error) {
            console.error('Erro ao criar empresa:', error);
            throw error;
        }
    }

    async updateCompany(codigo, companyData) {
        try {
            const company = await companyRepository.findByCode(codigo);
            
            if (!company) {
                throw new Error('Empresa não encontrada');
            }

            const updatedCompany = await companyRepository.update(company.id, companyData);
            
            return {
                success: true,
                data: updatedCompany
            };
        } catch (error) {
            console.error('Erro ao atualizar empresa:', error);
            throw error;
        }
    }

    async syncCompanyFromSharePoint(codigo, sharepointData) {
        try {
            if (!codigo) {
                throw new Error('Código da empresa é obrigatório');
            }

            const companyData = {
                nome: sharepointData.nome || `Empresa ${codigo}`,
                dados_sharepoint: sharepointData
            };

            const company = await companyRepository.upsertByCode(codigo, companyData);
            
            return {
                success: true,
                data: company,
                action: company.created_at === company.updated_at ? 'created' : 'updated'
            };
        } catch (error) {
            console.error('Erro ao sincronizar empresa do SharePoint:', error);
            throw error;
        }
    }

    async validateCompanyForReport(codigo) {
        try {
            const company = await this.getCompanyByCode(codigo);
            
            if (!company.success) {
                throw new Error('Empresa não encontrada');
            }

            // Verificar se tem dados suficientes para gerar relatório
            const companyData = company.data;
            
            if (!companyData.dados_sharepoint) {
                throw new Error('Empresa não possui dados do SharePoint para gerar relatório');
            }

            return {
                success: true,
                data: companyData,
                canGenerateReport: true
            };
        } catch (error) {
            console.error('Erro ao validar empresa para relatório:', error);
            throw error;
        }
    }
}

module.exports = new CompanyService();
