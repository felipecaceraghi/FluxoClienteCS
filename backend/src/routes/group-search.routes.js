const express = require('express');
const router = express.Router();
const groupSearchController = require('../controllers/group-search.controller');
const authMiddleware = require('../middleware/auth');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// GET /api/group-search/status - Verificar se há busca em andamento
router.get('/status', groupSearchController.getSearchStatus);

// GET /api/group-search/groups - Obter todos os grupos disponíveis
router.get('/groups', groupSearchController.getAvailableGroups);

// GET /api/group-search/:grupo - Buscar empresas por grupo
router.get('/:grupo', groupSearchController.searchByGroup);

module.exports = router;
