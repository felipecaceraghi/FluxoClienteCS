const logger = require('./logger');

class CurrencyUtils {
    /**
     * Formatar valor numérico para moeda brasileira
     * @param {number|string} value - Valor a ser formatado
     * @param {boolean} includeSymbol - Se deve incluir o símbolo R$
     * @returns {string} Valor formatado
     */
    static formatToBRL(value, includeSymbol = true) {
        try {
            // Converter para número se for string
            const numValue = typeof value === 'string' ? parseFloat(value) : value;
            
            // Verificar se é um número válido
            if (isNaN(numValue)) {
                logger.warn('Valor inválido para formatação de moeda', { value });
                return includeSymbol ? 'R$ 0,00' : '0,00';
            }

            // Formatar para moeda brasileira
            const formatted = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(numValue);

            // Retornar com ou sem símbolo
            return includeSymbol ? formatted : formatted.replace('R$', '').trim();

        } catch (error) {
            logger.error('Erro ao formatar moeda', error, { value, includeSymbol });
            return includeSymbol ? 'R$ 0,00' : '0,00';
        }
    }

    /**
     * Converter string de moeda brasileira para número
     * @param {string} currencyString - String no formato "R$ 1.234,56"
     * @returns {number} Valor numérico
     */
    static parseFromBRL(currencyString) {
        try {
            if (!currencyString || typeof currencyString !== 'string') {
                return 0;
            }

            // Remove "R$" e espaços
            let cleanValue = currencyString.replace(/R\$|\s/g, '');
            
            // Detecta o formato da moeda brasileira
            let numericValue;
            
            // Formato brasileiro: 3.500.000,00 (ponto = milhares, vírgula = decimal)
            if (cleanValue.includes(',') && cleanValue.lastIndexOf(',') > cleanValue.lastIndexOf('.')) {
                // Remove pontos (separadores de milhares) e substitui vírgula por ponto
                numericValue = parseFloat(cleanValue.replace(/\./g, '').replace(',', '.'));
            }
            // Formato americano: 3,500,000.00 (vírgula = milhares, ponto = decimal)
            else if (cleanValue.includes('.') && cleanValue.lastIndexOf('.') > cleanValue.lastIndexOf(',')) {
                // Remove vírgulas (separadores de milhares), mantém o ponto decimal
                numericValue = parseFloat(cleanValue.replace(/,/g, ''));
            }
            // Apenas números com vírgula (formato brasileiro simples)
            else if (cleanValue.includes(',') && !cleanValue.includes('.')) {
                numericValue = parseFloat(cleanValue.replace(',', '.'));
            }
            // Apenas números com ponto ou números inteiros
            else {
                numericValue = parseFloat(cleanValue);
            }

            return isNaN(numericValue) ? 0 : numericValue;

        } catch (error) {
            logger.error('Erro ao converter moeda para número', error, { currencyString });
            return 0;
        }
    }

    /**
     * Validar se uma string representa um valor monetário válido
     * @param {string} value - Valor a ser validado
     * @returns {boolean} Se é um valor monetário válido
     */
    static isValidCurrency(value) {
        if (!value || typeof value !== 'string') {
            return false;
        }

        const trimmed = value.trim();
        
        // Regex mais ampla para aceitar formatos variados:
        // R$ 1,234.56 (americano)
        // R$ 1.234,56 (brasileiro)
        // R$ 123.45
        // R$ 123,45
        // 123.45
        // 123,45
        // etc.
        const currencyRegex = /^R\$?\s*\d{1,3}([\.,]\d{3})*([\.,]\d{2})?$|^\d{1,3}([\.,]\d{3})*([\.,]\d{2})?$|^\d+([\.,]\d{1,2})?$/;
        
        return currencyRegex.test(trimmed);
    }

    /**
     * Aplicar formatação de moeda a um valor na planilha
     * @param {any} value - Valor a ser processado
     * @returns {number|string} Valor processado para planilha
     */
    static processForSpreadsheet(value) {
        if (value === null || value === undefined || value === '') {
            return 0;
        }

        // Se já é um número, retorna como está
        if (typeof value === 'number') {
            return value;
        }

        // Se é string com formato de moeda, converte para número
        if (typeof value === 'string' && this.isValidCurrency(value)) {
            return this.parseFromBRL(value);
        }

        // Tenta conversão simples
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }

    /**
     * Obter formato de célula Excel para moeda brasileira
     * @returns {string} Formato Excel
     */
    static getExcelCurrencyFormat() {
        return '"R$" #,##0.00';
    }

    /**
     * Obter estilo CSS para valores monetários
     * @returns {object} Objeto de estilo
     */
    static getCurrencyStyle() {
        return {
            textAlign: 'right',
            fontFamily: 'Calibri, Arial, sans-serif',
            fontSize: '11pt'
        };
    }
}

module.exports = CurrencyUtils;
