const groupSearchService = require('../services/group-search.service');

class GroupSearchController {
    async searchByGroup(req, res) {
        try {
            const { grupo } = req.params;
            
            // Validação
            if (!grupo || !grupo.trim()) {
                return res.status(400).json({
                    success: false,
                    error: 'Parâmetro "grupo" é obrigatório',
                    message: 'Informe o nome do grupo para buscar'
                });
            }

            // Verificar se há busca em andamento
            if (groupSearchService.isCurrentlySearching()) {
                return res.status(429).json({
                    success: false,
                    error: 'Busca em andamento',
                    message: 'Aguarde a conclusão da busca atual antes de iniciar uma nova'
                });
            }

            // Executar busca
            const result = await groupSearchService.searchByGroup(grupo);
            
            if (result.success) {
                return res.json(result);
            } else {
                return res.status(500).json(result);
            }

        } catch (error) {
            console.error('Erro no controller de busca por grupo:', error);
            
            return res.status(500).json({
                success: false,
                error: 'Erro interno do servidor',
                message: 'Erro ao processar busca por grupo'
            });
        }
    }

    async getAvailableGroups(req, res) {
        try {
            // Executar busca de grupos
            const result = await groupSearchService.getAvailableGroups();
            
            if (result.success) {
                return res.json(result);
            } else {
                return res.status(500).json(result);
            }

        } catch (error) {
            console.error('Erro ao obter grupos disponíveis:', error);
            
            return res.status(500).json({
                success: false,
                error: 'Erro interno do servidor',
                message: 'Erro ao obter grupos disponíveis'
            });
        }
    }

    async getSearchStatus(req, res) {
        try {
            const isSearching = groupSearchService.isCurrentlySearching();
            
            return res.json({
                success: true,
                busca_em_andamento: isSearching,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro ao verificar status da busca:', error);
            
            return res.status(500).json({
                success: false,
                error: 'Erro interno do servidor'
            });
        }
    }
}

module.exports = new GroupSearchController();
