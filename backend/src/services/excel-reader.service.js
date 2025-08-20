const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class ExcelReaderService {
    constructor() {
        this.sharePointFilesPath = path.join(__dirname, '../storage/sharepoint-files');
    }

    // Buscar o arquivo mais recente baixado
    getLatestDownloadedFile() {
        try {
            if (!fs.existsSync(this.sharePointFilesPath)) {
                throw new Error('Diretório de arquivos SharePoint não encontrado');
            }

            const files = fs.readdirSync(this.sharePointFilesPath)
                .filter(file => file.endsWith('.xlsm') || file.endsWith('.xlsx'))
                .map(file => ({
                    name: file,
                    path: path.join(this.sharePointFilesPath, file),
                    stats: fs.statSync(path.join(this.sharePointFilesPath, file))
                }))
                .sort((a, b) => b.stats.mtime - a.stats.mtime); // Ordenar por data modificação (mais recente primeiro)

            if (files.length === 0) {
                throw new Error('Nenhum arquivo Excel encontrado no diretório');
            }

            const latestFile = files[0];
            logger.info('📄 Arquivo mais recente encontrado:', {
                fileName: latestFile.name,
                filePath: latestFile.path,
                modifiedAt: latestFile.stats.mtime
            });

            return latestFile;
        } catch (error) {
            logger.error('❌ Erro ao buscar arquivo mais recente:', error);
            throw error;
        }
    }

    // Ler planilha e extrair dados da aba "Clientes"
    readClientesSheet(filePath = null) {
        try {
            // Se não especificar arquivo, usar o mais recente
            const file = filePath ? { path: filePath } : this.getLatestDownloadedFile();
            
            logger.info('📖 Lendo arquivo Excel:', { filePath: file.path });

            // Ler o arquivo Excel
            const workbook = XLSX.readFile(file.path);
            
            // Listar todas as abas
            const sheetNames = workbook.SheetNames;
            logger.info('📋 Abas encontradas:', { sheets: sheetNames });

            // Procurar a aba "Clientes" (pode ter variações de nome)
            const clientesSheetName = sheetNames.find(name => 
                name.toLowerCase().includes('cliente') || 
                name.toLowerCase().includes('client')
            );

            if (!clientesSheetName) {
                throw new Error(`Aba "Clientes" não encontrada. Abas disponíveis: ${sheetNames.join(', ')}`);
            }

            logger.info('✅ Aba "Clientes" encontrada:', { sheetName: clientesSheetName });

            // Ler a aba específica
            const worksheet = workbook.Sheets[clientesSheetName];
            
            // Converter para JSON (com headers na primeira linha)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1, // Usar números como índices
                defval: null, // Valor padrão para células vazias
                blankrows: false // Ignorar linhas vazias
            });

            if (jsonData.length === 0) {
                throw new Error('Nenhum dado encontrado na aba "Clientes"');
            }

            // Detectar automaticamente onde começam os cabeçalhos reais
            let headerRowIndex = -1;
            let headers = [];

            // Procurar por uma linha que tenha pelo menos 3 colunas preenchidas e com texto
            for (let i = 0; i < Math.min(10, jsonData.length); i++) {
                const row = jsonData[i];
                const filledCells = row.filter(cell => 
                    cell !== null && 
                    cell !== undefined && 
                    cell !== '' && 
                    typeof cell === 'string' &&
                    cell.length > 1
                ).length;

                if (filledCells >= 3) {
                    headerRowIndex = i;
                    headers = row;
                    break;
                }
            }

            if (headerRowIndex === -1) {
                // Fallback: usar a segunda linha se não encontrar
                headerRowIndex = 1;
                headers = jsonData[1] || [];
            }

            logger.info('🎯 Cabeçalhos detectados na linha:', {
                headerRowIndex: headerRowIndex + 1,
                totalHeaders: headers.filter(h => h !== null && h !== undefined && h !== '').length
            });

            // Obter dados a partir da linha seguinte aos cabeçalhos
            const dataRows = jsonData.slice(headerRowIndex + 1);

            // Limpar e normalizar cabeçalhos
            const cleanHeaders = headers.map((header, index) => {
                if (!header || header === null || header === undefined || header === '') {
                    return `Coluna_${index + 1}`;
                }
                
                // Limpar o cabeçalho
                let cleanHeader = String(header).trim();
                
                // Se for um número muito grande, provavelmente não é um cabeçalho válido
                if (!isNaN(cleanHeader) && parseFloat(cleanHeader) > 1000) {
                    return `Valor_${index + 1}`;
                }
                
                return cleanHeader;
            });

            logger.info('📊 Dados extraídos:', {
                sheetName: clientesSheetName,
                headerRowIndex: headerRowIndex + 1,
                totalHeaders: cleanHeaders.length,
                totalDataRows: dataRows.length,
                sampleHeaders: cleanHeaders.slice(0, 10)
            });

            // Converter para array de objetos
            const clients = dataRows
                .filter(row => row.some(cell => cell !== null && cell !== '' && cell !== undefined)) // Filtrar linhas completamente vazias
                .map((row, index) => {
                    const client = {};
                    cleanHeaders.forEach((header, colIndex) => {
                        if (header && colIndex < row.length) {
                            client[header] = row[colIndex] || null;
                        }
                    });
                    
                    // Adicionar índice da linha para debug
                    client._rowIndex = headerRowIndex + index + 2; // +2 porque arrays começam em 0 e pulamos cabeçalho
                    
                    return client;
                })
                .filter(client => {
                    // Filtrar registros que têm pelo menos um campo útil preenchido
                    const filledFields = Object.keys(client)
                        .filter(key => key !== '_rowIndex')
                        .filter(key => client[key] !== null && client[key] !== undefined && client[key] !== '');
                    
                    return filledFields.length > 0;
                });

            logger.success('✅ Conversão para JSON concluída:', {
                totalClients: clients.length,
                sampleHeaders: cleanHeaders.slice(0, 5),
                sampleClient: clients[0] || null
            });

            return {
                success: true,
                filePath: file.path,
                fileName: path.basename(file.path),
                sheetName: clientesSheetName,
                headers: cleanHeaders,
                headerRowIndex: headerRowIndex + 1,
                totalRows: clients.length,
                clients
            };

        } catch (error) {
            logger.error('❌ Erro ao ler planilha Excel:', error);
            throw error;
        }
    }

    // Salvar dados extraídos em arquivo JSON (para debug/análise)
    saveToJsonFile(data, outputFileName = null) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = outputFileName || `clientes_extracted_${timestamp}.json`;
            const outputPath = path.join(this.sharePointFilesPath, fileName);

            // Criar objeto com metadados
            const output = {
                extractedAt: new Date().toISOString(),
                sourceFile: data.fileName,
                sheetName: data.sheetName,
                totalRecords: data.totalRows,
                headers: data.headers,
                clients: data.clients
            };

            fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
            
            logger.success('💾 Dados salvos em arquivo JSON:', {
                fileName,
                outputPath,
                totalRecords: data.totalRows
            });

            return {
                success: true,
                fileName,
                outputPath,
                totalRecords: data.totalRows
            };

        } catch (error) {
            logger.error('❌ Erro ao salvar arquivo JSON:', error);
            throw error;
        }
    }

    // Analisar estrutura dos dados (para entender os campos)
    analyzeDataStructure(clients) {
        try {
            if (!clients || clients.length === 0) {
                return { fields: [], analysis: 'Nenhum cliente para analisar' };
            }

            // Analisar todos os campos presentes
            const fieldAnalysis = {};
            
            clients.forEach(client => {
                Object.keys(client).forEach(field => {
                    if (field === '_rowIndex') return; // Ignorar campo interno
                    
                    if (!fieldAnalysis[field]) {
                        fieldAnalysis[field] = {
                            totalValues: 0,
                            nullValues: 0,
                            uniqueValues: new Set(),
                            dataTypes: new Set(),
                            samples: []
                        };
                    }

                    const value = client[field];
                    const analysis = fieldAnalysis[field];

                    if (value === null || value === undefined || value === '') {
                        analysis.nullValues++;
                    } else {
                        analysis.totalValues++;
                        analysis.uniqueValues.add(value);
                        analysis.dataTypes.add(typeof value);
                        
                        if (analysis.samples.length < 5) {
                            analysis.samples.push(value);
                        }
                    }
                });
            });

            // Converter Set para Array e limitar exemplos
            const fieldsInfo = Object.keys(fieldAnalysis).map(field => {
                const analysis = fieldAnalysis[field];
                return {
                    field,
                    totalValues: analysis.totalValues,
                    nullValues: analysis.nullValues,
                    fillRate: ((analysis.totalValues / clients.length) * 100).toFixed(1) + '%',
                    uniqueValues: analysis.uniqueValues.size,
                    dataTypes: Array.from(analysis.dataTypes),
                    samples: analysis.samples
                };
            });

            logger.info('🔍 Análise da estrutura dos dados:', {
                totalClients: clients.length,
                totalFields: fieldsInfo.length,
                fieldsInfo
            });

            return {
                totalRecords: clients.length,
                totalFields: fieldsInfo.length,
                fields: fieldsInfo
            };

        } catch (error) {
            logger.error('❌ Erro ao analisar estrutura dos dados:', error);
            throw error;
        }
    }
}

module.exports = new ExcelReaderService();
