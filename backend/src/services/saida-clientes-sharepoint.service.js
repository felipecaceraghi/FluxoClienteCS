const axios = require('axios');
const qs = require('qs');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Configurações do SharePoint para planilha de saída de clientes
const SAIDA_SHAREPOINT_CONFIG = {
    tenantId: process.env.SHAREPOINT_TENANT_ID,
    clientId: process.env.SHAREPOINT_CLIENT_ID,
    // O segredo deve ser fornecido apenas via variável de ambiente
    clientSecret: process.env.SHAREPOINT_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    fileUrl: process.env.SAIDA_SHAREPOINT_FILE_URL || 'https://gofurther-my.sharepoint.com/:x:/r/personal/database_gofurthergroup_com_br/_layouts/15/Doc.aspx?sourcedoc=%7BDC1114A3-3DAF-4C2F-8C33-2D8E2612A6DB%7D&file=Sa%25u00edda%20de%20Clientes.xlsx&action=default&mobileredirect=true'
};

class SaidaSharePointService {
    constructor() {
        this.downloadPath = path.join(__dirname, '../storage/sharepoint-files');
        this.ensureDownloadDirectory();
        logger.info('SaidaSharePointService inicializado');
        // Validate that secrets are provided via environment variables
        if (!SAIDA_SHAREPOINT_CONFIG.clientSecret) {
            logger.warn('SharePoint client secret is not set. Set process.env.SHAREPOINT_CLIENT_SECRET to enable SharePoint downloads. Do NOT commit secrets to source control.');
        }
    }

    ensureDownloadDirectory() {
        if (!fs.existsSync(this.downloadPath)) {
            fs.mkdirSync(this.downloadPath, { recursive: true });
            logger.info('Diretório de download criado:', this.downloadPath);
        }
    }

    async getAccessToken() {
        try {
            const url = `https://login.microsoftonline.com/${SAIDA_SHAREPOINT_CONFIG.tenantId}/oauth2/v2.0/token`;
            const data = {
                client_id: SAIDA_SHAREPOINT_CONFIG.clientId,
                scope: SAIDA_SHAREPOINT_CONFIG.scope,
                client_secret: SAIDA_SHAREPOINT_CONFIG.clientSecret,
                grant_type: 'client_credentials'
            };
            const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            logger.debug('Obtendo token de acesso do SharePoint (Saída)...');
            const response = await axios.post(url, qs.stringify(data), { headers });
            logger.debug('Token de acesso obtido com sucesso');
            return response.data.access_token;
        } catch (error) {
            logger.error('Erro ao obter token de acesso (Saída):', error);
            throw new Error(`Falha na autenticação SharePoint: ${error.message}`);
        }
    }

    async downloadFile() {
        try {
            const token = await this.getAccessToken();
            const encodedUrl = Buffer.from(SAIDA_SHAREPOINT_CONFIG.fileUrl).toString('base64').replace(/=/g, '');
            const graphUrl = `https://graph.microsoft.com/v1.0/shares/u!${encodedUrl}/driveItem/content`;
            logger.info('Iniciando download do arquivo de saída do SharePoint...');
            const response = await axios.get(graphUrl, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'User-Agent': 'FluxoClienteCS-Backend/1.0'
                },
                responseType: 'arraybuffer',
                timeout: 30000
            });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `Saida_Clientes_${timestamp}.xlsx`;
            const filePath = path.join(this.downloadPath, fileName);
            fs.writeFileSync(filePath, response.data);
            const fileSize = (response.data.length / 1024).toFixed(2);
            logger.info(`Arquivo de saída baixado com sucesso! ${fileName} (${fileSize} KB)`);
            return {
                success: true,
                fileName,
                filePath,
                size: response.data.length,
                downloadedAt: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Erro ao baixar arquivo de saída do SharePoint:', error);
            return {
                success: false,
                error: error.message,
                message: `Falha ao baixar arquivo: ${error.message}`
            };
        }
    }
}

module.exports = new SaidaSharePointService();
