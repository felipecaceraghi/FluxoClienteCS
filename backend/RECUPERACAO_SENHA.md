# FluxoClienteCS - Recuperação de Senha

## ✅ Implementado

### Microsoft Graph API configurado com:
- **Client ID:** de286ff7-cc71-4a79-90c3-c04b61e3b948
- **Tenant ID:** 520c4df2-db46-4fdd-b833-6a96df9215bf
- **Email Sender:** notificacaogf@gofurthergroup.com.br

## 🧪 Testes no Postman

### 1. Testar Envio de Email (Desenvolvimento)
```http
POST http://localhost:3001/api/auth/test-email
Content-Type: application/json

{
    "email": "seu-email@teste.com"
}
```

### 2. Solicitar Recuperação de Senha
```http
POST http://localhost:3001/api/auth/forgot-password
Content-Type: application/json

{
    "email": "felipe.caceraghi@gofurthergroup.com.br"
}
```

**Resposta esperada:**
```json
{
    "success": true,
    "message": "Se o email existir, você receberá instruções para reset",
    "resetToken": "token_gerado_automaticamente"
}
```

### 3. Resetar Senha
```http
POST http://localhost:3001/api/auth/reset-password
Content-Type: application/json

{
    "token": "token_recebido_no_email",
    "newPassword": "novaSenha123"
}
```

## 📧 Funcionalidades do Email

### Email de Recuperação inclui:
- ✅ Design responsivo e profissional
- ✅ Link direto para reset (quando frontend estiver pronto)
- ✅ Token de recuperação copiável
- ✅ Aviso de expiração (1 hora)
- ✅ Dicas de segurança
- ✅ Branding Go Further Group

### Segurança:
- ✅ Token expira em 1 hora
- ✅ Token é único e criptograficamente seguro
- ✅ Não revela se email existe ou não
- ✅ Token é removido após uso

## 🔧 Próximos Passos

1. **Testar no Postman** - Verificar se emails estão sendo enviados
2. **Criar Frontend** - Página de reset de senha
3. **Configurar domínio** - Para links de produção
4. **Logs de auditoria** - Rastrear tentativas de reset

## 🚨 Importante

- Em **desenvolvimento**: Token também retorna na resposta da API
- Em **produção**: Token só vai no email
- Certifique-se que as permissões do Microsoft Graph estão corretas
- O email sender deve ter permissão para enviar emails via Graph API

## 🎯 Como Testar

1. Execute o servidor: `npm start`
2. Teste email: `POST /api/auth/test-email`
3. Se funcionar, teste: `POST /api/auth/forgot-password`
4. Verifique se chegou o email
5. Use o token para: `POST /api/auth/reset-password`
