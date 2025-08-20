const express = require('express');
const router = express.Router();

const companyController = require('../controllers/company.controller');
const { validate, schemas } = require('../middleware/validation');
const authenticateToken = require('../middleware/auth');

// Todas as rotas de empresa exigem autenticação
router.use(authenticateToken);

// Buscar empresas com paginação
router.get('/search', 
    validate(schemas.searchCompanies, 'query'), 
    companyController.search
);

// Buscar todas as empresas
router.get('/', 
    companyController.getAll
);

// Estatísticas das empresas
router.get('/stats', 
    companyController.getStats
);

// Buscar empresa por código
router.get('/:codigo', 
    companyController.getByCode
);

// Validar empresa para relatório
router.get('/:codigo/validate-report', 
    companyController.validateForReport
);

// Criar nova empresa (para testes/admin)
router.post('/', 
    companyController.create
);

// Atualizar empresa
router.put('/:codigo', 
    companyController.update
);

module.exports = router;
