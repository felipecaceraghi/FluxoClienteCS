// Serviço para baixar a planilha de saída de clientes do SharePoint
// O download será feito via link compartilhado, salvando em storage/sharepoint-files


const { ConfidentialClientApplication } = require('@azure/msal-node');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const logger = require('../utils/logger');

// Configurações do SharePoint (usando valores do .env quando disponíveis)
const config = {
    auth: {
        clientId: process.env.SHAREPOINT_CLIENT_ID,
        clientSecret: process.env.SHAREPOINT_CLIENT_SECRET,
        authority: process.env.SHAREPOINT_TENANT_ID ? `https://login.microsoftonline.com/${process.env.SHAREPOINT_TENANT_ID}` : undefined
    }
};

// ID do arquivo e usuário do drive (padrões conforme fornecido)
const FILE_ID = process.env.SAIDA_CLIENTES_FILE_ID || 'DC1114A3-3DAF-4C2F-8C33-2D8E2612A6DB';
const USER_EMAIL = process.env.SAIDA_CLIENTES_USER_EMAIL || 'database@gofurthergroup.com.br';

const STORAGE_DIR = path.join(__dirname, '../storage/sharepoint-files');
const FILE_NAME = process.env.SAIDA_CLIENTES_FILE_NAME || 'Saida_de_Clientes.xlsx';
const FILE_PATH = path.join(STORAGE_DIR, FILE_NAME);

// Share links for additional files (can be overridden via .env)
const CADASTRO_SHARE_URL = process.env.CADASTRO_CLIENTES_SHARE_URL || 'https://gofurther-my.sharepoint.com/personal/database_gofurthergroup_com_br/Documents/Controladoria/1%20-%20Cadastro%20de%20Clientes%20v1.xlsm';
const PRODUTOS_SHARE_URL = process.env.PRODUTOS_CLIENTES_SHARE_URL || 'https://gofurther-my.sharepoint.com/:x:/r/personal/database_gofurthergroup_com_br/Documents/Controladoria/2%20-%20Produtos%20dos%20Clientes%20v1.xlsm?d=wd6483d69c36243eebac272faaded21f2&csf=1&web=1&e=CKwt0o';

async function getAccessToken() {
    if (!config.auth.clientId || !config.auth.clientSecret || !config.auth.authority) {
        const errMsg = 'Missing SharePoint/Azure configuration. Please set SHAREPOINT_CLIENT_ID, SHAREPOINT_CLIENT_SECRET and SHAREPOINT_TENANT_ID in the .env';
        logger.error(errMsg);
        throw new Error(errMsg);
    }

    const cca = new ConfidentialClientApplication(config);
    const clientCredentialRequest = {
        scopes: ['https://graph.microsoft.com/.default'],
    };
    try {
        const response = await cca.acquireTokenByClientCredential(clientCredentialRequest);
        return response.accessToken;
    } catch (error) {
        logger.error('Erro ao obter token do Graph:', error);
        throw error;
    }
}

async function downloadSaidaClientesPlanilha() {
    try {
        logger.info('Obtendo token de acesso...');
        const accessToken = await getAccessToken();

        logger.info('Baixando arquivo...');
        const downloadUrl = `https://graph.microsoft.com/v1.0/users/${USER_EMAIL}/drive/items/${FILE_ID}/content`;

        if (!fs.existsSync(STORAGE_DIR)) {
            fs.mkdirSync(STORAGE_DIR, { recursive: true });
        }

        const response = await axios({
            method: 'get',
            url: downloadUrl,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            responseType: 'stream'
        });

            const writer = fs.createWriteStream(FILE_PATH);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    logger.info(`Arquivo baixado com sucesso: ${FILE_PATH}`);
                    resolve({ success: true, filePath: FILE_PATH });
                });
                writer.on('error', (err) => {
                    logger.error('Erro ao salvar arquivo:', err);
                    reject({ success: false, error: err });
                });
            });

    } catch (error) {
        logger.error('Erro ao baixar arquivo:', error);
        throw error;
    }
}

module.exports = {
    downloadSaidaClientesPlanilha,
    FILE_PATH
};

// Helper: download a file from a SharePoint share link using Graph /shares API
async function downloadFromShareUrl(shareUrl, outFileName) {
    try {
        logger.info('Iniciando download por share-link...');
        const accessToken = await getAccessToken();

        // Build shareId (u! + base64url)
        const base64 = Buffer.from(shareUrl).toString('base64');
        const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const shareId = `u!${base64url}`;

        const downloadUrl = `https://graph.microsoft.com/v1.0/shares/${shareId}/driveItem/content`;

        if (!fs.existsSync(STORAGE_DIR)) {
            fs.mkdirSync(STORAGE_DIR, { recursive: true });
        }

        const outPath = path.join(STORAGE_DIR, outFileName);

        const response = await axios({
            method: 'get',
            url: downloadUrl,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(outPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                logger.info(`Arquivo salvo: ${outPath}`);
                resolve({ success: true, filePath: outPath });
            });
            writer.on('error', (err) => {
                logger.error('Erro ao salvar arquivo do share-link:', err);
                reject({ success: false, error: err });
            });
        });

    } catch (error) {
        logger.error('Erro no download por share-link:', error);
        throw error;
    }
}

async function downloadCadastroClientesPlanilha() {
    const fileName = process.env.CADASTRO_CLIENTES_FILE_NAME || 'Cadastro_de_Clientes_v1.xlsm';
    return downloadFromShareUrl(CADASTRO_SHARE_URL, fileName);
}

async function downloadProdutosClientesPlanilha() {
    const fileName = process.env.PRODUTOS_CLIENTES_FILE_NAME || 'Produtos_dos_Clientes_v1.xlsm';
    return downloadFromShareUrl(PRODUTOS_SHARE_URL, fileName);
}

module.exports = Object.assign(module.exports, {
    downloadFromShareUrl,
    downloadCadastroClientesPlanilha,
    downloadProdutosClientesPlanilha
});
