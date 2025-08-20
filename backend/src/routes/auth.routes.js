const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { validate, schemas } = require('../middleware/validation');
const authenticateToken = require('../middleware/auth');

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

module.exports = router;
