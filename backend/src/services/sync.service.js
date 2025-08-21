const companyRepository = require('../repositories/company.repository');
const excelService = require('./excel.service');
const sharepointService = require('./sharepoint.service');
const logger = require('../utils/logger');

class SyncService {
    constructor() {
        this.isRunning = false;
        this.lastSyncDate = null;
        this.syncStats = {
            companies: {
                totalProcessed: 0,
                created: 0,
                updated: 0,
                unchanged: 0,
                deactivated: 0,
                errors: 0
            }
        };
    }

    async syncFromSharePoint() {
        if (this.isRunning) {
            logger.warn('Sincronização já está em execução, pulando...');
            return { success: false, message: 'Sync already running' };
        }

        this.isRunning = true;
        const startTime = new Date();
        
        try {
            logger.info('=== Iniciando sincronização com SharePoint ===');
            
            // 1. Baixar arquivo do SharePoint
            logger.info('Baixando arquivo do SharePoint...');
            const downloadResult = await sharepointService.downloadFile();
            
            if (!downloadResult.success) {
                throw new Error(`Erro ao baixar arquivo: ${downloadResult.message}`);
            }

            // 2. Processar dados do Excel
            logger.info('Processando dados do Excel...');
            
            // Sincronizar empresas
            const companiesResult = await this.syncCompanies(downloadResult.filePath);

            // 3. Compilar estatísticas finais
            const endTime = new Date();
            const duration = endTime - startTime;
            
            this.syncStats.companies = companiesResult;
            this.syncStats.duration = `${Math.round(duration / 1000)}s`;
            this.syncStats.timestamp = endTime.toISOString();

            this.lastSyncDate = endTime;

            // 4. Log do resultado
            logger.info('=== Sincronização concluída ===');
            logger.info('EMPRESAS:');
            logger.info(`  Total processado: ${this.syncStats.companies.totalProcessed}`);
            logger.info(`  Criadas: ${this.syncStats.companies.created}`);
            logger.info(`  Atualizadas: ${this.syncStats.companies.updated}`);
            logger.info(`  Desativadas: ${this.syncStats.companies.deactivated}`);
            logger.info(`  Erros: ${this.syncStats.companies.errors}`);
            
            logger.info(`Duração total: ${this.syncStats.duration}`);

            return {
                success: true,
                stats: this.syncStats,
                message: 'Sincronização concluída com sucesso'
            };

        } catch (error) {
            logger.error('Erro durante sincronização:', error);
            
            return {
                success: false,
                error: error.message,
                stats: this.syncStats
            };
        } finally {
            this.isRunning = false;
        }
    }

    async syncCompanies(filePath) {
        try {
            logger.info('--- Sincronizando empresas ---');
            
            // Processar dados básicos das empresas
            const companiesFromExcel = await excelService.parseCompaniesData(filePath);
            
            if (!companiesFromExcel || companiesFromExcel.length === 0) {
                logger.warn('Nenhum dado de empresa encontrado no arquivo Excel');
                return {
                    totalProcessed: 0,
                    created: 0,
                    updated: 0,
                    unchanged: 0,
                    deactivated: 0,
                    errors: 0
                };
            }

            logger.info(`${companiesFromExcel.length} empresas encontradas no Excel`);

            // Obter códigos ativos no banco
            const activeCodesInDB = await companyRepository.getAllActiveCodes();
            logger.info(`${activeCodesInDB.length} empresas ativas no banco`);

            // Processar upserts (criar/atualizar)
            logger.info('Processando criações e atualizações de empresas...');
            const upsertResult = await companyRepository.bulkUpsertFromSharePoint(companiesFromExcel);
            
            // Identificar empresas para desativar
            const codesFromExcel = new Set(companiesFromExcel.map(c => c.codigo));
            const codesToDeactivate = activeCodesInDB.filter(code => !codesFromExcel.has(code));
            
            // Desativar empresas que não estão mais no Excel
            let deactivated = 0;
            let additionalErrors = 0;
            if (codesToDeactivate.length > 0) {
                logger.info(`Desativando ${codesToDeactivate.length} empresas não encontradas no Excel...`);
                
                for (const codigo of codesToDeactivate) {
                    try {
                        const wasDeactivated = await companyRepository.deactivateByCode(codigo);
                        if (wasDeactivated) {
                            deactivated++;
                        }
                    } catch (error) {
                        logger.error(`Erro ao desativar empresa ${codigo}:`, error);
                        additionalErrors++;
                    }
                }
            }

            return {
                totalProcessed: companiesFromExcel.length,
                created: upsertResult.created,
                updated: upsertResult.updated,
                unchanged: upsertResult.unchanged,
                deactivated: deactivated,
                errors: upsertResult.errors + additionalErrors
            };

        } catch (error) {
            logger.error('Erro ao sincronizar empresas:', error);
            throw error;
        }
    }

    // Método para obter estatísticas da última sincronização
    getLastSyncStats() {
        return {
            lastSyncDate: this.lastSyncDate,
            isRunning: this.isRunning,
            stats: this.syncStats
        };
    }

    // Método para verificar se há sincronização em andamento
    isCurrentlyRunning() {
        return this.isRunning;
    }

    // Método para forçar sincronização manual
    async forceSyncNow() {
        logger.info('Forçando sincronização manual...');
        return await this.syncFromSharePoint();
    }
}

module.exports = new SyncService();
