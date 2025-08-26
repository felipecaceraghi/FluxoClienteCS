const searchService = require('../services/planilha-search.service');

class PlanilhaSearchController {
    async pesquisaGrupoSaida(req, res) {
        try {
            const { q } = req.query;
            if (!q) return res.status(400).json({ success: false, error: 'Parâmetro q é obrigatório' });

            // aggregate across sheets
            const result = await searchService.pesquisaGrupoAll(q);
            if (!result || result.success === false) {
                return res.status(404).json({ success: false, error: result.error || 'Grupo não encontrado', missing: result.missing || [] });
            }

            return res.json(result);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: 'Erro interno' });
        }
    }

    async pesquisaClienteSaida(req, res) {
        try {
            const { q } = req.query;
            if (!q) return res.status(400).json({ success: false, error: 'Parâmetro q é obrigatório' });

            // aggregate across sheets
            const result = await searchService.pesquisaClienteAll(q);
            if (!result || result.success === false) {
                return res.status(404).json({ success: false, error: result.error || 'Empresa não encontrada', missing: result.missing || [] });
            }

            return res.json(result);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: 'Erro interno' });
        }
    }

    // Additional endpoints for cadastro and produtos
    async pesquisaGrupoCadastro(req, res) {
        try {
            const { q } = req.query;
            if (!q) return res.status(400).json({ success: false, error: 'Parâmetro q é obrigatório' });

            const result = await searchService.pesquisaGrupoCadastro(q);
            return res.json(result);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: 'Erro interno' });
        }
    }

    async pesquisaClienteCadastro(req, res) {
        try {
            const { q } = req.query;
            if (!q) return res.status(400).json({ success: false, error: 'Parâmetro q é obrigatório' });

            const result = await searchService.pesquisaClienteCadastro(q);
            return res.json(result);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: 'Erro interno' });
        }
    }

    async pesquisaGrupoProdutos(req, res) {
        try {
            const { q } = req.query;
            if (!q) return res.status(400).json({ success: false, error: 'Parâmetro q é obrigatório' });

            const result = await searchService.pesquisaGrupoProdutos(q);
            return res.json(result);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: 'Erro interno' });
        }
    }

    async pesquisaClienteProdutos(req, res) {
        try {
            const { q } = req.query;
            if (!q) return res.status(400).json({ success: false, error: 'Parâmetro q é obrigatório' });

            const result = await searchService.pesquisaClienteProdutos(q);
            return res.json(result);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: 'Erro interno' });
        }
    }
}

module.exports = new PlanilhaSearchController();
