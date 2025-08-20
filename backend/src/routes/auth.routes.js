const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { validate, schemas } = require('../middleware/validation');
const authenticateToken = require('../middleware/auth');
const emailService = require('../services/email.service');

// Rotas públicas (sem autenticação)
router.post('/login', 
    validate(schemas.login), 
    authController.login
);

router.post('/forgot-password', 
    validate(schemas.forgotPassword), 
    authController.forgotPassword
);

router.post('/reset-password', 
    validate(schemas.resetPassword), 
    authController.resetPassword
);

// Rotas protegidas (com autenticação)
router.get('/validate', 
    authenticateToken, 
    authController.validateToken
);

router.post('/logout', 
    authenticateToken, 
    authController.logout
);

router.get('/me', 
    authenticateToken, 
    authController.me
);

// Rota para testar envio de email (apenas desenvolvimento)
if (process.env.NODE_ENV === 'development') {
    router.post('/test-email', async (req, res) => {
        try {
            const { email } = req.body;
            
            if (!email) {
                return res.status(400).json({
                    success: false,
                    error: 'Email é obrigatório'
                });
            }

            await emailService.sendTestEmail(email);
            
            res.json({
                success: true,
                message: 'Email de teste enviado com sucesso'
            });
        } catch (error) {
            console.error('Erro no teste de email:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
}

module.exports = router;
