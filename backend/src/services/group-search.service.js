const excelService = require('./excel.service');
const sharepointService = require('./sharepoint.service');
const logger = require('../utils/logger');

class GroupSearchService {
    constructor() {
        this.isSearching = false;
    }

    async searchByGroup(groupName) {
        if (this.isSearching) {
            logger.warn('Busca por grupo já está em execução, aguarde...');
            throw new Error('Busca por grupo já está em execução, tente novamente em alguns segundos');
        }

        this.isSearching = true;
        const startTime = new Date();
        
        try {
            logger.info('=== BUSCA EXATA POR GRUPO ATIVADA ===', { grupo: groupName });            // 1. Baixar arquivo mais recente do SharePoint
            logger.info('Baixando arquivo do SharePoint...');
            const downloadResult = await sharepointService.downloadFile();
            
            if (!downloadResult.success) {
                throw new Error(`Erro ao baixar arquivo: ${downloadResult.message}`);
            }

            logger.info('Arquivo baixado com sucesso', { 
                fileName: downloadResult.fileName,
                size: downloadResult.fileSize 
            });

            // 2. Processar dados completos do Excel
            logger.info('Processando dados completos da planilha...');
            const allCompanies = await excelService.parseFullCompanyData(downloadResult.filePath);
            
            // 3. Filtrar por grupo com busca exata
            const searchTermLower = groupName.toLowerCase().trim();
            
            // Determinar o termo de busca exato
            let searchTerm;
            if (searchTermLower.startsWith('grupo ')) {
                // Se já tem "grupo " no início, usar como está
                searchTerm = searchTermLower;
            } else {
                // Se não tem "grupo ", adicionar
                searchTerm = `grupo ${searchTermLower}`;
            }
            
            let filteredCompanies = allCompanies.filter(company => {
                const companyGroup = company.grupo ? company.grupo.toLowerCase().trim() : '';
                const match = companyGroup === searchTerm;
                if (match) {
                    logger.info(`MATCH: "${companyGroup}" === "${searchTerm}" para empresa: ${company.nome_fantasia}`);
                }
                return match;
            });
            
            logger.info(`Busca finalizada: termo="${searchTerm}", encontradas=${filteredCompanies.length}`);            // 4. LÓGICA DE FALLBACK: Se não encontrar por grupo, procurar no campo 'cliente'
            if (filteredCompanies.length === 0) {
                logger.info(`Nenhum resultado encontrado para "${groupName}" no campo 'grupo'. Busca exata - sem fallback.`);
                // FALLBACK DESABILITADO para busca exata apenas por grupo
            }            // 5. Compilar resultado
            const endTime = new Date();
            const duration = endTime - startTime;
            
            const result = {
                success: true,
                searchCriteria: {
                    termo_buscado: groupName,
                    busca_case_insensitive: true
                },
                summary: {
                    total_empresas_planilha: allCompanies.length,
                    empresas_encontradas: filteredCompanies.length,
                    arquivo_origem: downloadResult.fileName,
                    data_busca: endTime.toISOString(),
                    tempo_processamento: `${Math.round(duration / 1000)}s`
                },
                empresas: filteredCompanies
            };

            // 6. Log do resultado
            logger.info('=== Busca por grupo concluída ===', {
                grupo: groupName,
                totalEncontradas: filteredCompanies.length,
                totalPlanilha: allCompanies.length,
                duracao: `${Math.round(duration / 1000)}s`
            });

            return result;

        } catch (error) {
            logger.error('Erro durante busca por grupo:', error);
            
            return {
                success: false,
                error: error.message,
                searchCriteria: {
                    grupo: groupName
                },
                summary: {
                    empresas_encontradas: 0,
                    data_busca: new Date().toISOString()
                },
                empresas: []
            };
        } finally {
            this.isSearching = false;
        }
    }

    // Método para obter todos os grupos únicos disponíveis
    async getAvailableGroups() {
        try {
            logger.info('=== Obtendo grupos disponíveis ===');
            
            // Baixar arquivo do SharePoint
            const downloadResult = await sharepointService.downloadFile();
            
            if (!downloadResult.success) {
                throw new Error(`Erro ao baixar arquivo: ${downloadResult.message}`);
            }

            // Processar dados da planilha
            const allCompanies = await excelService.parseFullCompanyData(downloadResult.filePath);
            
            // Extrair grupos únicos
            const groupsSet = new Set();
            allCompanies.forEach(company => {
                if (company.grupo && company.grupo.trim()) {
                    groupsSet.add(company.grupo.trim());
                }
            });

            const uniqueGroups = Array.from(groupsSet).sort();

            return {
                success: true,
                total_grupos: uniqueGroups.length,
                total_empresas: allCompanies.length,
                grupos: uniqueGroups,
                data_busca: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Erro ao obter grupos disponíveis:', error);
            
            return {
                success: false,
                error: error.message,
                grupos: []
            };
        }
    }

    // Método para verificar se há busca em andamento
    isCurrentlySearching() {
        return this.isSearching;
    }
}

module.exports = new GroupSearchService();
