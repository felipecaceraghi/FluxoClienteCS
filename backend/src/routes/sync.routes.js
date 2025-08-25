const express = require('express');
const router = express.Router();
const syncService = require('../services/sync.service');
const schedulerService = require('../services/scheduler.service');
const authenticateToken = require('../middleware/auth');
const logger = require('../utils/logger');

// Todas as rotas exigem autenticação
router.use(authenticateToken);

/**
 * @route GET /api/sync/status
 * @desc Obter status da sincronização e scheduler
 * @access Private
 */
router.get('/status', async (req, res) => {
    try {
        const syncStats = syncService.getLastSyncStats();
        const schedulerStatus = schedulerService.getStatus();

        res.json({
            success: true,
            data: {
                sync: syncStats,
                scheduler: schedulerStatus
            }
        });
    } catch (error) {
        logger.error('Erro ao buscar status do scheduler:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * @route POST /api/sync/run-now
 * @desc Executar sincronização manual
 * @access Private
 */
router.post('/run-now', async (req, res) => {
    try {
        // Verificar se já há sincronização em andamento
        if (syncService.isCurrentlyRunning()) {
            return res.status(409).json({
                success: false,
                message: 'Sincronização já está em andamento'
            });
        }

        logger.info(`Usuário ${req.user.email} iniciou sincronização manual`);

        // Executar sincronização
        const result = await syncService.forceSyncNow();

        res.json({
            success: result.success,
            message: result.message,
            stats: result.stats,
            error: result.error
        });

    } catch (error) {
        logger.error('Erro na sincronização manual:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao executar sincronização',
            error: error.message
        });
    }
});

/**
 * @route POST /api/sync/manual
 * @desc Executar sincronização manual (alias)
 * @access Private
 */
router.post('/manual', async (req, res) => {
    try {
        // Verificar se já há sincronização em andamento
        if (syncService.isCurrentlyRunning()) {
            return res.status(409).json({
                success: false,
                message: 'Sincronização já está em andamento'
            });
        }

        logger.info(`Usuário ${req.user.email} iniciou sincronização manual`);

        // Executar sincronização
        const result = await syncService.forceSyncNow();

        res.json({
            success: result.success,
            message: result.message,
            stats: result.stats,
            error: result.error
        });

    } catch (error) {
        logger.error('Erro na sincronização manual:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao executar sincronização',
            error: error.message
        });
    }
});

/**
 * @route GET /api/sync/stats
 * @desc Obter estatísticas detalhadas da última sincronização
 * @access Private
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = syncService.getLastSyncStats();
        
        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        logger.error('Erro ao obter estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

/**
 * @route POST /api/sync/scheduler/start
 * @desc Iniciar scheduler
 * @access Private
 */
router.post('/scheduler/start', async (req, res) => {
    try {
        schedulerService.start();
        
        res.json({
            success: true,
            message: 'Scheduler iniciado com sucesso'
        });

    } catch (error) {
        logger.error('Erro ao iniciar scheduler:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao iniciar scheduler',
            error: error.message
        });
    }
});

/**
 * @route POST /api/sync/scheduler/stop
 * @desc Parar scheduler
 * @access Private
 */
router.post('/scheduler/stop', async (req, res) => {
    try {
        schedulerService.stop();
        
        res.json({
            success: true,
            message: 'Scheduler parado com sucesso'
        });

    } catch (error) {
        logger.error('Erro ao parar scheduler:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao parar scheduler',
            error: error.message
        });
    }
});

// === ROTAS DE DESENVOLVIMENTO ===
if (process.env.NODE_ENV === 'development') {
    /**
     * @route POST /api/sync/test-excel
     * @desc Testar parsing de dados do Excel (empresas)
     * @access Private (apenas desenvolvimento)
     */
    router.post('/test-excel', async (req, res) => {
        try {
            const excelService = require('../services/excel.service');
            const sharepointService = require('../services/sharepoint.service');
            
            // Baixar arquivo
            const downloadResult = await sharepointService.downloadFile();
            
            if (!downloadResult.success) {
                throw new Error(downloadResult.message);
            }

            // Processar Excel (empresas)
            const companies = await excelService.parseCompaniesData(downloadResult.filePath);
            
            res.json({
                success: true,
                message: 'Teste do Excel (empresas) executado com sucesso',
                data: {
                    file: downloadResult.fileName,
                    totalCompanies: companies.length,
                    sampleCompanies: companies.slice(0, 10) // Primeiras 10 empresas
                }
            });

        } catch (error) {
            logger.error('Erro no teste do Excel (empresas):', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * @route POST /api/sync/test-excel-clientes
     * @desc Testar parsing de dados do Excel (clientes)
     * @access Private (apenas desenvolvimento)
     */
    router.post('/test-excel-clientes', async (req, res) => {
        try {
            const excelService = require('../services/excel.service');
            const sharepointService = require('../services/sharepoint.service');
            
            // Baixar arquivo
            const downloadResult = await sharepointService.downloadFile();
            
            if (!downloadResult.success) {
                throw new Error(downloadResult.message);
            }

            // Processar Excel (clientes)
            const clientes = await excelService.parseClientesData(downloadResult.filePath);
            
            res.json({
                success: true,
                message: 'Teste do Excel (clientes) executado com sucesso',
                data: {
                    file: downloadResult.fileName,
                    totalClientes: clientes.length,
                    sampleClientes: clientes.slice(0, 5) // Primeiros 5 clientes
                }
            });

        } catch (error) {
            logger.error('Erro no teste do Excel (clientes):', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * @route POST /api/sync/run-companies-only
     * @desc Executar sincronização apenas de empresas
     * @access Private (apenas desenvolvimento)
     */
    router.post('/run-companies-only', async (req, res) => {
        try {
            const sharepointService = require('../services/sharepoint.service');
            const excelService = require('../services/excel.service');
            const companyRepository = require('../repositories/company.repository');
            
            // Baixar arquivo
            const downloadResult = await sharepointService.downloadFile();
            if (!downloadResult.success) {
                throw new Error(downloadResult.message);
            }

            // Processar e sincronizar apenas empresas
            const companies = await excelService.parseCompaniesData(downloadResult.filePath);
            const result = await companyRepository.bulkUpsertFromSharePoint(companies);
            
            res.json({
                success: true,
                message: 'Sincronização de empresas concluída',
                data: result
            });

        } catch (error) {
            logger.error('Erro na sincronização de empresas:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * @route POST /api/sync/run-clientes-only
     * @desc Executar sincronização apenas de clientes
     * @access Private (apenas desenvolvimento)
     */
    router.post('/run-clientes-only', async (req, res) => {
        try {
            const sharepointService = require('../services/sharepoint.service');
            const excelService = require('../services/excel.service');
            const clienteRepository = require('../repositories/cliente.repository');
            
            // Baixar arquivo
            const downloadResult = await sharepointService.downloadFile();
            if (!downloadResult.success) {
                throw new Error(downloadResult.message);
            }

            // Processar e sincronizar apenas clientes
            const clientes = await excelService.parseClientesData(downloadResult.filePath);
            const result = await clienteRepository.bulkUpsertFromSharePoint(clientes);
            
            res.json({
                success: true,
                message: 'Sincronização de clientes concluída',
                data: result
            });

        } catch (error) {
            logger.error('Erro na sincronização de clientes:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
}

module.exports = router;
