require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Routes
const authRoutes = require('./routes/auth.routes');
const companyRoutes = require('./routes/company.routes');
const healthRoutes = require('./routes/health.routes');

// Middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://seudominio.com'] 
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // máximo 100 requests por IP
    message: {
        error: 'Muitas tentativas. Tente novamente em 15 minutos.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check (sem rate limit)
app.use('/health', healthRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'FluxoClienteCS Backend',
        version: '1.0.0',
        status: 'online',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint não encontrado',
        path: req.originalUrl,
        method: req.method
    });
});

// Error handling middleware (deve ser o último)
app.use(errorHandler);

// Inicializar servidor
const server = app.listen(PORT, () => {
    console.log('🚀 Servidor iniciado!');
    console.log(`📍 Ambiente: ${process.env.NODE_ENV}`);
    console.log(`🌐 Porta: ${PORT}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log(`💾 Database: ${process.env.DATABASE_PATH}`);
    console.log('───────────────────────────────');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM recebido. Fechando servidor...');
    server.close(() => {
        console.log('✅ Servidor fechado com sucesso');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🔄 SIGINT recebido. Fechando servidor...');
    server.close(() => {
        console.log('✅ Servidor fechado com sucesso');
        process.exit(0);
    });
});

module.exports = app;
