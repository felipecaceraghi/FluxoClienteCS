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
