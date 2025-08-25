const express = require('express');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Renderizar Excel como HTML (sem autenticação para iframe)
router.get('/view/:fileName', async (req, res) => {
    try {
        const { fileName } = req.params;

        // Validar nome do arquivo
        if (!fileName || !fileName.endsWith('.xlsx')) {
            return res.status(400).send('<h1>Erro: Nome de arquivo inválido</h1>');
        }

        // Caminho do arquivo
        const filePath = path.join(__dirname, '../../storage/generated-reports', fileName);
        
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

        // Criar página HTML completa com estilo Excel
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
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: #f5f5f5;
                    }
                    .header {
                        background: white;
                        padding: 15px 20px;
                        margin-bottom: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .download-btn {
                        background: #0078d4;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 4px;
                        text-decoration: none;
                        font-weight: 500;
                    }
                    .download-btn:hover {
                        background: #106ebe;
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
                    #excel-table th {
                        background: #f8f9fa;
                        border: 1px solid #d1d5db;
                        padding: 8px 12px;
                        text-align: left;
                        font-weight: 600;
                        color: #374151;
                    }
                    #excel-table td {
                        border: 1px solid #d1d5db;
                        padding: 6px 12px;
                        vertical-align: top;
                    }
                    #excel-table tr:nth-child(even) {
                        background: #f9fafb;
                    }
                    #excel-table tr:hover {
                        background: #e5f3ff;
                    }
                    .sheet-tabs {
                        background: #f1f3f4;
                        padding: 8px 16px;
                        border-bottom: 1px solid #dadce0;
                        font-size: 12px;
                    }
                    .sheet-tab {
                        display: inline-block;
                        padding: 6px 12px;
                        background: white;
                        border: 1px solid #dadce0;
                        border-bottom: none;
                        margin-right: 2px;
                        cursor: default;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h2 style="margin: 0; color: #1f2937;">📊 ${fileName}</h2>
                        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Planilha Excel</p>
                    </div>
                    <a href="/api/xlsx-generator/download/${fileName}" class="download-btn">
                        📥 Download Excel
                    </a>
                </div>
                
                <div class="excel-container">
                    <div class="sheet-tabs">
                        <span class="sheet-tab">${firstSheetName}</span>
                    </div>
                    <div style="overflow: auto; max-height: 80vh;">
                        ${htmlTable}
                    </div>
                </div>
            </body>
            </html>
        `;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);

    } catch (error) {
        console.error('❌ Erro ao renderizar Excel como HTML', error);
        return res.status(500).send(`
            <html>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1>❌ Erro ao carregar planilha</h1>
                    <p>${error.message}</p>
                </body>
            </html>
        `);
    }
});

module.exports = router;
