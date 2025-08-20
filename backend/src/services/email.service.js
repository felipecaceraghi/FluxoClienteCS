const { Client } = require('@microsoft/microsoft-graph-client');
const { ConfidentialClientApplication } = require('@azure/msal-node');
require('isomorphic-fetch');

class EmailService {
    constructor() {
        // Verificar se as variáveis de ambiente estão definidas
        if (!process.env.GRAPH_CLIENT_ID || !process.env.GRAPH_CLIENT_SECRET || !process.env.GRAPH_TENANT_ID) {
            console.error('❌ Variáveis de ambiente do Microsoft Graph não configuradas');
            throw new Error('Configuração do Microsoft Graph incompleta');
        }

        console.log('🔧 Inicializando EmailService com:');
        console.log(`   Client ID: ${process.env.GRAPH_CLIENT_ID}`);
        console.log(`   Tenant ID: ${process.env.GRAPH_TENANT_ID}`);
        console.log(`   Email Sender: ${process.env.EMAIL_SENDER}`);

        this.clientApp = new ConfidentialClientApplication({
            auth: {
                clientId: process.env.GRAPH_CLIENT_ID,
                clientSecret: process.env.GRAPH_CLIENT_SECRET,
                authority: `https://login.microsoftonline.com/${process.env.GRAPH_TENANT_ID}`
            }
        });
        this.accessToken = null;
    }

    async getAccessToken() {
        try {
            console.log('🔄 Obtendo token do Microsoft Graph...');
            
            // Obter token usando client credentials flow (app-only)
            const clientCredentialRequest = {
                scopes: ['https://graph.microsoft.com/.default']
            };

            const tokenResponse = await this.clientApp.acquireTokenByClientCredential(clientCredentialRequest);
            
            if (!tokenResponse || !tokenResponse.accessToken) {
                throw new Error('Não foi possível obter token de acesso');
            }

            console.log('✅ Token obtido com sucesso');
            console.log(`   Token type: ${tokenResponse.tokenType}`);
            console.log(`   Expires in: ${tokenResponse.expiresOn}`);

            this.accessToken = tokenResponse.accessToken;
            return this.accessToken;
        } catch (error) {
            console.error('❌ Erro detalhado ao autenticar com Microsoft Graph:');
            console.error('   Erro:', error.message);
            console.error('   Code:', error.errorCode);
            console.error('   Details:', error.errorMessage);
            
            if (error.errorCode === 'invalid_client') {
                throw new Error('Credenciais do cliente inválidas. Verifique GRAPH_CLIENT_ID e GRAPH_CLIENT_SECRET');
            }
            
            if (error.errorCode === 'unauthorized_client') {
                throw new Error('Cliente não autorizado. Verifique as permissões no Azure AD');
            }
            
            throw new Error(`Falha na autenticação com Microsoft Graph: ${error.message}`);
        }
    }

    async sendPasswordResetEmail(toEmail, resetToken, userName = '') {
        try {
            const accessToken = await this.getAccessToken();
            
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
            
            const emailBody = this.generatePasswordResetEmailBody(userName, resetUrl, resetToken);

            const mailData = {
                message: {
                    subject: 'FluxoClienteCS - Recuperação de Senha',
                    body: {
                        contentType: 'HTML',
                        content: emailBody
                    },
                    toRecipients: [
                        {
                            emailAddress: {
                                address: toEmail
                            }
                        }
                    ]
                },
                saveToSentItems: false
            };

            console.log(`📧 Enviando email de recuperação para: ${toEmail}`);
            console.log(`📧 Usando conta: ${process.env.EMAIL_SENDER}`);

            // Usar chamada HTTP direta para a API Graph
            const response = await fetch(`https://graph.microsoft.com/v1.0/users/${process.env.EMAIL_SENDER}/sendMail`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(mailData)
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('❌ Erro na resposta da API Graph:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorData
                });
                
                if (response.status === 403) {
                    throw new Error('Sem permissão para enviar emails. Verifique as permissões no Azure AD');
                }
                
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            console.log(`✅ Email de recuperação enviado para: ${toEmail}`);
            
            return {
                success: true,
                message: 'Email de recuperação enviado com sucesso'
            };
        } catch (error) {
            console.error('❌ Erro ao enviar email de recuperação:', error);
            throw new Error(`Falha ao enviar email de recuperação: ${error.message}`);
        }
    }

    generatePasswordResetEmailBody(userName, resetUrl, token) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recuperação de Senha - FluxoClienteCS</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background-color: #2c3e50;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 5px 5px 0 0;
                }
                .content {
                    background-color: #f9f9f9;
                    padding: 30px;
                    border-radius: 0 0 5px 5px;
                }
                .button {
                    display: inline-block;
                    background-color: #3498db;
                    color: white;
                    padding: 12px 25px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                    font-weight: bold;
                }
                .button:hover {
                    background-color: #2980b9;
                }
                .token-info {
                    background-color: #ecf0f1;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 15px 0;
                    font-family: monospace;
                    word-break: break-all;
                }
                .warning {
                    background-color: #f39c12;
                    color: white;
                    padding: 10px;
                    border-radius: 5px;
                    margin: 15px 0;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 12px;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🔒 FluxoClienteCS</h1>
                <p>Recuperação de Senha</p>
            </div>
            
            <div class="content">
                <h2>Olá${userName ? `, ${userName}` : ''}!</h2>
                
                <p>Você solicitou a recuperação de senha para sua conta no sistema FluxoClienteCS.</p>
                
                <p>Para redefinir sua senha, clique no botão abaixo ou copie o token fornecido:</p>
                
                <a href="${resetUrl}" class="button">🔑 Redefinir Senha</a>
                
                <div class="token-info">
                    <strong>Token de recuperação:</strong><br>
                    <code>${token}</code>
                </div>
                
                <div class="warning">
                    ⚠️ <strong>Importante:</strong> Este link expira em 1 hora por motivos de segurança.
                </div>
                
                <p>Se você não solicitou esta recuperação, pode ignorar este email com segurança.</p>
                
                <p><strong>Dicas de segurança:</strong></p>
                <ul>
                    <li>Use uma senha forte com letras, números e símbolos</li>
                    <li>Não compartilhe sua senha com ninguém</li>
                    <li>Faça logout ao usar computadores compartilhados</li>
                </ul>
            </div>
            
            <div class="footer">
                <p>Este é um email automático do sistema FluxoClienteCS.</p>
                <p>Se você tiver problemas, entre em contato com o suporte.</p>
                <p><strong>Go Further Group</strong> | Customer Success</p>
            </div>
        </body>
        </html>
        `;
    }

    async sendTestEmail(toEmail) {
        try {
            const accessToken = await this.getAccessToken();
            
            const mailData = {
                message: {
                    subject: 'Teste de Conexão - FluxoClienteCS',
                    body: {
                        contentType: 'HTML',
                        content: `
                        <h2>✅ Conexão com Microsoft Graph funcionando!</h2>
                        <p>Este é um email de teste do sistema FluxoClienteCS.</p>
                        <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                        <p><strong>Remetente:</strong> ${process.env.EMAIL_SENDER}</p>
                        `
                    },
                    toRecipients: [
                        {
                            emailAddress: {
                                address: toEmail
                            }
                        }
                    ]
                },
                saveToSentItems: false
            };

            console.log(`📧 Enviando email de teste para: ${toEmail}`);
            console.log(`📧 Usando conta: ${process.env.EMAIL_SENDER}`);

            // Usar chamada HTTP direta para a API Graph
            const response = await fetch(`https://graph.microsoft.com/v1.0/users/${process.env.EMAIL_SENDER}/sendMail`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(mailData)
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('❌ Erro na resposta da API Graph:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorData
                });
                
                if (response.status === 403) {
                    throw new Error('Sem permissão para enviar emails. Verifique se a aplicação tem Mail.Send permissions no Azure AD');
                }
                
                if (response.status === 404) {
                    throw new Error(`Usuário ${process.env.EMAIL_SENDER} não encontrado no tenant`);
                }
                
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            console.log(`✅ Email de teste enviado com sucesso para: ${toEmail}`);

            return {
                success: true,
                message: 'Email de teste enviado com sucesso'
            };
        } catch (error) {
            console.error('❌ Erro ao enviar email de teste:', error.message);
            throw new Error(`Falha ao enviar email: ${error.message}`);
        }
    }
}

module.exports = new EmailService();
