const companyService = require('../services/company.service');

class CompanyController {
    async search(req, res, next) {
        try {
            const { q: query, page, limit } = req.query;

            const result = await companyService.searchCompanies(
                query, 
                parseInt(page) || 1, 
                parseInt(limit) || 10
            );

            res.json({
                success: true,
                message: `${result.data.length} empresa(s) encontrada(s)`,
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            if (error.message === 'Termo de busca é obrigatório') {
                return res.status(400).json({
                    success: false,
                    error: 'Termo de busca é obrigatório',
                    code: 'QUERY_REQUIRED'
                });
            }

            next(error);
        }
    }

    async getByCode(req, res, next) {
        try {
            const { codigo } = req.params;

            const result = await companyService.getCompanyByCode(codigo);

            res.json({
                success: true,
                message: 'Empresa encontrada',
                data: result.data
            });
        } catch (error) {
            if (error.message === 'Empresa não encontrada') {
                return res.status(404).json({
                    success: false,
                    error: 'Empresa não encontrada',
                    code: 'COMPANY_NOT_FOUND'
                });
            }

            next(error);
        }
    }

    async getAll(req, res, next) {
        try {
            const result = await companyService.getAllCompanies();

            res.json({
                success: true,
                message: `${result.total} empresa(s) encontrada(s)`,
                data: result.data,
                total: result.total
            });
        } catch (error) {
            next(error);
        }
    }

    async getStats(req, res, next) {
        try {
            const result = await companyService.getCompaniesStats();

            res.json({
                success: true,
                message: 'Estatísticas das empresas',
                data: result.data
            });
        } catch (error) {
            next(error);
        }
    }

    async create(req, res, next) {
        try {
            const companyData = req.body;

            const result = await companyService.createCompany(companyData);

            res.status(201).json({
                success: true,
                message: 'Empresa criada com sucesso',
                data: result.data
            });
        } catch (error) {
            if (error.message.includes('já existe')) {
                return res.status(409).json({
                    success: false,
                    error: error.message,
                    code: 'COMPANY_ALREADY_EXISTS'
                });
            }

            if (error.message.includes('obrigatórios')) {
                return res.status(400).json({
                    success: false,
                    error: error.message,
                    code: 'MISSING_REQUIRED_FIELDS'
                });
            }

            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const { codigo } = req.params;
            const companyData = req.body;

            const result = await companyService.updateCompany(codigo, companyData);

            res.json({
                success: true,
                message: 'Empresa atualizada com sucesso',
                data: result.data
            });
        } catch (error) {
            if (error.message === 'Empresa não encontrada') {
                return res.status(404).json({
                    success: false,
                    error: 'Empresa não encontrada',
                    code: 'COMPANY_NOT_FOUND'
                });
            }

            next(error);
        }
    }

    async validateForReport(req, res, next) {
        try {
            const { codigo } = req.params;

            const result = await companyService.validateCompanyForReport(codigo);

            res.json({
                success: true,
                message: 'Empresa válida para geração de relatório',
                data: {
                    company: result.data,
                    canGenerateReport: result.canGenerateReport
                }
            });
        } catch (error) {
            if (error.message === 'Empresa não encontrada') {
                return res.status(404).json({
                    success: false,
                    error: 'Empresa não encontrada',
                    code: 'COMPANY_NOT_FOUND'
                });
            }

            if (error.message.includes('SharePoint')) {
                return res.status(400).json({
                    success: false,
                    error: error.message,
                    code: 'INSUFFICIENT_DATA'
                });
            }

            next(error);
        }
    }
}

module.exports = new CompanyController();
