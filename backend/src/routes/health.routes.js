const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// Health check simples
router.get('/', async (req, res) => {
    try {
        // Testar conexão com banco
        await db.get('SELECT 1 as test');
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV,
            version: '1.0.0',
            database: 'connected'
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Database connection failed',
            database: 'disconnected'
        });
    }
});

// Health check detalhado
router.get('/detailed', async (req, res) => {
    try {
        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV,
            version: '1.0.0',
            services: {}
        };

        // Testar banco de dados
        try {
            const dbTest = await db.get('SELECT COUNT(*) as count FROM users');
            healthData.services.database = {
                status: 'healthy',
                users_count: dbTest.count
            };
        } catch (error) {
            healthData.services.database = {
                status: 'unhealthy',
                error: error.message
            };
            healthData.status = 'degraded';
        }

        // Verificar espaço em disco (simplificado)
        const memUsage = process.memoryUsage();
        healthData.services.memory = {
            status: memUsage.heapUsed < 100 * 1024 * 1024 ? 'healthy' : 'warning', // 100MB
            heap_used: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
            heap_total: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
        };

        const statusCode = healthData.status === 'healthy' ? 200 : 206;
        res.status(statusCode).json(healthData);
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

module.exports = router;
