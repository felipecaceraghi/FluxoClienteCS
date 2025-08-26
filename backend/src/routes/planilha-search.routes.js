const express = require('express');
const router = express.Router();
const planilhaSearchController = require('../controllers/planilha-search.controller');
const authMiddleware = require('../middleware/auth');

// proteger todas as rotas
router.use(authMiddleware);

// Saída (apenas os endpoints solicitados)
router.get('/pesquisa-grupo-saida', planilhaSearchController.pesquisaGrupoSaida);
router.get('/pesquisa-cliente-saida', planilhaSearchController.pesquisaClienteSaida);

module.exports = router;
