// Nome do arquivo: excel-clipboard.service.js

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class ExcelClipboardService {
    constructor() {
        // Garante que o nome do script Python aqui seja o mesmo que você salvou
        this.pythonScript = path.join(__dirname, 'enviar_relatorio_completo.py');
    }

    /**
     * Copia dados de uma planilha Excel para a área de transferência
     * @param {string} excelFilePath Caminho para o arquivo Excel
     * @returns {Promise<Object>} Resultado da operação
     */
    async copyExcelRangeToClipboard(excelFilePath) {
        try {
            console.log('📋 Copiando dados da planilha Excel...');

            // Verificar se o arquivo existe
            if (!fs.existsSync(excelFilePath)) {
                throw new Error(`Arquivo Excel não encontrado: ${excelFilePath}`);
            }

            // Usar um script Python simples para ler o Excel e retornar os dados
            const pythonScript = `
import sys
import pandas as pd
import json

def copy_excel_data(file_path):
    try:
        # Ler todas as planilhas do arquivo
        excel_data = pd.read_excel(file_path, sheet_name=None)
        
        # Converter para formato de texto (TSV)
        clipboard_data = ""
        
        for sheet_name, df in excel_data.items():
            clipboard_data += f"=== {sheet_name} ===\\n"
            clipboard_data += df.to_csv(sep='\\t', index=False)
            clipboard_data += "\\n\\n"
        
        return {
            "success": True,
            "clipboardData": clipboard_data.strip(),
            "sheetCount": len(excel_data)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"success": False, "error": "Uso: python script.py <caminho_excel>"}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    result = copy_excel_data(file_path)
    print(json.dumps(result))
`;

            return new Promise((resolve, reject) => {
                const pythonProcess = spawn('python', ['-c', pythonScript, excelFilePath], {
                    cwd: __dirname,
                    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
                });

                let stdout_data = '';
                let stderr_data = '';

                pythonProcess.stdout.on('data', (data) => {
                    stdout_data += data.toString('utf8');
                });

                pythonProcess.stderr.on('data', (data) => {
                    stderr_data += data.toString('utf8');
                });

                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        reject(new Error(`Script Python falhou: ${stderr_data}`));
                        return;
                    }

                    try {
                        const result = JSON.parse(stdout_data.trim());
                        if (result.success) {
                            console.log(`✅ Dados copiados com sucesso (${result.sheetCount} planilhas)`);
                            resolve(result);
                        } else {
                            reject(new Error(result.error || 'Erro desconhecido'));
                        }
                    } catch (parseError) {
                        reject(new Error(`Erro ao parsear resultado: ${parseError.message}`));
                    }
                });

                pythonProcess.on('error', (error) => {
                    reject(new Error(`Falha ao executar Python: ${error.message}`));
                });
            });

        } catch (error) {
            console.error('❌ Erro ao copiar dados da planilha:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Gera corpo do email com dados colados
     * @param {string} grupo Nome do grupo
     * @param {string} clipboardData Dados da planilha
     * @returns {string} HTML do email
     */
    generateEmailWithPastedData(grupo, clipboardData) {
        return `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto;">
                <div style="background: white; padding: 20px; border-radius: 8px;">
                    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
                        Equipe, boa tarde!
                    </p>
                    <p style="color: #374151; line-height: 1.6; margin: 0 0 25px 0;">
                        Encaminho abaixo os dados da planilha referentes ao grupo <strong>${grupo}</strong>:
                    </p>
                    
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
                        <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Dados da Planilha:</h3>
                        <pre style="color: #374151; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; white-space: pre-wrap; margin: 0; background: white; padding: 15px; border-radius: 4px; border: 1px solid #d1d5db;">${clipboardData}</pre>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
                        <strong>Grupo:</strong> ${grupo}<br>
                        <strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}
                    </p>
                </div>
            </div>
        `;
    }

    /**
     * Dispara o processo completo no Python para gerar e enviar o relatório.
     * @param {string} excelPath Caminho para a planilha Excel.
     * @param {string} imagePath Caminho para a imagem local.
     * @param {string} recipient E-mail do destinatário.
     * @param {string} subject Assunto do e-mail.
     * @param {string} message Mensagem do corpo do e-mail (ou o nome do grupo).
     * @returns {Promise<string>} Uma promessa que resolve com a mensagem de sucesso ou rejeita com o erro.
     */
    async sendReportViaPython(excelPath, imagePath, recipient, subject, message) {
        return new Promise((resolve, reject) => {
            
            const scriptArgs = [
                this.pythonScript,
                excelPath,
                imagePath,
                recipient,
                subject,
                message
            ];

            console.log("▶️  Disparando script Python com 5 argumentos...");

            const pythonProcess = spawn('python', scriptArgs, {
                cwd: __dirname, // Garante que o script execute no diretório correto
                env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
            });

            let stdout_data = '';
            let stderr_data = '';

            // Captura as saídas para fornecer um log claro
            pythonProcess.stdout.on('data', (data) => {
                const output = data.toString('utf8').trim();
                console.log(`[Python]: ${output}`);
                stdout_data += output;
            });

            pythonProcess.stderr.on('data', (data) => {
                const errorOutput = data.toString('utf8').trim();
                console.error(`[Python ERRO]: ${errorOutput}`);
                stderr_data += errorOutput;
            });

            // Processa o resultado quando o script Python terminar
            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    const error = new Error(stderr_data || `Script Python falhou com código de saída ${code}`);
                    reject(error);
                    return;
                }
                if (stdout_data.includes('SUCCESS:')) {
                    resolve("Processo de envio de e-mail concluído com sucesso pelo Python.");
                } else {
                    reject(new Error("Script Python finalizado sem uma mensagem de sucesso clara."));
                }
            });

            pythonProcess.on('error', (error) => {
                console.error('❌ Erro crítico ao tentar executar o processo Python:', error);
                reject(new Error(`Falha ao iniciar o script Python: ${error.message}`));
            });
        });
    }
}

module.exports = new ExcelClipboardService();