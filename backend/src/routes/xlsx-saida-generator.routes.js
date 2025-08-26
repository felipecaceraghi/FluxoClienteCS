const express = require('express');
const router = express.Router();
const xlsxSaidaGeneratorController = require('../controllers/xlsx-saida-generator.controller');
const authMiddleware = require('../middleware/auth');

// Proteger todas as rotas
router.use(authMiddleware);

// POST /api/xlsx-saida/grupo - Gerar relatório por grupo
router.post('/grupo', xlsxSaidaGeneratorController.generateGrupoReport);

// POST /api/xlsx-saida/cliente - Gerar relatório por cliente
router.post('/cliente', xlsxSaidaGeneratorController.generateClienteReport);

module.exports = router;
