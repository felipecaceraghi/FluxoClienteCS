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

    async sendFileByEmail({ to, subject, text, attachments }) {
        try {
            console.log('📧 Enviando email com anexo...');
            console.log(`   Para: ${to}`);
            console.log(`   Assunto: ${subject}`);
            console.log(`   Anexos: ${attachments?.length || 0}`);

            const accessToken = await this.getAccessToken();
            
            if (!accessToken) {
                throw new Error('Não foi possível obter token de acesso');
            }

            const fs = require('fs');
            const message = {
                subject: subject,
                body: {
                    contentType: 'Text',
                    content: text
                },
                toRecipients: [{
                    emailAddress: {
                        address: to
                    }
                }],
                attachments: []
            };

            // Adicionar anexos se fornecidos
            if (attachments && attachments.length > 0) {
                for (const attachment of attachments) {
                    if (attachment.path && fs.existsSync(attachment.path)) {
                        const fileBuffer = fs.readFileSync(attachment.path);
                        const base64Content = fileBuffer.toString('base64');
                        
                        message.attachments.push({
                            '@odata.type': '#microsoft.graph.fileAttachment',
                            name: attachment.filename,
                            contentBytes: base64Content
                        });
                        
                        console.log(`   ✅ Anexo adicionado: ${attachment.filename}`);
                    }
                }
            }

            const mailData = {
                message: message,
                saveToSentItems: false
            };

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
                
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('✅ Email com anexo enviado com sucesso');
            return {
                success: true,
                message: 'Email enviado com sucesso'
            };

        } catch (error) {
            console.error('❌ Erro ao enviar email com anexo:', error);
            throw new Error(`Falha ao enviar email com anexo: ${error.message}`);
        }
    }

    async sendFileAsImageEmail({ to, subject, grupo, excelFilePath }) {
        try {
            console.log('📧 Enviando email com imagem da planilha...');
            console.log(`   Para: ${to}`);
            console.log(`   Assunto: ${subject}`);
            console.log(`   Grupo: ${grupo}`);
            console.log(`   Arquivo Excel: ${excelFilePath}`);

            const accessToken = await this.getAccessToken();
            
            if (!accessToken) {
                throw new Error('Não foi possível obter token de acesso');
            }

            // Converter Excel para imagem usando Python (layout exato)
            console.log('🔄 Iniciando conversão Excel para imagem com Python...');
            const pythonImageService = require('./python-excel-to-image.service');
            const imageResult = await pythonImageService.convertAndGetBase64(excelFilePath);

            console.log('📊 Resultado da conversão:', {
                success: imageResult.success,
                hasBase64: !!imageResult.base64,
                base64Length: imageResult.base64?.length || 0,
                mimeType: imageResult.mimeType
            });

            if (!imageResult.success) {
                throw new Error('Falha ao converter planilha para imagem');
            }

            // Criar ID único para a imagem
            const imageId = `planilha_${Date.now()}`;
            console.log(`🆔 ID da imagem: ${imageId}`);

            // Texto do email
            const emailText = `
Equipe, boa tarde!

Encaminho abaixo as informações referentes à Entrada de Cliente para ciência e acompanhamento:
            `;

            // HTML do email com imagem inline
            const emailHTML = `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto;">
                    <div style="background: white; padding: 20px; border-radius: 8px;">
                        <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
                            Equipe, boa tarde!
                        </p>
                        <p style="color: #374151; line-height: 1.6; margin: 0 0 25px 0;">
                            Encaminho abaixo as informações referentes à Entrada de Cliente para ciência e acompanhamento:
                        </p>
                        
                        <div style="text-align: center; margin: 25px 0;">
                            <img src="cid:${imageId}" style="max-width: 100%; height: auto; border: 1px solid #d1d5db; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" alt="Ficha de Entrada - ${grupo}" />
                        </div>
                    </div>
                </div>
            `;

            console.log('📝 Preparando anexo da imagem...');
            const message = {
                subject: subject,
                body: {
                    contentType: 'HTML',
                    content: emailHTML
                },
                toRecipients: [{
                    emailAddress: {
                        address: to
                    }
                }],
                attachments: [{
                    '@odata.type': '#microsoft.graph.fileAttachment',
                    name: `planilha_${grupo.replace(/\s+/g, '_')}.png`,
                    contentBytes: imageResult.base64,
                    contentType: imageResult.mimeType,
                    contentId: imageId,
                    isInline: true
                }]
            };

            console.log('📎 Anexo configurado:', {
                name: `planilha_${grupo.replace(/\s+/g, '_')}.png`,
                contentType: imageResult.mimeType,
                contentId: imageId,
                isInline: true,
                hasContentBytes: !!imageResult.base64
            });

            const mailData = {
                message: message,
                saveToSentItems: false
            };

            // Usar chamada HTTP direta para a API Graph
            console.log('🚀 Enviando email via Microsoft Graph...');
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
                
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('✅ Email com imagem enviado com sucesso');
            return {
                success: true,
                message: 'Email com imagem enviado com sucesso'
            };

        } catch (error) {
            console.error('❌ Erro ao enviar email com imagem:', error);
            throw new Error(`Falha ao enviar email com imagem: ${error.message}`);
        }
    }

    async sendFileAsHtmlTableEmail({ to, subject, grupo, excelFilePath }) {
        try {
            console.log('📧 Enviando email com tabela HTML da planilha...');
            console.log(`   Para: ${to}`);
            console.log(`   Assunto: ${subject}`);
            console.log(`   Grupo: ${grupo}`);
            console.log(`   Arquivo Excel: ${excelFilePath}`);

            const accessToken = await this.getAccessToken();
            
            if (!accessToken) {
                throw new Error('Não foi possível obter token de acesso');
            }

            // Converter Excel para tabela HTML
            console.log('🔄 Convertendo Excel para tabela HTML...');
            const excelToHtmlService = require('./excel-to-html.service');
            const htmlResult = await excelToHtmlService.convertExcelToHtmlTable(excelFilePath);

            console.log('📊 Resultado da conversão:', {
                success: htmlResult.success,
                linhas: htmlResult.rowCount,
                colunas: htmlResult.columnCount,
                tamanhoHtml: htmlResult.htmlTable?.length || 0
            });

            if (!htmlResult.success) {
                throw new Error('Falha ao converter planilha para HTML');
            }

            // Gerar corpo do email com a tabela
            const emailHTML = excelToHtmlService.generateEmailBodyWithTable(grupo, htmlResult.htmlTable);

            const message = {
                subject: subject,
                body: {
                    contentType: 'HTML',
                    content: emailHTML
                },
                toRecipients: [{
                    emailAddress: {
                        address: to
                    }
                }]
            };

            console.log('📝 Email HTML preparado com tabela incorporada');

            const mailData = {
                message: message,
                saveToSentItems: false
            };

            // Enviar email via Microsoft Graph
            console.log('🚀 Enviando email com tabela HTML...');
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
                
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('✅ Email com tabela HTML enviado com sucesso');
            return {
                success: true,
                message: 'Email com tabela HTML enviado com sucesso'
            };

        } catch (error) {
            console.error('❌ Erro ao enviar email com tabela HTML:', error);
            throw new Error(`Falha ao enviar email com tabela HTML: ${error.message}`);
        }
    }

    async sendFileAsCopiedDataEmail({ to, subject, grupo, excelFilePath }) {
        try {
            console.log('📧 Enviando email com dados copiados da planilha...');
            console.log(`   Para: ${to}`);
            console.log(`   Assunto: ${subject}`);
            console.log(`   Grupo: ${grupo}`);
            console.log(`   Arquivo Excel: ${excelFilePath}`);

            const accessToken = await this.getAccessToken();
            
            if (!accessToken) {
                throw new Error('Não foi possível obter token de acesso');
            }

            // Copiar dados da planilha para área de transferência
            console.log('📋 Copiando dados da planilha...');
            const excelClipboardService = require('./excel-clipboard.service');
            const clipboardResult = await excelClipboardService.copyExcelRangeToClipboard(excelFilePath);

            console.log('📊 Resultado do copy/paste:', {
                success: clipboardResult.success,
                dataLength: clipboardResult.clipboardData?.length || 0
            });

            if (!clipboardResult.success) {
                throw new Error('Falha ao copiar dados da planilha');
            }

            // Gerar corpo do email com dados colados
            const emailHTML = excelClipboardService.generateEmailWithPastedData(grupo, clipboardResult.clipboardData);

            const message = {
                subject: subject,
                body: {
                    contentType: 'HTML',
                    content: emailHTML
                },
                toRecipients: [{
                    emailAddress: {
                        address: to
                    }
                }]
            };

            console.log('📝 Email preparado com dados colados');

            const mailData = {
                message: message,
                saveToSentItems: false
            };

            // Enviar email via Microsoft Graph
            console.log('🚀 Enviando email com dados colados...');
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
                
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('✅ Email com dados colados enviado com sucesso');
            return {
                success: true,
                message: 'Email com dados colados enviado com sucesso'
            };

        } catch (error) {
            console.error('❌ Erro ao enviar email com dados colados:', error);
            throw new Error(`Falha ao enviar email com dados colados: ${error.message}`);
        }
    }

    async sendFileAsRawContentEmail({ to, subject, grupo, excelFilePath }) {
        try {
            console.log('📧 Enviando email com conteúdo RAW da planilha...');
            console.log(`   Para: ${to}`);
            console.log(`   Assunto: ${subject}`);
            console.log(`   Grupo: ${grupo}`);
            console.log(`   Arquivo Excel: ${excelFilePath}`);

            const accessToken = await this.getAccessToken();
            
            if (!accessToken) {
                throw new Error('Não foi possível obter token de acesso');
            }

            // Obter conteúdo RAW da planilha (SEM PROCESSAMENTO)
            console.log('📋 Obtendo conteúdo RAW da planilha...');
            const excelRawCopyService = require('./excel-raw-copy.service');
            const rawResult = await excelRawCopyService.getRawExcelContent(excelFilePath);

            console.log('📊 Conteúdo RAW obtido:', {
                success: rawResult.success,
                contentLength: rawResult.rawContent?.length || 0
            });

            if (!rawResult.success) {
                throw new Error('Falha ao obter conteúdo RAW da planilha');
            }

            // Gerar corpo do email com conteúdo RAW (SEM TRANSFORMAÇÃO)
            const emailHTML = excelRawCopyService.generateEmailWithRawContent(grupo, rawResult.rawContent);

            const message = {
                subject: subject,
                body: {
                    contentType: 'HTML',
                    content: emailHTML
                },
                toRecipients: [{
                    emailAddress: {
                        address: to
                    }
                }]
            };

            console.log('📝 Email preparado com conteúdo RAW');

            const mailData = {
                message: message,
                saveToSentItems: false
            };

            // Enviar email via Microsoft Graph
            console.log('🚀 Enviando email com conteúdo RAW...');
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
                
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('✅ Email com conteúdo RAW enviado com sucesso');
            return {
                success: true,
                message: 'Email com conteúdo RAW enviado com sucesso'
            };

        } catch (error) {
            console.error('❌ Erro ao enviar email com conteúdo RAW:', error);
            throw new Error(`Falha ao enviar email com conteúdo RAW: ${error.message}`);
        }
    }

    // Método para enviar múltiplas planilhas separadamente
    async sendMultipleSpreadsheetsSeparately({ spreadsheets, grupo, baseEmailAddress }) {
        try {
            console.log('📧📧 Enviando múltiplas planilhas separadamente...');
            console.log(`   Grupo: ${grupo}`);
            console.log(`   Planilhas: ${spreadsheets.length}`);
            console.log(`   Base Email: ${baseEmailAddress}`);

            const accessToken = await this.getAccessToken();
            
            if (!accessToken) {
                throw new Error('Não foi possível obter token de acesso');
            }

            const results = [];

            for (let i = 0; i < spreadsheets.length; i++) {
                const spreadsheet = spreadsheets[i];
                
                // Determinar tipo e assunto baseado no nome do arquivo
                const tipoPlaniha = spreadsheet.fileName.includes('_Entrada_') ? 'Entrada' : 
                                   spreadsheet.fileName.includes('_Cobranca_') ? 'Honorários e Cobrança' : 
                                   `Planilha ${i + 1}`;
                
                const emailSubject = `${tipoPlaniha} de Cliente - ${grupo} - Operação`;

                try {
                    console.log(`📧 Enviando planilha ${i + 1}/${spreadsheets.length}: ${tipoPlaniha}`, {
                        arquivo: spreadsheet.fileName,
                        tipo: tipoPlaniha
                    });

                    await this.sendFileAsNativeHtmlEmail({
                        to: baseEmailAddress,
                        subject: emailSubject,
                        grupo: grupo,
                        excelFilePath: spreadsheet.filePath
                    });

                    results.push({
                        fileName: spreadsheet.fileName,
                        tipo: tipoPlaniha,
                        success: true,
                        subject: emailSubject
                    });

                    console.log(`✅ Planilha ${tipoPlaniha} enviada com sucesso`);

                } catch (emailError) {
                    console.error(`❌ Erro ao enviar planilha ${tipoPlaniha}:`, {
                        erro: emailError.message,
                        arquivo: spreadsheet.fileName
                    });

                    results.push({
                        fileName: spreadsheet.fileName,
                        tipo: tipoPlaniha,
                        success: false,
                        error: emailError.message
                    });
                }
            }

            const sucessos = results.filter(r => r.success).length;
            console.log(`✅ Processo concluído: ${sucessos}/${spreadsheets.length} planilhas enviadas com sucesso`);

            return {
                success: sucessos > 0,
                message: `${sucessos}/${spreadsheets.length} planilhas enviadas com sucesso`,
                results: results,
                totalSent: sucessos,
                totalFailed: spreadsheets.length - sucessos
            };

        } catch (error) {
            console.error('❌ Erro ao enviar múltiplas planilhas separadamente:', error);
            throw new Error(`Falha ao enviar múltiplas planilhas: ${error.message}`);
        }
    }

    // Método para enviar múltiplas planilhas em um único email
    async sendMultipleSpreadsheetsInOne({ spreadsheets, grupo, baseEmailAddress }) {
        try {
            console.log('📧 Enviando múltiplas planilhas em um único email...');
            console.log(`   Grupo: ${grupo}`);
            console.log(`   Planilhas: ${spreadsheets.length}`);
            console.log(`   Base Email: ${baseEmailAddress}`);

            const accessToken = await this.getAccessToken();
            
            if (!accessToken) {
                throw new Error('Não foi possível obter token de acesso');
            }

            const fs = require('fs');
            const attachments = [];

            // Preparar anexos
            for (const spreadsheet of spreadsheets) {
                if (fs.existsSync(spreadsheet.filePath)) {
                    const fileBuffer = fs.readFileSync(spreadsheet.filePath);
                    const base64Content = fileBuffer.toString('base64');
                    
                    attachments.push({
                        '@odata.type': '#microsoft.graph.fileAttachment',
                        name: spreadsheet.fileName,
                        contentBytes: base64Content
                    });
                    
                    console.log(`   ✅ Anexo adicionado: ${spreadsheet.fileName}`);
                }
            }

            if (attachments.length === 0) {
                throw new Error('Nenhum arquivo válido encontrado para anexar');
            }

            // Gerar corpo do email
            const tiposPlanihas = spreadsheets.map(s => {
                if (s.fileName.includes('_Entrada_')) return 'Entrada de Cliente';
                if (s.fileName.includes('_Cobranca_')) return 'Honorários e Cobrança';
                return 'Ficha de Cliente';
            });

            const emailSubject = `Fichas de Cliente - ${grupo} - Operação`;
            const emailBody = `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto;">
                    <div style="background: white; padding: 20px; border-radius: 8px;">
                        <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
                            Equipe, boa tarde!
                        </p>
                        <p style="color: #374151; line-height: 1.6; margin: 0 0 25px 0;">
                            Segue em anexo as seguintes fichas referentes ao grupo <strong>${grupo}</strong>:
                        </p>
                        
                        <ul style="color: #374151; line-height: 1.8; margin: 0 0 25px 20px;">
                            ${tiposPlanihas.map(tipo => `<li>${tipo}</li>`).join('')}
                        </ul>

                        <p style="color: #6b7280; font-size: 14px; margin: 0;">
                            Total de arquivos: ${attachments.length}
                        </p>
                    </div>
                </div>
            `;

            const message = {
                subject: emailSubject,
                body: {
                    contentType: 'HTML',
                    content: emailBody
                },
                toRecipients: [{
                    emailAddress: {
                        address: baseEmailAddress
                    }
                }],
                attachments: attachments
            };

            console.log('📎 Email preparado com anexos:', {
                anexos: attachments.length,
                assunto: emailSubject
            });

            const mailData = {
                message: message,
                saveToSentItems: false
            };

            // Enviar email via Microsoft Graph
            console.log('🚀 Enviando email único com múltiplas planilhas...');
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
                
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('✅ Email único com múltiplas planilhas enviado com sucesso');
            return {
                success: true,
                message: 'Email com múltiplas planilhas enviado com sucesso',
                attachmentCount: attachments.length,
                subject: emailSubject
            };

        } catch (error) {
            console.error('❌ Erro ao enviar email único com múltiplas planilhas:', error);
            throw new Error(`Falha ao enviar email único: ${error.message}`);
        }
    }

    // Método para enviar arquivo com HTML NATIVO do Excel (ZERO processamento)
    async sendFileAsNativeHtmlEmail({ to, subject, grupo, excelFilePath }) {
        try {
            console.log('📧 Enviando email com HTML NATIVO do Excel...');
            console.log(`   Para: ${to}`);
            console.log(`   Assunto: ${subject}`);
            console.log(`   Grupo: ${grupo}`);
            console.log(`   Arquivo Excel: ${excelFilePath}`);

            const accessToken = await this.getAccessToken();
            
            if (!accessToken) {
                throw new Error('Não foi possível obter token de acesso');
            }

            // Obter HTML NATIVO do Excel (SEM QUALQUER PROCESSAMENTO)
            console.log('📋 Obtendo HTML NATIVO do Excel...');
            const excelNativeService = require('./excel-native-html.service');
            const nativeResult = await excelNativeService.getExcelNativeHtml(excelFilePath);

            console.log('📊 HTML NATIVO obtido:', {
                success: nativeResult.success,
                contentLength: nativeResult.nativeHtml?.length || 0
            });

            if (!nativeResult.success) {
                throw new Error('Falha ao obter HTML NATIVO do Excel');
            }

            // Corrigir encoding de caracteres específicos no HTML antes de enviar
            let correctedHtml = nativeResult.nativeHtml;
            correctedHtml = correctedHtml.replace(/Certidço/g, 'Certidao Negativa');
            correctedHtml = correctedHtml.replace(/Certidðão/g, 'Certidao Negativa');
            correctedHtml = correctedHtml.replace(/Certidçao/g, 'Certidao Negativa');
            correctedHtml = correctedHtml.replace(/Negativ[aã]/g, 'Negativa');

            // Gerar corpo do email com HTML corrigido
            const emailHTML = excelNativeService.generateEmailWithNativeHtml(grupo, correctedHtml);

            const message = {
                subject: subject,
                body: {
                    contentType: 'HTML',
                    content: emailHTML
                },
                toRecipients: [{
                    emailAddress: {
                        address: to
                    }
                }]
            };

            console.log('📝 Email preparado com HTML NATIVO');

            const mailData = {
                message: message,
                saveToSentItems: false
            };

            // Enviar email via Microsoft Graph
            console.log('🚀 Enviando email com HTML NATIVO...');
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
                
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('✅ Email com HTML NATIVO enviado com sucesso');
            return {
                success: true,
                message: 'Email com HTML NATIVO enviado com sucesso'
            };

        } catch (error) {
            console.error('❌ Erro ao enviar email com HTML NATIVO:', error);
            throw new Error(`Falha ao enviar email com HTML NATIVO: ${error.message}`);
        }
    }
}

module.exports = new EmailService();
