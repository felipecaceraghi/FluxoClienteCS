const xlsxGeneratorService = require('../services/xlsx-generator.service');
const groupSearchService = require('../services/group-search.service');
const logger = require('../utils/logger');

class XlsxGeneratorController {
    // Gerar planilha XLSX para um grupo específico
    async generateForGroup(req, res) {
        try {
            const { grupo } = req.params;
            
            if (!grupo) {
                return res.status(400).json({
                    success: false,
                    error: 'Parâmetro grupo é obrigatório'
                });
            }

            logger.info('📊 Solicitação de geração de XLSX', { 
                grupo, 
                usuario: req.user?.email || 'unknown' 
            });

            // Buscar dados do grupo
            const searchResult = await groupSearchService.searchByGroup(grupo);
            
            if (!searchResult.success || !searchResult.empresas || searchResult.empresas.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: `Nenhuma empresa encontrada para o grupo: ${grupo}`,
                    availableGroups: await groupSearchService.getAvailableGroups()
                });
            }

            // Gerar planilha
            const generationResult = await xlsxGeneratorService.generateXlsx(grupo, searchResult.empresas);
            
            if (!generationResult.success) {
                throw new Error('Falha na geração da planilha');
            }

            // Limpar arquivos antigos em background
            setImmediate(() => {
                xlsxGeneratorService.cleanupOldFiles();
            });

            // Retornar informações do arquivo para visualização
            return res.json({
                success: true,
                message: 'Planilha gerada com sucesso',
                data: {
                    fileName: generationResult.fileName,
                    downloadUrl: `/api/xlsx-generator/download/${generationResult.fileName}`,
                    viewUrl: `/api/xlsx-generator/view/${generationResult.fileName}`,
                    grupo: grupo,
                    empresas: searchResult.empresas.length,
                    geradoEm: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('❌ Erro ao gerar planilha XLSX', {
                grupo: req.params.grupo,
                error: error.message,
                stack: error.stack
            });

            return res.status(500).json({
                success: false,
                error: 'Erro interno do servidor ao gerar planilha',
                message: error.message
            });
        }
    }

    // Gerar duas planilhas diferentes (entrada e cobrança)
    async generateDualSpreadsheets(req, res) {
        try {
            const { grupo, tiposPlanilha, enviarSeparado, emailDestinatario } = req.body;
            
            logger.info('📊📊 Solicitação de geração de planilhas duplas', { 
                grupo, 
                tiposPlanilha,
                enviarSeparado,
                usuario: req.user?.email || 'unknown' 
            });

            // Buscar dados do grupo
            const searchResult = await groupSearchService.searchByGroup(grupo);
            
            if (!searchResult.success || !searchResult.empresas || searchResult.empresas.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: `Nenhuma empresa encontrada para o grupo: ${grupo}`,
                    availableGroups: await groupSearchService.getAvailableGroups()
                });
            }

            // Gerar as planilhas solicitadas
            const results = [];
            
            for (const tipo of tiposPlanilha) {
                logger.info(`📄 Gerando planilha tipo: ${tipo}`);
                
                const generationResult = await xlsxGeneratorService.generateSpreadsheetByType(
                    grupo, 
                    searchResult.empresas, 
                    tipo
                );
                
                if (generationResult.success) {
                    results.push({
                        tipo: tipo,
                        fileName: generationResult.fileName,
                        filePath: generationResult.filePath,
                        downloadUrl: `/api/xlsx-generator/download/${generationResult.fileName}`,
                        viewUrl: `/api/xlsx-generator/view/${generationResult.fileName}`
                    });
                }
            }

            if (results.length === 0) {
                throw new Error('Falha na geração de todas as planilhas');
            }

            // Limpar arquivos antigos em background
            setImmediate(() => {
                xlsxGeneratorService.cleanupOldFiles();
            });

            return res.json({
                success: true,
                message: `${results.length} planilha(s) gerada(s) com sucesso`,
                data: {
                    planilhas: results,
                    grupo: grupo,
                    empresas: searchResult.empresas.length,
                    enviarSeparado: enviarSeparado,
                    emailDestinatario: emailDestinatario,
                    geradoEm: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('❌ Erro ao gerar planilhas duplas', {
                grupo: req.body.grupo,
                error: error.message,
                stack: error.stack
            });

            return res.status(500).json({
                success: false,
                error: 'Erro interno do servidor ao gerar planilhas duplas',
                message: error.message
            });
        }
    }

    // View de arquivo gerado (servir sem download)
    async viewFile(req, res) {
        try {
            const { fileName } = req.params;
            
            if (!fileName || !fileName.endsWith('.xlsx')) {
                return res.status(400).json({
                    success: false,
                    error: 'Nome de arquivo inválido'
                });
            }

            // Verificar se arquivo existe
            if (!xlsxGeneratorService.fileExists(fileName)) {
                return res.status(404).json({
                    success: false,
                    error: 'Arquivo não encontrado ou expirado'
                });
            }

            const filePath = xlsxGeneratorService.getFilePath(fileName);
            
            logger.info('👁️ Visualização de arquivo solicitada', { 
                arquivo: fileName,
                usuario: req.user?.email || 'unknown'
            });

            // Configurar cabeçalhos para visualização inline
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Access-Control-Allow-Origin', '*');

            // Enviar arquivo para visualização
            return res.sendFile(filePath, (err) => {
                if (err) {
                    logger.error('❌ Erro ao enviar arquivo para visualização', { 
                        arquivo: fileName, 
                        error: err.message 
                    });
                    
                    if (!res.headersSent) {
                        return res.status(500).json({
                            success: false,
                            error: 'Erro ao visualizar arquivo'
                        });
                    }
                } else {
                    logger.info('✅ Visualização enviada', { arquivo: fileName });
                }
            });

        } catch (error) {
            logger.error('❌ Erro na visualização', {
                arquivo: req.params.fileName,
                error: error.message
            });

            return res.status(500).json({
                success: false,
                error: 'Erro interno do servidor na visualização'
            });
        }
    }

    // Download de arquivo gerado
    async downloadFile(req, res) {
        try {
            const { fileName } = req.params;
            
            if (!fileName || !fileName.endsWith('.xlsx')) {
                return res.status(400).json({
                    success: false,
                    error: 'Nome de arquivo inválido'
                });
            }

            // Verificar se arquivo existe
            if (!xlsxGeneratorService.fileExists(fileName)) {
                return res.status(404).json({
                    success: false,
                    error: 'Arquivo não encontrado ou expirado'
                });
            }

            const filePath = xlsxGeneratorService.getFilePath(fileName);
            
            logger.info('📁 Download de arquivo solicitado', { 
                arquivo: fileName,
                usuario: req.user?.email || 'unknown'
            });

            // Configurar cabeçalhos para download
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Cache-Control', 'no-cache');

            // Enviar arquivo
            return res.sendFile(filePath, (err) => {
                if (err) {
                    logger.error('❌ Erro ao enviar arquivo', { 
                        arquivo: fileName, 
                        error: err.message 
                    });
                    
                    if (!res.headersSent) {
                        return res.status(500).json({
                            success: false,
                            error: 'Erro ao fazer download do arquivo'
                        });
                    }
                } else {
                    logger.info('✅ Download concluído', { arquivo: fileName });
                }
            });

        } catch (error) {
            logger.error('❌ Erro no download', {
                arquivo: req.params.fileName,
                error: error.message
            });

            return res.status(500).json({
                success: false,
                error: 'Erro interno do servidor no download'
            });
        }
    }

    // Listar arquivos disponíveis para download
    async listAvailableFiles(req, res) {
        try {
            const fs = require('fs');
            const path = require('path');
            
            const outputDir = path.join(__dirname, '../storage/generated-reports');
            
            if (!fs.existsSync(outputDir)) {
                return res.json({
                    success: true,
                    data: [],
                    message: 'Nenhum arquivo disponível'
                });
            }

            const files = fs.readdirSync(outputDir)
                .filter(file => file.endsWith('.xlsx'))
                .map(file => {
                    const filePath = path.join(outputDir, file);
                    const stats = fs.statSync(filePath);
                    
                    return {
                        fileName: file,
                        downloadUrl: `/api/xlsx-generator/download/${file}`,
                        tamanho: stats.size,
                        criadoEm: stats.birthtime,
                        modificadoEm: stats.mtime
                    };
                })
                .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

            return res.json({
                success: true,
                data: files,
                total: files.length
            });

        } catch (error) {
            logger.error('❌ Erro ao listar arquivos', error);
            
            return res.status(500).json({
                success: false,
                error: 'Erro ao listar arquivos disponíveis'
            });
        }
    }

    // Gerar planilha com dados personalizados
    async generateCustom(req, res) {
        try {
            const { groupName, companies } = req.body;
            
            if (!groupName || !companies || !Array.isArray(companies) || companies.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'groupName e companies (array não vazio) são obrigatórios'
                });
            }

            logger.info('📊 Geração customizada de XLSX', { 
                grupo: groupName,
                empresas: companies.length,
                usuario: req.user?.email || 'unknown' 
            });

            // Gerar planilha com dados fornecidos
            const generationResult = await xlsxGeneratorService.generateXlsx(groupName, companies);
            
            if (!generationResult.success) {
                throw new Error('Falha na geração da planilha customizada');
            }

            return res.json({
                success: true,
                message: 'Planilha customizada gerada com sucesso',
                data: {
                    fileName: generationResult.fileName,
                    downloadUrl: `/api/xlsx-generator/download/${generationResult.fileName}`,
                    grupo: groupName,
                    empresas: generationResult.stats.empresas,
                    tamanhoArquivo: generationResult.stats.tamanhoArquivo,
                    geradoEm: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('❌ Erro ao gerar planilha customizada', {
                error: error.message,
                stack: error.stack
            });

            return res.status(500).json({
                success: false,
                error: 'Erro interno do servidor ao gerar planilha customizada',
                message: error.message
            });
        }
    }

    // Validar e enviar planilhas duplas por email
    async validateAndSendDual(req, res) {
        try {
            const { fileNames, grupo, approved, enviarSeparado } = req.body;
            
            if (!approved) {
                return res.json({
                    success: true,
                    message: 'Planilhas rejeitadas pelo usuário',
                    action: 'rejected'
                });
            }

            logger.info('📧📧 Validação e envio de planilhas duplas', { 
                arquivos: fileNames,
                grupo: grupo,
                enviarSeparado: enviarSeparado,
                usuario: req.user?.email || 'unknown' 
            });

            // Verificar se todos os arquivos existem
            for (const fileName of fileNames) {
                if (!xlsxGeneratorService.fileExists(fileName)) {
                    return res.status(404).json({
                        success: false,
                        error: `Arquivo não encontrado: ${fileName}`
                    });
                }
            }

            const emailService = require('../services/email.service');
            const fs = require('fs');
            const path = require('path');
            
            const results = [];

            if (enviarSeparado) {
                // Enviar cada planilha separadamente
                for (let i = 0; i < fileNames.length; i++) {
                    const fileName = fileNames[i];
                    const filePath = xlsxGeneratorService.getFilePath(fileName);
                    
                    // Determinar tipo da planilha pelo nome do arquivo
                    const tipoPlaniha = fileName.includes('_Entrada_') ? 'Entrada' : 
                                       fileName.includes('_Cobranca_') ? 'Honorários e Cobrança' : 
                                       `Planilha ${i + 1}`;
                    
                    const emailSubject = `${tipoPlaniha} de Cliente - ${grupo} - Operação`;
                    
                    try {
                        logger.info(`📧 Enviando planilha ${i + 1}/${fileNames.length}: ${tipoPlaniha}`, {
                            arquivo: fileName,
                            tipo: tipoPlaniha
                        });

                        await emailService.sendFileAsNativeHtmlEmail({
                            to: 'felipe.caceraghi@gofurthergroup.com.br',
                            subject: emailSubject,
                            grupo: grupo,
                            excelFilePath: filePath
                        });

                        results.push({
                            fileName: fileName,
                            tipo: tipoPlaniha,
                            emailSent: true,
                            subject: emailSubject
                        });

                        logger.info(`✅ Planilha ${tipoPlaniha} enviada com sucesso`);

                    } catch (emailError) {
                        logger.error(`❌ Erro ao enviar planilha ${tipoPlaniha}:`, {
                            erro: emailError.message,
                            arquivo: fileName
                        });

                        results.push({
                            fileName: fileName,
                            tipo: tipoPlaniha,
                            emailSent: false,
                            error: emailError.message
                        });
                    }
                }
            } else {
                // Enviar ambas as planilhas em um único email
                const attachments = fileNames.map(fileName => ({
                    path: xlsxGeneratorService.getFilePath(fileName),
                    filename: fileName
                }));

                const emailSubject = `Entrada e Honorários de Cliente - ${grupo} - Operação`;

                try {
                    logger.info('📧 Enviando email único com múltiplas planilhas', {
                        arquivos: fileNames.length,
                        anexos: attachments.length
                    });

                    await emailService.sendFileByEmail({
                        to: 'felipe.caceraghi@gofurthergroup.com.br',
                        subject: emailSubject,
                        text: `Segue em anexo as planilhas de Entrada e Honorários do grupo ${grupo}.`,
                        attachments: attachments
                    });

                    results.push({
                        fileNames: fileNames,
                        tipo: 'Múltiplas Planilhas',
                        emailSent: true,
                        subject: emailSubject,
                        attachments: attachments.length
                    });

                    logger.info('✅ Email único com múltiplas planilhas enviado com sucesso');

                } catch (emailError) {
                    logger.error('❌ Erro ao enviar email único:', emailError);

                    results.push({
                        fileNames: fileNames,
                        tipo: 'Múltiplas Planilhas',
                        emailSent: false,
                        error: emailError.message
                    });
                }
            }

            // Salvar na pasta R:\Publico\felipec
            const networkResults = [];
            try {
                const networkPath = 'R:\\Publico\\felipec';
                
                if (!fs.existsSync(networkPath)) {
                    try {
                        fs.mkdirSync(networkPath, { recursive: true });
                    } catch (mkdirError) {
                        logger.warn('⚠️ Não foi possível acessar/criar pasta de rede', { 
                            path: networkPath,
                            error: mkdirError.message 
                        });
                    }
                }

                for (const fileName of fileNames) {
                    try {
                        const filePath = xlsxGeneratorService.getFilePath(fileName);
                        const destPath = path.join(networkPath, fileName);
                        
                        fs.copyFileSync(filePath, destPath);
                        networkResults.push({ fileName, saved: true });
                        
                        logger.info('✅ Arquivo salvo na pasta de rede', { 
                            origem: filePath,
                            destino: destPath 
                        });
                    } catch (copyError) {
                        networkResults.push({ fileName, saved: false, error: copyError.message });
                        logger.error('❌ Erro ao salvar arquivo na rede', { 
                            arquivo: fileName, 
                            error: copyError.message 
                        });
                    }
                }
            } catch (networkError) {
                logger.error('❌ Erro geral na pasta de rede', networkError);
            }

            const emailsSent = results.filter(r => r.emailSent).length;
            const filesNetworkSaved = networkResults.filter(r => r.saved).length;

            return res.json({
                success: true,
                message: `Processamento concluído: ${emailsSent}/${results.length} emails enviados, ${filesNetworkSaved}/${fileNames.length} arquivos salvos em rede`,
                data: {
                    emailResults: results,
                    networkResults: networkResults,
                    grupo: grupo,
                    enviarSeparado: enviarSeparado,
                    processedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('❌ Erro no processo de validação e envio duplo', {
                error: error.message,
                stack: error.stack
            });

            return res.status(500).json({
                success: false,
                error: 'Erro interno do servidor no processo de validação e envio duplo'
            });
        }
    }

    // Validar e enviar planilha por email e salvar na pasta R:
    async validateAndSend(req, res) {
        try {
            const { fileName, grupo, approved } = req.body;
            
            if (!fileName || !grupo || approved === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'fileName, grupo e approved são obrigatórios'
                });
            }

            if (!approved) {
                return res.json({
                    success: true,
                    message: 'Planilha rejeitada pelo usuário',
                    action: 'rejected'
                });
            }

            logger.info('📧 Validação e envio de planilha', { 
                arquivo: fileName,
                grupo: grupo,
                usuario: req.user?.email || 'unknown' 
            });

            // Verificar se arquivo existe
            if (!xlsxGeneratorService.fileExists(fileName)) {
                return res.status(404).json({
                    success: false,
                    error: 'Arquivo não encontrado'
                });
            }

            const filePath = xlsxGeneratorService.getFilePath(fileName);
            const emailService = require('../services/email.service');
            const fs = require('fs');
            const path = require('path');

            // 1. Enviar por email com planilha E imagem
            let emailSent = false;
            try {
                const emailSubject = `Entrada de Cliente - ${grupo} - Operação`;
                
                logger.info('� ENVIANDO EMAIL SIMPLES', { 
                    arquivo: fileName,
                    caminho: filePath,
                    existe: fs.existsSync(filePath)
                });
                
                // CONVERTER EXCEL PARA IMAGEM COM LAYOUT EXATO USANDO PYTHON
                const pythonImageService = require('../services/python-excel-to-image.service');
                const tempImagePath = filePath.replace('.xlsx', '_python_exato.png');
                
                logger.info('� CONVERTENDO COM PYTHON PARA LAYOUT EXATO...', { 
                    arquivo: fileName,
                    caminho: filePath,
                    imagemPath: tempImagePath
                });
                
                // Gerar imagem EXATA do Excel usando Python
                await pythonImageService.convertExcelToImageExact(filePath, tempImagePath);
                
                logger.info('✅ IMAGEM PYTHON GERADA! Enviando por email...', { 
                    imagemPath: tempImagePath,
                    imagemExiste: fs.existsSync(tempImagePath)
                });
                
                // Verificar se a imagem foi criada
                if (!fs.existsSync(tempImagePath)) {
                    throw new Error('Imagem não foi criada pelo Python');
                }
                
                // Enviar email COM A IMAGEM INCORPORADA NO CORPO
                logger.info('🔄 Iniciando envio de email com tabela HTML...', {
                    to: 'felipe.caceraghi@gofurthergroup.com.br',
                    subject: emailSubject,
                    grupo: grupo,
                    excelFilePath: filePath
                });
                
                try {
                    await emailService.sendFileAsNativeHtmlEmail({
                        to: 'felipe.caceraghi@gofurthergroup.com.br',
                        subject: emailSubject,
                        grupo: grupo,
                        excelFilePath: filePath
                    });
                    
                    emailSent = true;
                    logger.info('✅ EMAIL COM HTML NATIVO ENVIADO COM SUCESSO!', { 
                        arquivo: fileName,
                        para: 'felipe.caceraghi@gofurthergroup.com.br'
                    });
                } catch (emailError) {
                    logger.error('❌ ERRO NO ENVIO DO EMAIL COM HTML NATIVO:', {
                        erro: emailError.message,
                        stack: emailError.stack,
                        arquivo: fileName
                    });
                    emailSent = false;
                }
                
                // Limpar arquivo temporário se existir
                if (fs.existsSync(tempImagePath)) {
                    fs.unlinkSync(tempImagePath);
                    logger.info('🗑️ Imagem temporária removida');
                }
                
            } catch (emailError) {
                logger.error('❌ ERRO NO EMAIL', { 
                    arquivo: fileName, 
                    error: emailError.message
                });
                emailSent = false;
            }

            // 2. Salvar na pasta R:\Publico\felipec
            try {
                const networkPath = 'R:\\Publico\\felipec';
                const destPath = path.join(networkPath, fileName);

                // Verificar se a pasta existe
                if (!fs.existsSync(networkPath)) {
                    // Tentar criar a pasta ou acessar
                    try {
                        fs.mkdirSync(networkPath, { recursive: true });
                    } catch (mkdirError) {
                        logger.warn('⚠️ Não foi possível acessar/criar pasta de rede', { 
                            path: networkPath,
                            error: mkdirError.message 
                        });
                        
                        // Continuar mesmo se não conseguir salvar na rede
                        return res.json({
                            success: true,
                            message: 'Email enviado com sucesso, mas não foi possível salvar na pasta de rede',
                            warnings: ['Pasta de rede R:\\Publico\\felipec não acessível']
                        });
                    }
                }

                // Copiar arquivo para a pasta de rede
                fs.copyFileSync(filePath, destPath);
                logger.info('✅ Arquivo salvo na pasta de rede', { 
                    origem: filePath,
                    destino: destPath 
                });

            } catch (networkError) {
                logger.error('❌ Erro ao salvar na pasta de rede', { 
                    arquivo: fileName, 
                    error: networkError.message 
                });
                
                // Email foi enviado, então consideramos parcialmente bem-sucedido
                return res.json({
                    success: true,
                    message: 'Email enviado com sucesso, mas houve erro ao salvar na pasta de rede',
                    warnings: [`Erro ao salvar em R:\\Publico\\felipec: ${networkError.message}`]
                });
            }

            return res.json({
                success: true,
                message: 'Planilha validada e processada com sucesso!',
                data: {
                    emailSent: emailSent,
                    networkSaved: true,
                    fileName: fileName,
                    grupo: grupo,
                    processedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('❌ Erro no processo de validação e envio', {
                error: error.message,
                stack: error.stack
            });

            return res.status(500).json({
                success: false,
                error: 'Erro interno do servidor no processo de validação e envio'
            });
        }
    }

    // Testar conversão para imagem e salvar arquivo
    async testImageFile(req, res) {
        try {
            const { fileName = 'AAMA_Ficha_Entrada_2025-08-22T13-39-07-332Z.xlsx' } = req.body;
            
            logger.info('📸 Teste de conversão para arquivo de imagem', { 
                arquivo: fileName,
                usuario: req.user?.email || 'unknown' 
            });

            // Verificar se arquivo existe
            if (!xlsxGeneratorService.fileExists(fileName)) {
                return res.status(404).json({
                    success: false,
                    error: 'Arquivo não encontrado'
                });
            }

            const filePath = xlsxGeneratorService.getFilePath(fileName);
            const excelToImageService = require('../services/excel-to-image.service');
            
            // Caminho para salvar a imagem de teste
            const outputImagePath = filePath.replace('.xlsx', '_test.png');

            // Converter Excel para imagem
            const result = await excelToImageService.convertExcelToImage(filePath, outputImagePath);

            logger.info('✅ Imagem de teste gerada', { 
                entrada: filePath,
                saida: outputImagePath,
                tamanho: result.imageSize
            });

            return res.json({
                success: true,
                message: 'Imagem de teste gerada com sucesso!',
                data: {
                    inputFile: fileName,
                    outputImage: outputImagePath,
                    imageSize: result.imageSize,
                    testedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('❌ Erro no teste de imagem', {
                error: error.message,
                stack: error.stack
            });

            return res.status(500).json({
                success: false,
                error: 'Erro ao gerar imagem de teste',
                details: error.message
            });
        }
    }

    // Testar envio de email
    async testEmail(req, res) {
        try {
            const { to = 'felipe.caceraghi@gofurthergroup.com.br' } = req.body;
            
            logger.info('📧 Teste de envio de email', { 
                para: to,
                usuario: req.user?.email || 'unknown' 
            });

            const emailService = require('../services/email.service');

            // Tentar enviar email de teste
            await emailService.sendFileByEmail({
                to: to,
                subject: `Teste de Email - ${new Date().toLocaleString('pt-BR')}`,
                text: `Este é um email de teste enviado em ${new Date().toLocaleString('pt-BR')}.\n\nSistema: FluxoClienteCS\nUsuário: ${req.user?.email || 'unknown'}`,
                attachments: [] // Sem anexos para teste
            });

            logger.info('✅ Email de teste enviado com sucesso', { para: to });

            return res.json({
                success: true,
                message: 'Email de teste enviado com sucesso!',
                data: {
                    emailSent: true,
                    to: to,
                    sentAt: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('❌ Erro no teste de email', {
                error: error.message,
                stack: error.stack
            });

            return res.status(500).json({
                success: false,
                error: 'Erro ao enviar email de teste',
                details: error.message
            });
        }
    }

    // TESTE: Apenas converter planilha para imagem e salvar
    async testLayoutFidelity(req, res) {
        try {
            const { fileName } = req.body;
            
            if (!fileName) {
                return res.status(400).json({
                    success: false,
                    error: 'fileName é obrigatório'
                });
            }

            const filePath = xlsxGeneratorService.getFilePath(fileName);
            
            if (!xlsxGeneratorService.fileExists(fileName)) {
                return res.status(404).json({
                    success: false,
                    error: 'Arquivo não encontrado'
                });
            }

            logger.info('🧪 TESTE DE FIDELIDADE DE LAYOUT', { arquivo: fileName });
            
            const excelToImageService = require('../services/excel-to-image.service');
            const testImagePath = filePath.replace('.xlsx', '_teste_layout.png');
            
            // Converter para imagem
            await excelToImageService.convertExcelToImage(filePath, testImagePath);
            
            const fs = require('fs');
            const imageExists = fs.existsSync(testImagePath);
            const imageSize = imageExists ? fs.statSync(testImagePath).size : 0;
            
            logger.info('✅ TESTE CONCLUÍDO', { 
                imagem: testImagePath,
                existe: imageExists,
                tamanho: imageSize
            });
            
            return res.json({
                success: true,
                message: 'Conversão de teste realizada com sucesso',
                data: {
                    originalFile: fileName,
                    imagePath: testImagePath,
                    imageExists: imageExists,
                    imageSize: imageSize,
                    testTime: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('❌ Erro no teste de layout', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Testar APENAS conversão Python
    async testPythonOnly(req, res) {
        try {
            const { fileName } = req.body;
            
            if (!fileName) {
                return res.status(400).json({
                    success: false,
                    error: 'fileName é obrigatório'
                });
            }

            const filePath = xlsxGeneratorService.getFilePath(fileName);
            
            if (!xlsxGeneratorService.fileExists(fileName)) {
                return res.status(404).json({
                    success: false,
                    error: 'Arquivo não encontrado'
                });
            }

            logger.info('🧪 TESTE PYTHON ISOLADO', { arquivo: fileName });
            
            const pythonImageService = require('../services/python-excel-to-image.service');
            const testImagePath = filePath.replace('.xlsx', '_teste_python_isolado.png');
            
            // Converter para imagem usando Python
            const result = await pythonImageService.convertExcelToImageExact(filePath, testImagePath);
            
            const fs = require('fs');
            const imageExists = fs.existsSync(testImagePath);
            const imageSize = imageExists ? fs.statSync(testImagePath).size : 0;
            
            logger.info('✅ TESTE PYTHON CONCLUÍDO', { 
                imagem: testImagePath,
                existe: imageExists,
                tamanho: imageSize,
                resultado: result
            });
            
            return res.json({
                success: true,
                message: 'Teste Python realizado',
                data: {
                    originalFile: fileName,
                    imagePath: testImagePath,
                    imageExists: imageExists,
                    imageSize: imageSize,
                    pythonResult: result,
                    testTime: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('❌ Erro no teste Python', {
                error: error.message,
                stack: error.stack
            });
            
            return res.status(500).json({
                success: false,
                error: error.message,
                details: error.stack
            });
        }
    }

    // Testar conversão de imagem
    async testImageConversion(req, res) {
        try {
            const { fileName = 'AAMA_Ficha_Entrada_2025-08-22T13-39-07-332Z.xlsx' } = req.body;
            
            logger.info('🖼️ Teste de conversão de imagem', { 
                arquivo: fileName,
                usuario: req.user?.email || 'unknown' 
            });

            // Verificar se arquivo existe
            if (!xlsxGeneratorService.fileExists(fileName)) {
                return res.status(404).json({
                    success: false,
                    error: 'Arquivo não encontrado'
                });
            }

            const filePath = xlsxGeneratorService.getFilePath(fileName);
            const excelToImageService = require('../services/excel-to-image.service');

            // Tentar converter para base64
            const result = await excelToImageService.convertAndGetBase64(filePath);

            logger.info('✅ Teste de conversão concluído', { 
                sucesso: result.success,
                tamanhoBase64: result.base64?.length || 0
            });

            return res.json({
                success: result.success,
                message: 'Conversão de imagem testada com sucesso!',
                data: {
                    hasImage: !!result.base64,
                    imageSize: result.base64?.length || 0,
                    mimeType: result.mimeType,
                    testedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('❌ Erro no teste de conversão de imagem', {
                error: error.message,
                stack: error.stack
            });

            return res.status(500).json({
                success: false,
                error: 'Erro ao testar conversão de imagem',
                details: error.message
            });
        }
    }

    // Estatísticas de relatórios
    async getStats(req, res) {
        try {
            const fs = require('fs');
            const path = require('path');
            
            const reportsDir = path.join(__dirname, '../storage/generated-reports');
            
            if (!fs.existsSync(reportsDir)) {
                return res.json({
                    success: true,
                    totalReports: 0,
                    lastSync: null
                });
            }

            const files = fs.readdirSync(reportsDir).filter(file => file.endsWith('.xlsx'));
            
            let lastSync = null;
            if (files.length > 0) {
                // Pegar a data do arquivo mais recente
                const fileTimes = files.map(file => {
                    const filePath = path.join(reportsDir, file);
                    return fs.statSync(filePath).mtime;
                });
                lastSync = new Date(Math.max(...fileTimes)).toISOString();
            }

            return res.json({
                success: true,
                totalReports: files.length,
                lastSync: lastSync
            });

        } catch (error) {
            logger.error('❌ Erro ao buscar estatísticas de relatórios', {
                error: error.message
            });

            return res.status(500).json({
                success: false,
                error: 'Erro ao buscar estatísticas',
                details: error.message
            });
        }
    }
}

module.exports = new XlsxGeneratorController();
