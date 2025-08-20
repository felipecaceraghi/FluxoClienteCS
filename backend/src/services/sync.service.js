const companyRepository = require('../repositories/company.repository');
const excelService = require('./excel.service');
const sharepointService = require('./sharepoint.service');
const logger = require('../utils/logger');

class SyncService {
    constructor() {
        this.isRunning = false;
        this.lastSyncDate = null;
        this.syncStats = {
            totalProcessed: 0,
            created: 0,
            updated: 0,
            unchanged: 0,
            deactivated: 0,
            errors: 0
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
            const companiesFromExcel = await excelService.parseCompaniesData(downloadResult.filePath);
            
            if (!companiesFromExcel || companiesFromExcel.length === 0) {
                throw new Error('Nenhum dado encontrado no arquivo Excel');
            }

            logger.info(`${companiesFromExcel.length} empresas encontradas no Excel`);

            // 3. Obter códigos ativos no banco
            const activeCodesInDB = await companyRepository.getAllActiveCodes();
            logger.info(`${activeCodesInDB.length} empresas ativas no banco`);

            // 4. Processar upserts (criar/atualizar)
            logger.info('Processando criações e atualizações...');
            const upsertResult = await companyRepository.bulkUpsertFromSharePoint(companiesFromExcel);
            
            // 5. Identificar empresas para desativar (existem no banco mas não no Excel)
            const codesFromExcel = new Set(companiesFromExcel.map(c => c.codigo));
            const codesToDeactivate = activeCodesInDB.filter(code => !codesFromExcel.has(code));
            
            // 6. Desativar empresas que não estão mais no Excel
            let deactivated = 0;
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
                        upsertResult.errors++;
                    }
                }
            }

            // 7. Compilar estatísticas finais
            const endTime = new Date();
            const duration = endTime - startTime;
            
            this.syncStats = {
                totalProcessed: companiesFromExcel.length,
                created: upsertResult.created,
                updated: upsertResult.updated,
                unchanged: upsertResult.unchanged,
                deactivated: deactivated,
                errors: upsertResult.errors,
                duration: `${Math.round(duration / 1000)}s`,
                timestamp: endTime.toISOString()
            };

            this.lastSyncDate = endTime;

            // 8. Log do resultado
            logger.info('=== Sincronização concluída ===');
            logger.info(`Total processado: ${this.syncStats.totalProcessed}`);
            logger.info(`Criadas: ${this.syncStats.created}`);
            logger.info(`Atualizadas: ${this.syncStats.updated}`);
            logger.info(`Inalteradas: ${this.syncStats.unchanged}`);
            logger.info(`Desativadas: ${this.syncStats.deactivated}`);
            logger.info(`Erros: ${this.syncStats.errors}`);
            logger.info(`Duração: ${this.syncStats.duration}`);

            return {
                success: true,
                stats: this.syncStats,
                message: 'Sincronização concluída com sucesso'
            };

        } catch (error) {
            logger.error('Erro durante sincronização:', error);
            
            this.syncStats.errors++;
            
            return {
                success: false,
                error: error.message,
                stats: this.syncStats
            };
        } finally {
            this.isRunning = false;
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
