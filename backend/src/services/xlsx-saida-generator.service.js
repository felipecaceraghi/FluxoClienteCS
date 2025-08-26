const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { parse, differenceInMonths, isValid, format } = require('date-fns');
const { ptBR } = require('date-fns/locale');
const searchService = require('./planilha-search.service');
const logger = require('../utils/logger');

const STORAGE_DIR = path.join(__dirname, '../storage/generated-reports');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

function formatCNPJ(cnpj) {
    if (!cnpj) return '';
    const digits = String(cnpj).replace(/\D/g, '');
    if (digits.length >= 14) {
        const root = digits.substring(0, 14);
        return `${root.slice(0,2)}.${root.slice(2,5)}.${root.slice(5,8)}/${root.slice(8,12)}-${root.slice(12)}`;
    }
    return cnpj;
}

function parseDate(dateString) {
    if (!dateString || typeof dateString !== 'string') return null;
    let date = parse(dateString, 'MMM-yy', new Date(), { locale: ptBR });
    if (isValid(date)) return date;
    date = parse(dateString, 'dd/MM/yy', new Date());
    if (isValid(date)) return date;
    return null;
}

function formatDateToPt(date) {
    if (!isValid(date)) return 'N/A';
    return format(date, 'MMM/yy', { locale: ptBR });
}

function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

function parseCurrency(currencyStr) {
    if (currencyStr === undefined || currencyStr === null) return 0;
    if (typeof currencyStr === 'number') return currencyStr;
    const numberStr = String(currencyStr).replace(/R\$\s?/, '').replace(/\./g, '').replace(/,/g, '.').trim();
    const value = parseFloat(numberStr);
    return isNaN(value) ? 0 : value;
}

function extractCompanyData(rowData) {
    // Extract fields with safe fallbacks
    const codigo = rowData.codigo || rowData.extra?.['Código'] || rowData.extra?.['Código Domínio'] || rowData.extra?.codigo || '';
    const apelido = rowData.nome || rowData.extra?.['Empresa'] || rowData.extra?.['nome'] || rowData.extra?.['nome_fantasia'] || '';
    const razaoSocial = rowData.razao_social || rowData.extra?.['razao_social'] || apelido || '';
    const cnpj = rowData.cnpj || rowData.extra?.['CNPJ'] || rowData.extra?.cnpj || '';
    const grupo = rowData.grupo || rowData.extra?.['Grupo'] || rowData.extra?.grupo || '';

    return {
        codigo,
        nome_fantasia: apelido,
        nome: apelido,
        apelido,
        razaoSocial,
        cnpj: formatCNPJ(cnpj),
        grupo
    };
}

async function buildWorkbook(data, options = { includeHonorarios: false }) {
    const { saida, produtos, empresas, codigosNaListaDeSaida } = data;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatorio Saida Cliente');
    worksheet.views = [{ showGridLines: false }];

    worksheet.getColumn('A').width = 2;
    worksheet.getColumn('B').width = 2;

    const fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8BDA1' } };
    const leftAlign = { alignment: { horizontal: 'left' } };
    const titleStyle = { font: { bold: true, size: 24 }, ...leftAlign };
    const boldStyle = { font: { bold: true, size: 11 }, ...leftAlign };
    const sectionHeaderStyle = { font: boldStyle.font, fill: fill, ...leftAlign };
    const currencyStyle = { numFmt: 'R$ #,##0.00', ...leftAlign };
    const totalStyle = { font: boldStyle.font, numFmt: currencyStyle.numFmt, ...leftAlign };
    
    worksheet.addRow([]);
    worksheet.addRow([]);

    try {
        const logoPath = path.join(__dirname, '../image.png');
        if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            const logoId = workbook.addImage({ buffer: logoBuffer, extension: 'png' });
            worksheet.addImage(logoId, { tl: { col: 2, row: 2 }, ext: { width: 350, height: 50 } });
        } else {
            worksheet.getCell('C3').value = '[Logo aqui]';
        }
    } catch (imgError) {
        worksheet.getCell('C3').value = '[Logo aqui]';
    }
    worksheet.getRow(3).height = 40;
    worksheet.addRow([]);

    const titleRow = worksheet.addRow([]);
    worksheet.mergeCells(titleRow.number, 3, titleRow.number, 8);
    titleRow.getCell(3).value = 'Saída de Cliente';
    titleRow.getCell(3).style = titleStyle;
    worksheet.addRow([]);
    
    const infoRow1 = worksheet.addRow([]);
    infoRow1.getCell(3).value = 'Grupo:';
    infoRow1.getCell(3).style = boldStyle;
    infoRow1.getCell(4).style = leftAlign;
    infoRow1.getCell(4).value = empresas[0]?.grupo || 'Não especificado';
    
    const infoRow2 = worksheet.addRow([]);
    infoRow2.getCell(3).value = 'Tipo de Saída:';
    infoRow2.getCell(3).style = boldStyle;
    infoRow2.getCell(4).style = leftAlign;
    infoRow2.getCell(4).value = 'Total';
    worksheet.addRow([]);

    const headersEmpresas = ['', '', 'Código', 'Apelido', 'Razão Social', 'CNPJ'];
    const empresaHeaderRow = worksheet.addRow(headersEmpresas);
    empresaHeaderRow.eachCell((cell, colNumber) => {
        if (colNumber > 2) cell.style = sectionHeaderStyle;
    });
    
    empresas.forEach(empresa => {
        const codigoDom = empresa.extra?.['Código Domínio'] || empresa.extra?.['Código'] || empresa.codigo || empresa.codigo_empresa || '';
        const row = worksheet.addRow(['', '', parseInt(codigoDom) || codigoDom, empresa.nome_fantasia || empresa.nome || empresa.nome_fantasia || '', empresa.razao_social || empresa.razaoSocial || '', formatCNPJ(empresa.cnpj || empresa.CNPJ)]);
        row.eachCell(cell => cell.alignment = leftAlign.alignment);
    });
    worksheet.addRow([]);
    
    const permanenciaHeaderRow = worksheet.addRow([]);
    permanenciaHeaderRow.getCell(3).value = 'Permanência:';
    empresas.forEach((empresa, index) => permanenciaHeaderRow.getCell(index + 4).value = empresa.nome_fantasia || empresa.nome || '');
    permanenciaHeaderRow.eachCell((cell, colNumber) => { if (colNumber > 2) cell.style = sectionHeaderStyle; });

    const row1 = worksheet.addRow(['', '', 'Primeira Competência', ...empresas.map(e => formatDateToPt(parseDate(e.inicio_contrato)))]);
    row1.getCell(3).font = boldStyle.font; row1.eachCell(cell => cell.alignment = leftAlign.alignment);

    const row2 = worksheet.addRow(['', '', 'Última Competência', ...empresas.map(e => formatDateToPt(parseDate(saida.rows.find(s => s.codigo === (e.extra?.['Código Domínio'] || e.extra?.['Código'] || e.codigo))?.ultima_competencia)))]);
    row2.getCell(3).font = boldStyle.font; row2.eachCell(cell => cell.alignment = leftAlign.alignment);
    
    const permanenciaMesesRowData = ['', '', 'Permanência (meses):'];
    empresas.forEach(e => { const i = saida.rows.find(s => s.codigo === (e.extra?.['Código Domínio'] || e.extra?.['Código'] || e.codigo)); permanenciaMesesRowData.push(parseDate(e.inicio_contrato) && parseDate(i?.ultima_competencia) ? `${differenceInMonths(parseDate(i.ultima_competencia), parseDate(e.inicio_contrato))} meses` : 'N/A'); });
    const row3 = worksheet.addRow(permanenciaMesesRowData);
    row3.getCell(3).font = boldStyle.font; row3.eachCell(cell => cell.alignment = leftAlign.alignment);
    
    const row4 = worksheet.addRow(['', '', 'Aviso Prévio:', ...empresas.map(e => saida.rows.find(s => s.codigo === (e.extra?.['Código Domínio'] || e.extra?.['Código'] || e.codigo))?.aviso_previo || 'N/A')]);
    row4.getCell(3).font = boldStyle.font; row4.eachCell(cell => cell.alignment = leftAlign.alignment);
    worksheet.addRow([]);
    
    const lastDataColumn = 2 + empresas.length + 1;

    const servicosTitleRow = worksheet.addRow([]);
    worksheet.mergeCells(servicosTitleRow.number, 3, servicosTitleRow.number, lastDataColumn);
    servicosTitleRow.getCell(3).value = 'Serviços Cancelados';
    servicosTitleRow.getCell(3).style = sectionHeaderStyle;
    
    const servicosUnicos = [...new Set(produtos.rows.filter(p => codigosNaListaDeSaida.has(p.codigo) && (p.tipo_produto === 'Fixo' || p.tipo_produto === 'FIXO') && (p.situacao_produto === 'Inativo' || p.situacao_produto === 'INATIVO')).map(p => (p.produto || '').replace(/_/g, ' ')))];
    servicosUnicos.forEach(servico => worksheet.addRow(['', '', servico]).eachCell(c => c.alignment = leftAlign.alignment));
    worksheet.addRow([]);
    
    const motivoTitleRow = worksheet.addRow([]);
    worksheet.mergeCells(motivoTitleRow.number, 3, motivoTitleRow.number, lastDataColumn);
    motivoTitleRow.getCell(3).value = 'Motivo da Saída';
    motivoTitleRow.getCell(3).style = sectionHeaderStyle;

    const motivosUnicos = [...new Set(saida.rows.filter(s => s.motivo_saida && String(s.motivo_saida).trim() !== '').map(s => String(s.motivo_saida).trim()))];
    if (motivosUnicos.length > 0) {
        motivosUnicos.forEach(motivo => worksheet.addRow(['', '', motivo]).eachCell(c => c.alignment = leftAlign.alignment));
    } else {
        worksheet.addRow(['', '', 'Nenhum motivo especificado.']).eachCell(c => c.alignment = leftAlign.alignment);
    }

    if (options.includeHonorarios) {
        const canceledServicesForHonorarios = [...new Set(
            produtos.rows
                .filter(p => 
                    codigosNaListaDeSaida.has(p.codigo) && 
                    (p.tipo_produto === 'Fixo' || p.tipo_produto === 'FIXO') && 
                    (p.situacao_produto === 'Inativo' || p.situacao_produto === 'INATIVO')
                )
                .map(p => p.produto)
        )];

        const companyChunks = chunkArray(empresas, 3);

        companyChunks.forEach(chunk => {
            worksheet.addRow([]);
            const honorariosHeaderRow = worksheet.addRow(['', '', 'Honorários', ...chunk.map(c => c.nome_fantasia || c.nome || c.nome)]);
            honorariosHeaderRow.eachCell((cell, colNumber) => { if (colNumber > 2) cell.style = sectionHeaderStyle; });

            const columnTotals = new Array(chunk.length).fill(0);

            canceledServicesForHonorarios.forEach(serviceName => {
                const rowData = ['', '', serviceName.replace('BPO_', '').replace(/_/g, ' ') + ':'];
                chunk.forEach((company, index) => {
                    const prod = produtos.rows.find(p => p.codigo === (company.extra?.['Código Domínio'] || company.extra?.['Código'] || company.codigo) && p.produto === serviceName);
                    const value = prod ? parseCurrency(prod.valor_produto || prod.valor) : 0;
                    rowData.push(value);
                    columnTotals[index] += value;
                });
                const dataRow = worksheet.addRow(rowData);
                dataRow.getCell(3).style = boldStyle;
                chunk.forEach((_, index) => dataRow.getCell(4 + index).style = currencyStyle);
            });

            const totalRowData = ['', '', 'Total:', ...columnTotals];
            const totalRow = worksheet.addRow(totalRowData);
            totalRow.eachCell((cell, colNumber) => { if (colNumber > 2) cell.style = totalStyle; });
        });
    }

    worksheet.columns.forEach((column, i) => { if (i < 2) return; let maxLength = 15; column.eachCell({ includeEmpty: true }, (cell) => { const len = cell.value ? String(cell.value).length : 10; if (len > maxLength) maxLength = len; }); column.width = (maxLength > 30 ? 30 : maxLength + 2); });

    return workbook;
}

async function generateSaidaGrupoReport(grupoTerm) {
    try {
        logger.info(`Gerando relatório de saída para grupo: ${grupoTerm}`);

        const result = await searchService.pesquisaGrupoAll(grupoTerm);
        if (!result.success) {
            throw new Error(`Grupo não encontrado em todas as planilhas: ${result.missing?.join(', ')}`);
        }

        const saida = result.details?.saida || { rows: [] };
        const cadastro = result.details?.cadastro || { rows: [] };
        const produtos = result.details?.produtos || { rows: [] };

        const codigosNaListaDeSaida = new Set(saida.rows.map(s => s.codigo));
        const empresas = cadastro.rows.filter(e => codigosNaListaDeSaida.has(String(e.extra?.['Código Domínio'] || e.extra?.['Código'] || e.codigo)));

        if (!empresas || empresas.length === 0) {
            logger.info('Nenhuma empresa da lista de saída foi encontrada.');
            return { success: false, message: 'Nenhuma empresa encontrada para o grupo', grupo: grupoTerm };
        }

        const fullData = { saida, cadastro, produtos, empresas, codigosNaListaDeSaida };

        // Gerar sem honorários
        logger.info('Gerando relatório SEM honorários...');
        const workbook1 = await buildWorkbook(fullData, { includeHonorarios: false });
        const fileName1 = `Saida_Grupo_${grupoTerm.replace(/[^a-zA-Z0-9]/g, '_')}_Sem_Honorarios_${new Date().toISOString().replace(/[:.]/g,'-')}.xlsx`;
        const filePath1 = path.join(STORAGE_DIR, fileName1);
        await workbook1.xlsx.writeFile(filePath1);
        logger.info(`Planilha "${fileName1}" gerada com sucesso!`);

        // Gerar com honorários
        logger.info('Gerando relatório COM honorários...');
        const workbook2 = await buildWorkbook(fullData, { includeHonorarios: true });
        const fileName2 = `Saida_Grupo_${grupoTerm.replace(/[^a-zA-Z0-9]/g, '_')}_Com_Honorarios_${new Date().toISOString().replace(/[:.]/g,'-')}.xlsx`;
        const filePath2 = path.join(STORAGE_DIR, fileName2);
        await workbook2.xlsx.writeFile(filePath2);
        logger.info(`Planilha "${fileName2}" gerada com sucesso!`);

        return {
            success: true,
            grupo: grupoTerm,
            planilhas: [
                { tipo: 'sem_honorarios', fileName: fileName1, filePath: filePath1 },
                { tipo: 'com_honorarios', fileName: fileName2, filePath: filePath2 }
            ],
            empresas: empresas.length
        };

    } catch (error) {
        logger.error('Erro ao gerar relatório de saída por grupo:', error);
        throw error;
    }
}

// Keep a compatible client-level generator that builds a single workbook for a cliente term
async function generateSaidaClienteReport(clienteTerm) {
    try {
        logger.info(`Gerando relatório de saída para cliente: ${clienteTerm}`);
        const result = await searchService.pesquisaClienteAll(clienteTerm);
        if (!result.success) {
            throw new Error(`Cliente não encontrado em todas as planilhas: ${result.missing?.join(', ')}`);
        }

        const saida = result.details?.saida || { rows: [] };
        const cadastro = result.details?.cadastro || { rows: [] };
        const produtos = result.details?.produtos || { rows: [] };

        const codigosNaListaDeSaida = new Set(saida.rows.map(s => s.codigo));
        const empresas = cadastro.rows.filter(e => codigosNaListaDeSaida.has(String(e.extra?.['Código Domínio'] || e.extra?.['Código'] || e.codigo)));

        const fullData = { saida, cadastro, produtos, empresas, codigosNaListaDeSaida };
        const workbook = await buildWorkbook(fullData, { includeHonorarios: false });

        const fileName = `Saida_Cliente_${clienteTerm.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().replace(/[:.]/g,'-')}.xlsx`;
        const filePath = path.join(STORAGE_DIR, fileName);
        await workbook.xlsx.writeFile(filePath);

        return {
            success: true,
            filePath,
            fileName,
            cliente: clienteTerm,
            grupo: empresas[0]?.grupo || null,
            totalRegistros: saida.rows.length
        };
    } catch (error) {
        logger.error('Erro ao gerar relatório de saída por cliente:', error);
        throw error;
    }
}

async function addImageToWorksheet(workbook, worksheet) {
    try {
        const imagePath = path.join(__dirname, '../image.png');
        if (!fs.existsSync(imagePath)) {
            logger.info('⚠️ Arquivo image.png não encontrado. Pulando inserção da imagem.');
            return;
        }

        const imageBuffer = fs.readFileSync(imagePath);
        const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension: 'png',
        });

        worksheet.addImage(imageId, {
            tl: { col: 5, row: 0 },
            ext: { width: 200, height: 60 },
            editAs: 'oneCell'
        });

        logger.info('🖼️ Imagem inserida na planilha de saída');
    } catch (error) {
        logger.info('⚠️ Erro ao inserir imagem:', error.message);
    }
}

module.exports = {
    generateSaidaGrupoReport,
    generateSaidaClienteReport,
    STORAGE_DIR
};
