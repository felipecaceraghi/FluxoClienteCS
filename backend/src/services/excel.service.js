const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class ExcelReaderService {
    constructor() {
        this.downloadPath = path.join(__dirname, '../storage/sharepoint-files');
    }

    getLatestFile() {
        try {
            if (!fs.existsSync(this.downloadPath)) {
                throw new Error('Diretório de arquivos não encontrado');
            }

            const files = fs.readdirSync(this.downloadPath)
                .filter(file => file.endsWith('.xlsm') || file.endsWith('.xlsx'))
                .map(file => ({
                    name: file,
                    path: path.join(this.downloadPath, file),
                    stats: fs.statSync(path.join(this.downloadPath, file))
                }))
                .sort((a, b) => b.stats.mtime - a.stats.mtime);

            if (files.length === 0) {
                throw new Error('Nenhum arquivo Excel encontrado');
            }

            return files[0];
        } catch (error) {
            logger.error('❌ Erro ao buscar arquivo mais recente', error);
            throw error;
        }
    }

    readExcelFile(filePath) {
        try {
            logger.info('📖 Lendo arquivo Excel...', { filePath });

            // Ler arquivo Excel
            const workbook = XLSX.readFile(filePath);
            
            // Verificar se aba "Clientes" existe
            if (!workbook.SheetNames.includes('Clientes')) {
                throw new Error('Aba "Clientes" não encontrada no arquivo');
            }

            const worksheet = workbook.Sheets['Clientes'];
            
            // Converter para array de arrays (incluindo células vazias)
            const rawData = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1,
                defval: '', // Valor padrão para células vazias
                raw: false  // Converter valores para string
            });

            logger.info('✅ Arquivo Excel lido com sucesso', {
                totalRows: rawData.length,
                sheetNames: workbook.SheetNames
            });

            return rawData;
        } catch (error) {
            logger.error('❌ Erro ao ler arquivo Excel', error);
            throw error;
        }
    }

    // Método principal usado pelo sync.service.js
    async parseCompaniesData(filePath) {
        try {
            logger.info('📖 Analisando dados da planilha...');

            // Ler arquivo Excel
            const rawData = this.readExcelFile(filePath);

            // Parsear dados das empresas usando o método correto
            const companies = this.parseCompaniesDataFromRaw(rawData);

            return companies;
        } catch (error) {
            logger.error('❌ Erro ao processar arquivo:', error);
            throw error;
        }
    }

    parseCompaniesDataFromRaw(rawData) {
        try {
            logger.info('🔍 Analisando dados da planilha...');

            // Header começa na linha 5 (índice 4)
            const headerRowIndex = 4;
            
            if (rawData.length <= headerRowIndex) {
                throw new Error('Planilha não possui dados suficientes');
            }

            // Extrair dados a partir da linha 6 (índice 5)
            const companies = [];
            
            for (let i = headerRowIndex + 1; i < rawData.length; i++) {
                const row = rawData[i];
                
                // Mapear conforme suas especificações:
                // codigo = coluna A (índice 0)
                // nome = coluna B (índice 1)  
                // grupo = coluna C (índice 2)
                const codigo = row[0] ? String(row[0]).trim() : '';
                const nome = row[1] ? String(row[1]).trim() : '';
                const grupo = row[2] ? String(row[2]).trim() : '';

                // Só adicionar se tiver pelo menos código
                if (codigo) {
                    companies.push({
                        rowNumber: i + 1, // +1 porque Excel começa em 1
                        codigo,
                        nome,
                        grupo
                    });
                }
            }

            logger.info('✅ Dados parseados com sucesso', {
                totalCompanies: companies.length,
                headerRow: headerRowIndex + 1,
                dataStartRow: headerRowIndex + 2
            });

            return companies;
        } catch (error) {
            logger.error('❌ Erro ao parsear dados', error);
            throw error;
        }
    }

    // Método para extrair dados completos da planilha
    async parseFullCompanyData(filePath) {
        try {
            logger.info('📖 Analisando dados completos da planilha...');

            // Ler arquivo Excel
            const rawData = this.readExcelFile(filePath);

            // Parsear dados completos usando o método dedicado
            const companies = this.parseFullCompanyDataFromRaw(rawData);

            return companies;
        } catch (error) {
            logger.error('❌ Erro ao processar dados completos:', error);
            throw error;
        }
    }

    parseFullCompanyDataFromRaw(rawData) {
        try {
            logger.info('🔍 Analisando dados completos da planilha...');

            // Header começa na linha 5 (índice 4)
            const headerRowIndex = 4;
            
            if (rawData.length <= headerRowIndex) {
                throw new Error('Planilha não possui dados suficientes');
            }

            // Extrair dados a partir da linha 6 (índice 5)
            const companies = [];
            
            for (let i = headerRowIndex + 1; i < rawData.length; i++) {
                const row = rawData[i];
                
                // Mapear todos os campos conforme especificação
                const codigo = row[0] ? String(row[0]).trim() : '';
                
                // Só processar se tiver código
                if (!codigo) continue;

                const companyData = {
                    rowNumber: i + 1,
                    codigo: this.preserveOriginalValue(row[0]),
                    nome_fantasia: this.preserveOriginalValue(row[1]),
                    grupo: this.preserveOriginalValue(row[2]),
                    razao_social: this.preserveOriginalValue(row[3]),
                    inicio_contrato: this.parseDate(row[4]),
                    termino_contrato: this.parseDate(row[5]),
                    situacao: this.preserveOriginalValue(row[6]),
                    cnpj: this.preserveOriginalValue(row[7]),
                    ie: this.preserveOriginalValue(row[8]),
                    link_do_site: this.preserveOriginalValue(row[9]),
                    endereco: this.preserveOriginalValue(row[10]),
                    municipio_uf: this.preserveOriginalValue(row[11]),
                    estado: this.preserveOriginalValue(row[12]),
                    uf: this.preserveOriginalValue(row[13]),
                    observacoes_cadastro: this.preserveOriginalValue(row[14]),
                    setor: this.preserveOriginalValue(row[15]),
                    segmento: this.preserveOriginalValue(row[16]),
                    atividade_especialidade: this.preserveOriginalValue(row[17]),
                    faturamento_anual: this.preserveOriginalValue(row[18]),
                    porte: this.preserveOriginalValue(row[19]),
                    regime_tributario_proposta: this.preserveOriginalValue(row[20]),
                    regime_tributario_atual: this.preserveOriginalValue(row[21]),
                    deadline_dia: this.preserveOriginalValue(row[22]),
                    deadline_periodicidade: this.preserveOriginalValue(row[23]),
                    deadline_util_corrente: this.preserveOriginalValue(row[24]),
                    centro_custo_possui: this.preserveOriginalValue(row[25]),
                    centro_custo_quantidade: this.preserveOriginalValue(row[26]),
                    departamentalizacao_possui: this.preserveOriginalValue(row[27]),
                    departamentalizacao_quantidade: this.preserveOriginalValue(row[28]),
                    scp_quantidade: this.preserveOriginalValue(row[29]),
                    importacao_processos_ano: this.preserveOriginalValue(row[30]),
                    exportacao_processos_ano: this.preserveOriginalValue(row[31]),
                    nf_entradas: this.preserveOriginalValue(row[32]),
                    nf_saidas: this.preserveOriginalValue(row[33]),
                    ctes_entrada: this.preserveOriginalValue(row[34]),
                    ctes_saida: this.preserveOriginalValue(row[35]),
                    cupom_fiscal: this.preserveOriginalValue(row[36]),
                    nf_servicos_prestados: this.preserveOriginalValue(row[37]),
                    servicos_tomados: this.preserveOriginalValue(row[38]),
                    nf_pjs: this.preserveOriginalValue(row[39]),
                    pro_labore: this.preserveOriginalValue(row[40]),
                    estagiarios: this.preserveOriginalValue(row[41]),
                    aprendizes: this.preserveOriginalValue(row[42]),
                    rpa: this.preserveOriginalValue(row[43]),
                    domesticas_clt: this.preserveOriginalValue(row[44]),
                    colab_clt: this.preserveOriginalValue(row[45]),
                    total_colaboradores: this.preserveOriginalValue(row[46]),
                    data_adiantamento: this.parseDate(row[47]),
                    data_pagamento: this.parseDate(row[48]),
                    sistema_contabil: this.preserveOriginalValue(row[49]),
                    sistema_fiscal: this.preserveOriginalValue(row[50]),
                    sistema_folha: this.preserveOriginalValue(row[51]),
                    sistema_financeiro: this.preserveOriginalValue(row[52]),
                    sistema_rh: this.preserveOriginalValue(row[53]),
                    sistema_outros: this.preserveOriginalValue(row[54]),
                    empresa_aberta_go: this.preserveOriginalValue(row[55]),
                    contato_principal_nome: this.preserveOriginalValue(row[57]),
                    contato_principal_cargo: this.preserveOriginalValue(row[58]),
                    contato_principal_email: this.preserveOriginalValue(row[59]),
                    contato_principal_celular: this.preserveOriginalValue(row[60]),
                    plano_contratado: this.preserveOriginalValue(row[61]),
                    sla: this.preserveOriginalValue(row[62]),
                    bpo_contabil: this.preserveOriginalValue(row[63]),
                    bpo_fiscal: this.preserveOriginalValue(row[64]),
                    bpo_folha: this.preserveOriginalValue(row[65]),
                    bpo_financeiro: this.preserveOriginalValue(row[66]),
                    bpo_rh: this.preserveOriginalValue(row[67]),
                    bpo_cnd: this.preserveOriginalValue(row[68]),
                    vl_bpo_contabil: this.preserveOriginalValue(row[69]),
                    vl_bpo_fiscal: this.preserveOriginalValue(row[70]),
                    vl_bpo_folha: this.preserveOriginalValue(row[71]),
                    vl_bpo_financeiro: this.preserveOriginalValue(row[72]),
                    vl_bpo_rh: this.preserveOriginalValue(row[73]),
                    vl_bpo_legal: this.preserveOriginalValue(row[74]),
                    honorario_mensal_total: this.preserveOriginalValue(row[75]),
                    competencia_inicial_fixo: this.parseDate(row[76]),
                    diversos_inicial: this.preserveOriginalValue(row[77]),
                    competencia_diversos_inicial: this.parseDate(row[78]),
                    vl_diversos_inicial: this.preserveOriginalValue(row[79]),
                    implantacao: this.preserveOriginalValue(row[80]),
                    vencimento_implantacao: this.preserveOriginalValue(row[81]),
                    forma_pgto: this.preserveOriginalValue(row[82]),
                    vl_implantacao: this.preserveOriginalValue(row[83]),
                    bpo_contabil_faturado: this.preserveOriginalValue(row[84]),
                    bpo_fiscal_faturado: this.preserveOriginalValue(row[85]),
                    bpo_folha_faturado: this.preserveOriginalValue(row[86]),
                    bpo_financeiro_faturado: this.preserveOriginalValue(row[87]),
                    bpo_rh_faturado: this.preserveOriginalValue(row[89]),
                    bpo_legal_faturado: this.preserveOriginalValue(row[89]),
                    diversos_in_faturado: this.preserveOriginalValue(row[90]),
                    implantacao_faturado: this.preserveOriginalValue(row[91]),
                    closer: this.preserveOriginalValue(row[92]),
                    prospector: this.preserveOriginalValue(row[93]),
                    origem_lead: this.preserveOriginalValue(row[94]),
                    observacao_closer: this.preserveOriginalValue(row[95]),
                    motivo_troca: this.preserveOriginalValue(row[96])
                };

                companies.push(companyData);
            }

            logger.info('✅ Dados completos parseados com sucesso', {
                totalCompanies: companies.length,
                headerRow: headerRowIndex + 1,
                dataStartRow: headerRowIndex + 2
            });

            return companies;
        } catch (error) {
            logger.error('❌ Erro ao parsear dados completos', error);
            throw error;
        }
    }

    // Métodos auxiliares para conversão de dados
    preserveOriginalValue(value) {
        if (value === null || value === undefined) {
            return null;
        }
        
        // Se é uma string vazia, retornar string vazia
        if (value === '') {
            return '';
        }
        
        // Para qualquer outro valor, converter para string preservando o formato original
        try {
            const stringValue = String(value);
            // Remover apenas espaços no início e fim, preservando formatação interna
            return stringValue.trim();
        } catch (error) {
            return String(value);
        }
    }

    parseDate(value) {
        if (!value) return null;
        
        try {
            // Se já é uma data válida
            if (value instanceof Date) {
                return value.toISOString().split('T')[0];
            }
            
            // Se é string, tentar converter
            const str = String(value).trim();
            if (!str) return null;
            
            // Verificar se é um número serial do Excel
            if (!isNaN(str) && !str.includes('/') && !str.includes('-')) {
                const excelDate = new Date((parseFloat(str) - 25569) * 86400 * 1000);
                if (!isNaN(excelDate.getTime())) {
                    return excelDate.toISOString().split('T')[0];
                }
            }
            
            // Tentar converter diretamente
            const date = new Date(str);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
            
            // Se não conseguir converter, retornar o valor original
            return str;
        } catch (error) {
            // Em caso de erro, retornar o valor original como string
            return String(value).trim() || null;
        }
    }

    parseNumber(value) {
        if (!value) return null;
        
        try {
            // Se é uma string, retornar como está (preservando formato original)
            if (typeof value === 'string') {
                const trimmed = value.trim();
                return trimmed || null;
            }
            
            // Se é um número, converter para string mantendo formato
            if (typeof value === 'number') {
                return value.toString();
            }
            
            // Para outros tipos, converter para string
            return String(value).trim() || null;
        } catch (error) {
            return String(value) || null;
        }
    }

    parseInteger(value) {
        if (!value) return null;
        
        try {
            // Se é uma string, retornar como está (preservando formato original)
            if (typeof value === 'string') {
                const trimmed = value.trim();
                return trimmed || null;
            }
            
            // Se é um número, converter para string mantendo formato
            if (typeof value === 'number') {
                return value.toString();
            }
            
            // Para outros tipos, converter para string
            return String(value).trim() || null;
        } catch (error) {
            return String(value) || null;
        }
    }

    debugSampleData(companies, sampleSize = 5) {
        logger.info('🔍 DEBUG - Amostra de dados:', {
            totalCompanies: companies.length,
            sampleSize: Math.min(sampleSize, companies.length)
        });

        const sample = companies.slice(0, sampleSize);

        console.log('\n=== AMOSTRA DE 5 EMPRESAS ===');
        console.log('Mapeamento: codigo=Coluna A | nome=Coluna B | grupo=Coluna C');
        console.log('Header na linha 5, dados a partir da linha 6\n');

        sample.forEach((company, index) => {
            console.log(`${index + 1}. Linha ${company.rowNumber}:`);
            console.log(`   📝 Código: "${company.codigo}"`);
            console.log(`   🏢 Nome: "${company.nome}"`);
            console.log(`   👥 Grupo: "${company.grupo}"`);
            console.log('');
        });

        console.log('=== FIM DA AMOSTRA ===\n');

        // Verificar dados vazios
        const withoutCode = companies.filter(c => !c.codigo).length;
        const withoutName = companies.filter(c => !c.nome).length;
        const withoutGroup = companies.filter(c => !c.grupo).length;

        logger.info('📊 Estatísticas dos dados:', {
            totalEmpresas: companies.length,
            semCodigo: withoutCode,
            semNome: withoutName,
            semGrupo: withoutGroup
        });

        return sample;
    }

    async processLatestFile() {
        try {
            // 1. Buscar arquivo mais recente
            const latestFile = this.getLatestFile();
            logger.info('📁 Arquivo mais recente encontrado', {
                fileName: latestFile.name,
                modifiedAt: latestFile.stats.mtime
            });

            // 2. Ler arquivo Excel
            const rawData = this.readExcelFile(latestFile.path);

            // 3. Parsear dados das empresas
            const companies = this.parseCompaniesDataFromRaw(rawData);

            // 4. Debug com amostra
            const sample = this.debugSampleData(companies, 5);

            return {
                success: true,
                fileName: latestFile.name,
                totalCompanies: companies.length,
                sample,
                companies // Todos os dados para uso posterior
            };

        } catch (error) {
            logger.error('❌ Erro no processamento do arquivo', error);
            throw error;
        }
    }
}

module.exports = new ExcelReaderService();
