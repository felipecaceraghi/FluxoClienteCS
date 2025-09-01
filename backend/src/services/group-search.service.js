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
            logger.info('=== Iniciando busca por grupo ===', { grupo: groupName });
            
            // 1. Baixar arquivo mais recente do SharePoint
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
            
            // 3. Filtrar primeiro por grupo (case-insensitive)
            const searchTermLower = groupName.toLowerCase().trim();
            let filteredCompanies = allCompanies.filter(company => {
                const companyGroup = company.grupo ? company.grupo.toLowerCase().trim() : '';
                return companyGroup.includes(searchTermLower);
            });

            // 4. LÓGICA DE FALLBACK: Se não encontrar por grupo, procurar no campo 'cliente'
            if (filteredCompanies.length === 0) {
                logger.info(`Nenhum resultado para "${groupName}" no campo 'grupo'. Buscando no campo 'cliente'...`);
                filteredCompanies = allCompanies.filter(company => {
                    // Assumindo que o nome do campo na planilha é 'cliente'
                    const companyClient = company.nome_fantasia ? company.nome_fantasia.toLowerCase().trim() : '';
                    return companyClient.includes(searchTermLower);
                });
            }

            // 5. Compilar resultado
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
