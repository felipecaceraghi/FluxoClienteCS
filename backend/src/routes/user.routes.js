const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticateToken = require('../middleware/auth');
const { requireAdmin, requireRole, requireAnyRole } = require('../middleware/authorization');

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// GET /api/users/me - Obter dados do usuário atual (qualquer usuário autenticado)
router.get('/me', userController.getCurrentUser);

// GET /api/users/stats - Obter estatísticas (apenas admin)
router.get('/stats', requireAdmin, userController.getUserStats);

// GET /api/users - Listar usuários (apenas admin)
router.get('/', requireAdmin, userController.getUsers);

// GET /api/users/:id - Obter usuário por ID (apenas admin)
router.get('/:id', requireAdmin, userController.getUserById);

// POST /api/users - Criar novo usuário (apenas admin)
router.post('/', requireAdmin, userController.createUser);

// PUT /api/users/:id - Atualizar usuário (apenas admin)
router.put('/:id', requireAdmin, userController.updateUser);

// PATCH /api/users/:id/deactivate - Desativar usuário (apenas admin)
router.patch('/:id/deactivate', requireAdmin, userController.deactivateUser);

// PATCH /api/users/:id/reactivate - Reativar usuário (apenas admin)
router.patch('/:id/reactivate', requireAdmin, userController.reactivateUser);

// PATCH /api/users/:id/password - Alterar senha (apenas admin)
router.patch('/:id/password', requireAdmin, userController.changePassword);

// DELETE /api/users/:id - Excluir usuário permanentemente (apenas admin)
router.delete('/:id', requireAdmin, userController.deleteUser);

module.exports = router;
