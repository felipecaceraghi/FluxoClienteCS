const axios = require('axios');

// Configuração da API
const API_BASE_URL = 'http://localhost:3001';
const API_ENDPOINTS = {
    login: `${API_BASE_URL}/api/auth/login`,
    forgotPassword: `${API_BASE_URL}/api/auth/forgot-password`,
    resetPassword: `${API_BASE_URL}/api/auth/reset-password`,
    validateToken: `${API_BASE_URL}/api/auth/validate`,
    me: `${API_BASE_URL}/api/auth/me`,
    logout: `${API_BASE_URL}/api/auth/logout`,
    health: `${API_BASE_URL}/health`
};

// Função para testar se o servidor está rodando
async function testServerHealth() {
    try {
        console.log('🔍 Testando conectividade com servidor...');
        const response = await axios.get(API_ENDPOINTS.health);
        console.log('✅ Servidor está online:', response.data);
        return true;
    } catch (error) {
        console.log('❌ Servidor não está respondendo:', error.message);
        console.log('💡 Certifique-se de que o backend está rodando na porta 3001');
        return false;
    }
}

// Função para testar login com credenciais válidas
async function testValidLogin() {
    try {
        console.log('\n🔑 Testando login com credenciais válidas...');
        
        const loginData = {
            email: 'admin@admin.com',
            password: 'admin123'
        };
        
        const response = await axios.post(API_ENDPOINTS.login, loginData);
        
        console.log('✅ Login bem-sucedido!');
        console.log('📋 Resposta:', JSON.stringify(response.data, null, 2));
        
        // Retornar token para usar em outros testes
        return response.data.data?.token;
        
    } catch (error) {
        console.log('❌ Erro no login:', error.response?.data || error.message);
        return null;
    }
}

// Função para testar login with credenciais inválidas
async function testInvalidLogin() {
    try {
        console.log('\n🚫 Testando login com credenciais inválidas...');
        
        const loginData = {
            email: 'usuario@inexistente.com',
            password: 'senhaerrada'
        };
        
        const response = await axios.post(API_ENDPOINTS.login, loginData);
        console.log('⚠️ Login inválido deveria ter falhado, mas passou:', response.data);
        
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Login inválido corretamente rejeitado');
            console.log('📋 Resposta de erro:', error.response.data);
        } else {
            console.log('❌ Erro inesperado:', error.response?.data || error.message);
        }
    }
}

// Função para testar dados faltando
async function testMissingData() {
    console.log('\n📝 Testando validação de dados obrigatórios...');
    
    const testCases = [
        { description: 'Email faltando', data: { password: '123456' } },
        { description: 'Senha faltando', data: { email: 'test@test.com' } },
        { description: 'Ambos faltando', data: {} },
        { description: 'Email inválido', data: { email: 'email-invalido', password: '123456' } }
    ];
    
    for (const testCase of testCases) {
        try {
            console.log(`\n  🔍 ${testCase.description}...`);
            const response = await axios.post(API_ENDPOINTS.login, testCase.data);
            console.log('  ⚠️ Deveria ter falhado mas passou:', response.data);
        } catch (error) {
            if (error.response?.status >= 400 && error.response?.status < 500) {
                console.log('  ✅ Validação funcionou corretamente');
                console.log('  📋 Erro:', error.response.data.error || error.response.data.message);
            } else {
                console.log('  ❌ Erro inesperado:', error.response?.data || error.message);
            }
        }
    }
}

// Função para testar token de autenticação
async function testTokenValidation(token) {
    if (!token) {
        console.log('\n⚠️ Pulando teste de token - nenhum token disponível');
        return;
    }
    
    try {
        console.log('\n🎫 Testando validação de token...');
        
        const config = {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
        
        const response = await axios.get(API_ENDPOINTS.validateToken, config);
        console.log('✅ Token válido!');
        console.log('📋 Dados do usuário:', JSON.stringify(response.data, null, 2));
        
        // Testar rota /me também
        console.log('\n👤 Testando rota /me...');
        const meResponse = await axios.get(API_ENDPOINTS.me, config);
        console.log('✅ Dados do usuário obtidos com sucesso!');
        console.log('📋 Perfil:', JSON.stringify(meResponse.data, null, 2));
        
    } catch (error) {
        console.log('❌ Erro na validação do token:', error.response?.data || error.message);
    }
}

// Função para testar token inválido
async function testInvalidToken() {
    try {
        console.log('\n🎫 Testando token inválido...');
        
        const config = {
            headers: {
                'Authorization': 'Bearer token-invalido-123'
            }
        };
        
        const response = await axios.get(API_ENDPOINTS.validateToken, config);
        console.log('⚠️ Token inválido deveria ter falhado:', response.data);
        
    } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.log('✅ Token inválido corretamente rejeitado');
            console.log('📋 Resposta:', error.response.data);
        } else {
            console.log('❌ Erro inesperado:', error.response?.data || error.message);
        }
    }
}

// Função para testar recuperação de senha
async function testForgotPassword() {
    try {
        console.log('\n📧 Testando recuperação de senha...');
        
        const emailData = {
            email: 'admin@admin.com'
        };
        
        const response = await axios.post(API_ENDPOINTS.forgotPassword, emailData);
        console.log('✅ Email de recuperação enviado!');
        console.log('📋 Resposta:', JSON.stringify(response.data, null, 2));
        
        // Em desenvolvimento, o token pode vir na resposta
        if (response.data.resetToken) {
            console.log('🔑 Token de recuperação (DEV):', response.data.resetToken);
            return response.data.resetToken;
        }
        
    } catch (error) {
        console.log('❌ Erro na recuperação de senha:', error.response?.data || error.message);
        return null;
    }
}

// Função para testar reset de senha
async function testResetPassword(resetToken) {
    if (!resetToken) {
        console.log('\n⚠️ Pulando teste de reset de senha - nenhum token disponível');
        return;
    }
    
    try {
        console.log('\n🔄 Testando reset de senha...');
        
        const resetData = {
            token: resetToken,
            newPassword: 'novaSenha123'
        };
        
        const response = await axios.post(API_ENDPOINTS.resetPassword, resetData);
        console.log('✅ Senha resetada com sucesso!');
        console.log('📋 Resposta:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ Erro no reset de senha:', error.response?.data || error.message);
    }
}

// Função para testar logout
async function testLogout(token) {
    if (!token) {
        console.log('\n⚠️ Pulando teste de logout - nenhum token disponível');
        return;
    }
    
    try {
        console.log('\n🚪 Testando logout...');
        
        const config = {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
        
        const response = await axios.post(API_ENDPOINTS.logout, {}, config);
        console.log('✅ Logout realizado com sucesso!');
        console.log('📋 Resposta:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ Erro no logout:', error.response?.data || error.message);
    }
}

// Função principal para executar todos os testes
async function runAllTests() {
    console.log('🧪 === TESTE DA API DE LOGIN ===\n');
    
    // 1. Testar conectividade
    const serverOnline = await testServerHealth();
    if (!serverOnline) {
        console.log('\n❌ Testes interrompidos - servidor não está online');
        return;
    }
    
    // 2. Testar login válido
    const token = await testValidLogin();
    
    // 3. Testar login inválido
    await testInvalidLogin();
    
    // 4. Testar validações
    await testMissingData();
    
    // 5. Testar validação de token
    await testTokenValidation(token);
    
    // 6. Testar token inválido
    await testInvalidToken();
    
    // 7. Testar recuperação de senha
    const resetToken = await testForgotPassword();
    
    // 8. Testar reset de senha
    await testResetPassword(resetToken);
    
    // 9. Testar logout
    await testLogout(token);
    
    console.log('\n🏁 === TESTES CONCLUÍDOS ===');
    console.log('\n💡 Dicas para testar manualmente:');
    console.log('📋 Use Postman, Insomnia ou curl para testes manuais');
    console.log('🔗 Endpoints disponíveis:');
    Object.entries(API_ENDPOINTS).forEach(([name, url]) => {
        console.log(`   ${name}: ${url}`);
    });
}

// Executar testes se arquivo for executado diretamente
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    testServerHealth,
    testValidLogin,
    testInvalidLogin,
    testMissingData,
    testTokenValidation,
    testInvalidToken,
    testForgotPassword,
    testResetPassword,
    testLogout,
    runAllTests,
    API_ENDPOINTS
};