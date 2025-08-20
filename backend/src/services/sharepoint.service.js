const axios = require('axios');
const qs = require('qs');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Configurações do SharePoint
const SHAREPOINT_CONFIG = {
    tenantId: process.env.SHAREPOINT_TENANT_ID || 'f8eacd1e-d732-40e9-8e55-c65e5b81b0d5',
    clientId: process.env.SHAREPOINT_CLIENT_ID || 'f8647a87-e239-46ff-91aa-074fa527b1ce',
    clientSecret: process.env.SHAREPOINT_CLIENT_SECRET || 'YSJ8Q~fZLUrAHLUGDO6YK~dz3U4nCK2_cF_xHcFj',
    scope: 'https://graph.microsoft.com/.default',
    fileUrl: process.env.SHAREPOINT_FILE_URL || 'https://estatisticaoficial.sharepoint.com/:x:/s/FluxoClienteCS/EVP5pF7FME5NiO-fhbAFQFIBDfhp6HYdnzd6xHOq8iO5Rw?e=C2BT03'
};

class SharePointService {
    constructor() {
        // Pasta para armazenar arquivos baixados
        this.downloadPath = path.join(__dirname, '../storage/sharepoint-files');
        this.ensureDownloadDirectory();
        
        logger.info('SharePoint Service inicializado');
    }

    ensureDownloadDirectory() {
        if (!fs.existsSync(this.downloadPath)) {
            fs.mkdirSync(this.downloadPath, { recursive: true });
            logger.info('Diretório de download criado:', this.downloadPath);
        }
    }

    async getAccessToken() {
        try {
            const url = `https://login.microsoftonline.com/${SHAREPOINT_CONFIG.tenantId}/oauth2/v2.0/token`;
            
            const data = {
                client_id: SHAREPOINT_CONFIG.clientId,
                scope: SHAREPOINT_CONFIG.scope,
                client_secret: SHAREPOINT_CONFIG.clientSecret,
                grant_type: 'client_credentials'
            };

            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            };

            logger.debug('Obtendo token de acesso do SharePoint...');
            
            const response = await axios.post(url, qs.stringify(data), { headers });
            
            logger.debug('Token de acesso obtido com sucesso');
            return response.data.access_token;
        } catch (error) {
            logger.error('Erro ao obter token de acesso:', error);
            throw new Error(`Falha na autenticação SharePoint: ${error.message}`);
        }
    }

    async downloadFile() {
        try {
            const token = await this.getAccessToken();
            
            // Codificar URL do arquivo conforme documentação Microsoft Graph
            const encodedUrl = Buffer.from(SHAREPOINT_CONFIG.fileUrl).toString('base64').replace(/=/g, '');
            const graphUrl = `https://graph.microsoft.com/v1.0/shares/u!${encodedUrl}/driveItem/content`;
            
            logger.info('Iniciando download do arquivo SharePoint...');

            const response = await axios.get(graphUrl, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'User-Agent': 'FluxoClienteCS-Backend/1.0'
                },
                responseType: 'arraybuffer',
                timeout: 30000 // 30 segundos timeout
            });

            // Nome do arquivo com timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `Clientes_${timestamp}.xlsm`;
            const filePath = path.join(this.downloadPath, fileName);

            // Salvar arquivo
            fs.writeFileSync(filePath, response.data);
            
            const fileSize = (response.data.length / 1024).toFixed(2);
            
            logger.info(`Arquivo baixado com sucesso! ${fileName} (${fileSize} KB)`);

            return {
                success: true,
                fileName,
                filePath,
                size: response.data.length,
                downloadedAt: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Erro ao baixar arquivo SharePoint:', error);
            
            return {
                success: false,
                error: error.message,
                message: `Falha ao baixar arquivo: ${error.message}`
            };
        }
    }
}

module.exports = new SharePointService();
