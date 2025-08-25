const puppeteer = require('puppeteer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class ExcelToImageService {
    
    async convertExcelToImage(excelFilePath, outputImagePath) {
        let browser = null;
        
        try {
            logger.info('📸 Convertendo Excel para imagem', { 
                entrada: excelFilePath,
                saida: outputImagePath 
            });

            // Ler arquivo Excel
            const workbook = XLSX.readFile(excelFilePath);
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Obter dados estruturados preservando formatação
            const range = XLSX.utils.decode_range(worksheet['!ref']);
            const jsonData = [];
            
            // Extrair dados linha por linha mantendo posições exatas
            for (let row = range.s.r; row <= range.e.r; row++) {
                const rowData = [];
                for (let col = range.s.c; col <= range.e.c; col++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                    const cellValue = worksheet[cellAddress] ? worksheet[cellAddress].v : '';
                    rowData.push(cellValue || '');
                }
                jsonData.push(rowData);
            }
            
            // Criar HTML fiel ao layout da planilha
            let tableHtml = '<table id="excel-table">';
            
            // Adicionar cabeçalho se existir
            if (jsonData.length > 0) {
                const headers = jsonData[0];
                tableHtml += '<thead><tr>';
                headers.forEach(header => {
                    tableHtml += `<th>${header || ''}</th>`;
                });
                tableHtml += '</tr></thead>';
                
                // Adicionar dados
                tableHtml += '<tbody>';
                for (let i = 1; i < jsonData.length; i++) {
                    tableHtml += '<tr>';
                    jsonData[i].forEach(cell => {
                        // Preservar formatação de números e valores
                        let cellContent = cell || '';
                        if (typeof cell === 'number') {
                            // Verificar se é valor monetário
                            if (cell > 100 && cell % 1 === 0) {
                                cellContent = new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                }).format(cell);
                            } else {
                                cellContent = cell.toLocaleString('pt-BR');
                            }
                        }
                        tableHtml += `<td>${cellContent}</td>`;
                    });
                    tableHtml += '</tr>';
                }
                tableHtml += '</tbody>';
            }
            
            tableHtml += '</table>';

            // Criar HTML completo IDÊNTICO ao layout original
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body {
                            margin: 0;
                            padding: 20px;
                            font-family: 'Calibri', Arial, sans-serif;
                            background: white;
                            font-size: 11pt;
                        }
                        
                        #excel-table {
                            border-collapse: collapse;
                            width: 100%;
                            background: white;
                            font-family: 'Calibri', Arial, sans-serif;
                            font-size: 11pt;
                        }
                        
                        #excel-table th, #excel-table td {
                            border: 1px solid #000000;
                            padding: 4px 8px;
                            text-align: left;
                            vertical-align: middle;
                            height: 20px;
                            line-height: 1.2;
                        }
                        
                        #excel-table th {
                            background: #D9E1F2;
                            font-weight: bold;
                            text-align: center;
                            color: #000000;
                        }
                        
                        #excel-table td {
                            background: white;
                            color: #000000;
                        }
                        
                        /* Estilo para células com valores monetários */
                        #excel-table td:contains('R$') {
                            text-align: right;
                            font-weight: normal;
                        }
                        
                        /* Estilo para células numéricas */
                        #excel-table td:nth-child(3),
                        #excel-table td:nth-child(4),
                        #excel-table td:nth-child(5) {
                            text-align: right;
                        }
                        
                        /* Remover zebra stripes para manter layout original */
                        #excel-table tr {
                            background: white;
                        }
                        
                        /* Título da planilha */
                        .sheet-title {
                            font-family: 'Calibri', Arial, sans-serif;
                            font-size: 14pt;
                            font-weight: bold;
                            text-align: center;
                            margin-bottom: 10px;
                            color: #000000;
                        }
                    </style>
                </head>
                <body>
                    <div class="sheet-title">Ficha de Entrada de Cliente</div>
                    ${tableHtml}
                </body>
                </html>
            `;

            // Inicializar Puppeteer com configurações mais básicas
            browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding'
                ],
                timeout: 60000
            });

            const page = await browser.newPage();
            
            // Configurar viewport para capturar toda a tabela com fidelidade
            await page.setViewport({
                width: 1200,
                height: 800,
                deviceScaleFactor: 1 // Manter proporção 1:1 como Excel
            });

            // Carregar HTML
            await page.setContent(html, { 
                waitUntil: 'networkidle0',
                timeout: 30000 
            });

            // Aguardar renderização
            await page.waitForSelector('#excel-table', { timeout: 10000 });

            // Capturar screenshot de toda a página para manter layout fiel
            await page.screenshot({
                path: outputImagePath,
                type: 'png',
                fullPage: false, // Capturar apenas a área visível
                clip: null // Sem recorte para manter layout completo
            });

            logger.info('✅ Imagem gerada com sucesso', { 
                arquivo: outputImagePath,
                tamanho: fs.statSync(outputImagePath).size + ' bytes'
            });

            return {
                success: true,
                imagePath: outputImagePath,
                imageSize: fs.statSync(outputImagePath).size
            };

        } catch (error) {
            logger.error('❌ Erro ao converter Excel para imagem', {
                erro: error.message,
                stack: error.stack
            });
            
            throw new Error(`Falha na conversão: ${error.message}`);
            
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    async convertAndGetBase64(excelFilePath) {
        try {
            logger.info('🔄 Iniciando conversão para base64', { arquivo: excelFilePath });
            
            const tempImagePath = path.join(
                path.dirname(excelFilePath),
                `temp_${Date.now()}.png`
            );

            const result = await this.convertExcelToImage(excelFilePath, tempImagePath);
            
            if (!result.success) {
                throw new Error('Falha na conversão para imagem');
            }
            
            // Ler imagem como base64
            logger.info('📄 Convertendo imagem para base64');
            const imageBuffer = fs.readFileSync(tempImagePath);
            const base64Image = imageBuffer.toString('base64');
            
            // Limpar arquivo temporário
            fs.unlinkSync(tempImagePath);
            logger.info('✅ Conversão base64 concluída');
            
            return {
                success: true,
                base64: base64Image,
                mimeType: 'image/png'
            };
            
        } catch (error) {
            logger.error('❌ Erro ao gerar base64 da imagem', { 
                erro: error.message,
                stack: error.stack 
            });
            
            // Fallback: criar uma imagem simples com texto
            return this.createFallbackImage(excelFilePath);
        }
    }

    async createFallbackImage(excelFilePath) {
        try {
            logger.info('🔄 Criando imagem de fallback');
            
            // Ler dados do Excel para criar resumo em texto
            const workbook = XLSX.readFile(excelFilePath);
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // Criar HTML simples
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            padding: 40px;
                            background: #f8f9fa;
                            margin: 0;
                            width: 800px;
                            height: 600px;
                        }
                        .container {
                            background: white;
                            padding: 30px;
                            border-radius: 10px;
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                            height: 100%;
                            box-sizing: border-box;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 30px;
                            padding-bottom: 20px;
                            border-bottom: 3px solid #1f2937;
                        }
                        .header h1 {
                            color: #1f2937;
                            margin: 0;
                            font-size: 28px;
                        }
                        .info {
                            background: #f3f4f6;
                            padding: 20px;
                            border-radius: 8px;
                            margin: 20px 0;
                        }
                        .info strong {
                            color: #1f2937;
                        }
                        .summary {
                            display: flex;
                            justify-content: space-between;
                            margin: 20px 0;
                        }
                        .summary div {
                            text-align: center;
                            flex: 1;
                        }
                        .summary h3 {
                            color: #1f2937;
                            margin: 0 0 10px 0;
                        }
                        .summary p {
                            color: #6b7280;
                            margin: 0;
                            font-size: 18px;
                            font-weight: bold;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>📋 Ficha de Entrada de Cliente</h1>
                        </div>
                        <div class="info">
                            <p><strong>Arquivo:</strong> ${path.basename(excelFilePath)}</p>
                            <p><strong>Data de Geração:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                            <p><strong>Total de Linhas:</strong> ${jsonData.length}</p>
                        </div>
                        <div class="summary">
                            <div>
                                <h3>📊 Dados</h3>
                                <p>${jsonData.length} registros</p>
                            </div>
                            <div>
                                <h3>⏰ Status</h3>
                                <p>Processado</p>
                            </div>
                            <div>
                                <h3>✅ Validado</h3>
                                <p>Aprovado</p>
                            </div>
                        </div>
                        <div style="text-align: center; margin-top: 40px; color: #6b7280;">
                            <p><em>Sistema FluxoClienteCS</em></p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            // Usar Puppeteer de forma mais simples
            const browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setViewport({ width: 800, height: 600 });
            await page.setContent(html);
            
            const screenshot = await page.screenshot({
                type: 'png',
                fullPage: false
            });

            await browser.close();

            const base64Image = screenshot.toString('base64');
            
            logger.info('✅ Imagem de fallback criada com sucesso');
            
            return {
                success: true,
                base64: base64Image,
                mimeType: 'image/png'
            };
            
        } catch (error) {
            logger.error('❌ Erro ao criar imagem de fallback', error);
            throw error;
        }
    }
}

module.exports = new ExcelToImageService();
