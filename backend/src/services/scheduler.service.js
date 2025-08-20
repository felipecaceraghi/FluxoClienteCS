const cron = require('node-cron');
const syncService = require('./sync.service');
const logger = require('../utils/logger');

class SchedulerService {
    constructor() {
        this.jobs = new Map();
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) {
            logger.warn('Scheduler já está em execução');
            return;
        }

        logger.info('Iniciando Scheduler Service...');

        // Job de sincronização a cada 15 minutos
        const syncJob = cron.schedule('*/15 * * * *', async () => {
            await this.runSharePointSync();
        }, {
            scheduled: false,
            name: 'sharepoint-sync'
        });

        // Job de limpeza de arquivos antigos (uma vez por dia às 2h da manhã)
        const cleanupJob = cron.schedule('0 2 * * *', async () => {
            await this.cleanupOldFiles();
        }, {
            scheduled: false,
            name: 'file-cleanup'
        });

        // Armazenar jobs
        this.jobs.set('sharepoint-sync', syncJob);
        this.jobs.set('file-cleanup', cleanupJob);

        // Iniciar todos os jobs
        this.jobs.forEach((job, name) => {
            job.start();
            logger.info(`Job "${name}" agendado e iniciado`);
        });

        this.isRunning = true;
        
        logger.info('Scheduler Service iniciado com sucesso!', {
            totalJobs: this.jobs.size,
            jobs: Array.from(this.jobs.keys())
        });

        // Executar primeira sincronização imediatamente em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
            logger.info('Executando primeira sincronização (desenvolvimento)...');
            setTimeout(() => {
                this.runSharePointSync();
            }, 5000); // Aguardar 5 segundos para o servidor inicializar completamente
        }
    }

    stop() {
        if (!this.isRunning) {
            logger.warn('Scheduler não está em execução');
            return;
        }

        logger.info('Parando Scheduler Service...');

        this.jobs.forEach((job, name) => {
            job.stop();
            logger.info(`Job "${name}" parado`);
        });

        this.isRunning = false;
        logger.info('Scheduler Service parado com sucesso');
    }

    async runSharePointSync() {
        const jobName = 'sharepoint-sync';
        logger.info(`Executando job: ${jobName}`);

        try {
            const result = await syncService.syncFromSharePoint();
            
            if (result.success) {
                logger.info(`Job "${jobName}" executado com sucesso`, result.stats);
            } else {
                logger.error(`Job "${jobName}" falhou:`, result.error);
            }

        } catch (error) {
            logger.error(`Erro no job "${jobName}"`, error);
        }
    }

    async cleanupOldFiles() {
        const jobName = 'file-cleanup';
        logger.info(`Executando job: ${jobName}`);

        try {
            const fs = require('fs');
            const path = require('path');
            
            const downloadPath = path.join(__dirname, '../storage/sharepoint-files');
            
            if (!fs.existsSync(downloadPath)) {
                logger.info('Diretório de download não existe, nada para limpar');
                return;
            }

            const files = fs.readdirSync(downloadPath);
            const now = Date.now();
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias em millisegundos
            let deletedCount = 0;

            for (const file of files) {
                const filePath = path.join(downloadPath, file);
                const stats = fs.statSync(filePath);
                
                if (now - stats.mtime.getTime() > maxAge) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    logger.debug(`Arquivo antigo removido: ${file}`);
                }
            }

            logger.info(`Job "${jobName}" executado com sucesso`, {
                filesDeleted: deletedCount,
                totalFiles: files.length
            });

        } catch (error) {
            logger.error(`Erro no job "${jobName}"`, error);
        }
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            totalJobs: this.jobs.size,
            jobs: Array.from(this.jobs.keys()).map(name => ({
                name,
                running: this.jobs.get(name)?.running || false
            })),
            lastSyncStats: syncService.getLastSyncStats()
        };
    }

    // Método para executar sincronização manual
    async runManualSync() {
        logger.info('Executando sincronização manual...');
        return await this.runSharePointSync();
    }
}

module.exports = new SchedulerService();
