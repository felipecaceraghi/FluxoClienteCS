const express = require('express');
const xlsxGeneratorController = require('../controllers/xlsx-generator.controller');
const authMiddleware = require('../middleware/auth');
const { validateGenerateDualSpreadsheet, validateAndSendDual } = require('../middleware/validation');

const router = express.Router();

// Visualizar arquivo como HTML (sem autenticação para iframe)
// GET /api/xlsx-generator/html/:fileName
router.get('/html/:fileName', (req, res) => {
    const { fileName } = req.params;
    const XLSX = require('xlsx');
    const path = require('path');
    const fs = require('fs');

    try {
        // Validar nome do arquivo
        if (!fileName || !fileName.endsWith('.xlsx')) {
            return res.status(400).send('<h1>Erro: Nome de arquivo inválido</h1>');
        }

        // Caminho do arquivo
        const filePath = path.join(__dirname, '../storage/generated-reports', fileName);
        
        // Verificar se arquivo existe
        if (!fs.existsSync(filePath)) {
            return res.status(404).send('<h1>Erro: Arquivo não encontrado</h1>');
        }

        // Ler arquivo Excel
        const workbook = XLSX.readFile(filePath);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converter para HTML
        const htmlTable = XLSX.utils.sheet_to_html(worksheet, {
            id: 'excel-table',
            editable: false
        });

        // Criar página HTML completa
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${fileName}</title>
                <meta charset="utf-8">
                <style>
                    body {
                        margin: 0;
                        padding: 20px;
                        font-family: 'Segoe UI', Arial, sans-serif;
                        background: #f5f5f5;
                    }
                    .header {
                        background: white;
                        padding: 15px 20px;
                        margin-bottom: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .excel-container {
                        background: white;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    #excel-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 13px;
                    }
                    #excel-table th, #excel-table td {
                        border: 1px solid #d1d5db;
                        padding: 8px 12px;
                        text-align: left;
                    }
                    #excel-table th {
                        background: #f8f9fa;
                        font-weight: 600;
                    }
                    #excel-table tr:nth-child(even) {
                        background: #f9fafb;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2 style="margin: 0;">📊 ${fileName}</h2>
                </div>
                <div class="excel-container">
                    ${htmlTable}
                </div>
            </body>
            </html>
        `;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);

    } catch (error) {
        console.error('Erro ao renderizar Excel:', error);
        return res.status(500).send(`
            <html>
                <body>
                    <h1>❌ Erro ao carregar planilha</h1>
                    <p>${error.message}</p>
                </body>
            </html>
        `);
    }
});

// Validar e enviar planilha (SEM AUTENTICAÇÃO PARA TESTE)
// POST /api/xlsx-generator/validate-and-send
router.post('/validate-and-send', xlsxGeneratorController.validateAndSend);

// Validar e enviar planilhas duplas (SEM AUTENTICAÇÃO PARA TESTE)
// POST /api/xlsx-generator/validate-and-send-dual
router.post('/validate-and-send-dual', validateAndSendDual, xlsxGeneratorController.validateAndSendDual);

// Aplicar middleware de autenticação em todas as outras rotas
router.use(authMiddleware);

// Estatísticas de relatórios
// GET /api/xlsx-generator/stats
router.get('/stats', xlsxGeneratorController.getStats);

// Testar envio de email com Python
// POST /api/xlsx-generator/test-python-email
router.post('/test-python-email', async (req, res) => {
    try {
        const { fileName, to = 'felipe.caceraghi@gofurthergroup.com.br', subject, grupo } = req.body;
        
        if (!fileName) {
            return res.status(400).json({
                success: false,
                error: 'fileName é obrigatório'
            });
        }

        const xlsxGeneratorService = require('../services/xlsx-generator.service');
        const emailService = require('../services/email.service');
        
        // Verificar se arquivo existe
        if (!xlsxGeneratorService.fileExists(fileName)) {
            return res.status(404).json({
                success: false,
                error: 'Arquivo não encontrado'
            });
        }

        const excelFilePath = xlsxGeneratorService.getFilePath(fileName);
        const emailSubject = subject || `Teste Python - ${fileName}`;
        const grupoName = grupo || 'Teste';

        console.log('🧪 TESTANDO ENVIO COM PYTHON', {
            arquivo: fileName,
            para: to,
            assunto: emailSubject,
            grupo: grupoName
        });

        // Usar o método que chama o script Python
        await emailService.sendFileAsImageEmail({
            to: to,
            subject: emailSubject,
            grupo: grupoName,
            excelFilePath: excelFilePath
        });

        console.log('✅ EMAIL ENVIADO COM PYTHON COM SUCESSO');

        return res.json({
            success: true,
            message: 'Email enviado com sucesso usando Python!',
            data: {
                fileName: fileName,
                sentTo: to,
                subject: emailSubject,
                method: 'Python Script',
                sentAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ ERRO NO TESTE PYTHON EMAIL:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao testar envio com Python',
            details: error.message
        });
    }
});

// Testar conversão para imagem e salvar arquivo
// POST /api/xlsx-generator/test-image-file
router.post('/test-image-file', xlsxGeneratorController.testImageFile);

// Testar envio de email
// POST /api/xlsx-generator/test-email
router.post('/test-email', xlsxGeneratorController.testEmail);

// Testar conversão de imagem
// POST /api/xlsx-generator/test-image
router.post('/test-image', xlsxGeneratorController.testImageConversion);

// Gerar planilha XLSX de SAÍDA para um grupo específico
// GET /api/xlsx-generator/generate-saida/:grupo
router.get('/generate-saida/:grupo', xlsxGeneratorController.generateSaidaForGroup);

// Gerar planilha XLSX de SAÍDA para um cliente específico
// GET /api/xlsx-generator/generate-saida-cliente/:cliente
router.get('/generate-saida-cliente/:cliente', xlsxGeneratorController.generateSaidaForClient);

// Gerar planilha XLSX de ENTRADA para um cliente específico
// GET /api/xlsx-generator/generate-entrada-cliente/:cliente
router.get('/generate-entrada-cliente/:cliente', xlsxGeneratorController.generateEntradaForClient);

// Gerar planilha XLSX para um grupo específico (ENTRADA)
// GET /api/xlsx-generator/generate/:grupo
router.get('/generate/:grupo', xlsxGeneratorController.generateForGroup);

// Gerar planilhas duplas (entrada e cobrança)
// POST /api/xlsx-generator/generate-dual
router.post('/generate-dual', validateGenerateDualSpreadsheet, xlsxGeneratorController.generateDualSpreadsheets);

// Visualizar arquivo gerado (sem download)
// GET /api/xlsx-generator/view/:fileName
router.get('/view/:fileName', xlsxGeneratorController.viewFile);

// Download de arquivo gerado
// GET /api/xlsx-generator/download/:fileName
router.get('/download/:fileName', xlsxGeneratorController.downloadFile);

// Gerar planilha XLSX com dados customizados
// POST /api/xlsx-generator/custom
router.post('/custom', xlsxGeneratorController.generateCustom);

// Listar arquivos disponíveis para download
// GET /api/xlsx-generator/files
router.get('/files', xlsxGeneratorController.listAvailableFiles);

module.exports = router;
