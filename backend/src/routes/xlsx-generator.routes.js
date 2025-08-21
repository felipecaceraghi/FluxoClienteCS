const express = require('express');
const xlsxGeneratorController = require('../controllers/xlsx-generator.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Gerar planilha XLSX para um grupo específico
// GET /api/xlsx-generator/generate/:grupo
router.get('/generate/:grupo', xlsxGeneratorController.generateForGroup);

// Gerar planilha XLSX com dados customizados
// POST /api/xlsx-generator/custom
router.post('/custom', xlsxGeneratorController.generateCustom);

// Download de arquivo gerado
// GET /api/xlsx-generator/download/:fileName
router.get('/download/:fileName', xlsxGeneratorController.downloadFile);

// Listar arquivos disponíveis para download
// GET /api/xlsx-generator/files
router.get('/files', xlsxGeneratorController.listAvailableFiles);

module.exports = router;
