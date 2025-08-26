const xlsxSaidaGeneratorService = require('../services/xlsx-saida-generator.service');

class XlsxSaidaGeneratorController {
    async generateGrupoReport(req, res) {
        try {
            const { grupo } = req.body;
            
            if (!grupo || !grupo.trim()) {
                return res.status(400).json({
                    success: false,
                    error: 'Parâmetro "grupo" é obrigatório'
                });
            }

            const result = await xlsxSaidaGeneratorService.generateSaidaGrupoReport(grupo);
            
            res.json({
                success: true,
                message: 'Relatório de saída por grupo gerado com sucesso',
                data: result
            });

        } catch (error) {
            console.error('Erro ao gerar relatório por grupo:', error);
            
            if (error.message.includes('não encontrado')) {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            
            return res.status(500).json({
                success: false,
                error: 'Erro interno ao gerar relatório'
            });
        }
    }

    async generateClienteReport(req, res) {
        try {
            const { cliente } = req.body;
            
            if (!cliente || !cliente.trim()) {
                return res.status(400).json({
                    success: false,
                    error: 'Parâmetro "cliente" é obrigatório'
                });
            }

            const result = await xlsxSaidaGeneratorService.generateSaidaClienteReport(cliente);
            
            res.json({
                success: true,
                message: 'Relatório de saída por cliente gerado com sucesso',
                data: result
            });

        } catch (error) {
            console.error('Erro ao gerar relatório por cliente:', error);
            
            if (error.message.includes('não encontrado')) {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            
            return res.status(500).json({
                success: false,
                error: 'Erro interno ao gerar relatório'
            });
        }
    }
}

module.exports = new XlsxSaidaGeneratorController();
