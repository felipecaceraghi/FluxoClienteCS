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

            return res.json({
                success: true,
                message: 'Planilha gerada com sucesso',
                data: {
                    fileName: generationResult.fileName,
                    downloadUrl: `/api/xlsx-generator/download/${generationResult.fileName}`,
                    grupo: grupo,
                    empresas: generationResult.stats.empresas,
                    tamanhoArquivo: generationResult.stats.tamanhoArquivo,
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
}

module.exports = new XlsxGeneratorController();
