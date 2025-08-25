const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class PythonExcelToImageService {
    
    async convertExcelToImageExact(excelFilePath, outputImagePath) {
        try {
            logger.info('🐍 Convertendo Excel para imagem usando Python EXATO', { 
                entrada: excelFilePath,
                saida: outputImagePath 
            });

            // Verificar se arquivo Excel existe
            if (!fs.existsSync(excelFilePath)) {
                throw new Error(`Arquivo Excel não encontrado: ${excelFilePath}`);
            }

            // Caminho do script Python
            const pythonScriptPath = path.join(__dirname, 'excel_to_image_exact.py');
            
            if (!fs.existsSync(pythonScriptPath)) {
                throw new Error('Script Python não encontrado');
            }

            // Executar script Python
            const result = await this.executePythonScript(pythonScriptPath, excelFilePath, outputImagePath);
            
            if (result.success) {
                logger.info('✅ Conversão Python EXATA concluída', { 
                    arquivo: outputImagePath,
                    tamanho: fs.statSync(outputImagePath).size + ' bytes',
                    metodo: result.method
                });

                // Converter para base64 para uso no email
                const imageBuffer = fs.readFileSync(outputImagePath);
                const base64Image = imageBuffer.toString('base64');

                return {
                    success: true,
                    imagePath: outputImagePath,
                    imageSize: fs.statSync(outputImagePath).size,
                    method: result.method,
                    base64: base64Image,
                    mimeType: 'image/png'
                };
            } else {
                throw new Error(`Conversão Python falhou: ${result.error}`);
            }

        } catch (error) {
            logger.error('❌ Erro na conversão Python', {
                erro: error.message,
                stack: error.stack
            });
            
            throw new Error(`Falha na conversão Python: ${error.message}`);
        }
    }

    async convertAndGetBase64(excelFilePath) {
        try {
            // Gerar nome único para a imagem
            const fileName = path.basename(excelFilePath, '.xlsx');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const outputImagePath = path.join(
                path.dirname(excelFilePath), 
                `${fileName}_email_${timestamp}.png`
            );

            // Converter usando Python
            const result = await this.convertExcelToImageExact(excelFilePath, outputImagePath);
            
            if (result.success && result.base64) {
                logger.info('✅ Conversão para email concluída', {
                    arquivo: result.imagePath,
                    base64Length: result.base64.length,
                    mimeType: result.mimeType
                });

                return {
                    success: true,
                    base64: result.base64,
                    mimeType: result.mimeType,
                    imagePath: result.imagePath,
                    method: result.method
                };
            } else {
                throw new Error('Falha na conversão ou base64 não gerado');
            }

        } catch (error) {
            logger.error('❌ Erro na conversão para email', {
                erro: error.message,
                stack: error.stack
            });
            
            return {
                success: false,
                error: error.message,
                base64: null,
                mimeType: null
            };
        }
    }

    async executePythonScript(scriptPath, excelPath, imagePath) {
        return new Promise((resolve, reject) => {
            // Normalizar caminhos para Windows
            const normalizedExcelPath = path.resolve(excelPath);
            const normalizedImagePath = path.resolve(imagePath);
            const normalizedScriptPath = path.resolve(scriptPath);
            
            // Comando Python com caminhos absolutos
            const command = `python "${normalizedScriptPath}" "${normalizedExcelPath}" "${normalizedImagePath}"`;
            
            logger.info('🔧 Executando Python com caminhos normalizados', { 
                comando: command,
                excelExiste: fs.existsSync(normalizedExcelPath),
                scriptExiste: fs.existsSync(normalizedScriptPath),
                diretorioSaida: path.dirname(normalizedImagePath)
            });
            
            exec(command, { 
                timeout: 120000, // 2 minutos timeout
                cwd: path.dirname(normalizedScriptPath)
            }, (error, stdout, stderr) => {
                
                logger.info('📝 Saída Python', { 
                    stdout: stdout,
                    stderr: stderr,
                    error: error?.message
                });
                
                if (error) {
                    reject(new Error(`Erro execução Python: ${error.message}`));
                    return;
                }
                
                if (stderr && !stdout.includes('SUCCESS')) {
                    reject(new Error(`Erro Python stderr: ${stderr}`));
                    return;
                }
                
                // Verificar se foi bem-sucedido
                if (stdout.includes('SUCCESS:')) {
                    const resultPath = stdout.split('SUCCESS:')[1].trim();
                    
                    // Verificar se arquivo foi criado
                    if (fs.existsSync(normalizedImagePath)) {
                        // Extrair método usado do log
                        let method = 'Python';
                        if (stdout.includes('xlwings')) method = 'xlwings (Excel)';
                        else if (stdout.includes('COM')) method = 'COM Automation';
                        else if (stdout.includes('Aspose')) method = 'Aspose.Cells';
                        else if (stdout.includes('LibreOffice')) method = 'LibreOffice';
                        else if (stdout.includes('OpenPyXL')) method = 'OpenPyXL Melhorado';
                        
                        resolve({
                            success: true,
                            imagePath: resultPath,
                            method: method
                        });
                    } else {
                        reject(new Error('Imagem não foi criada apesar do sucesso reportado'));
                    }
                } else {
                    reject(new Error(`Conversão Python falhou: ${stdout || stderr || 'Erro desconhecido'}`));
                }
            });
        });
    }

    async checkPythonDependencies() {
        try {
            logger.info('🔍 Verificando dependências Python...');
            
            const dependencies = ['openpyxl', 'Pillow', 'pandas'];
            const results = {};
            
            for (const dep of dependencies) {
                try {
                    const result = await this.checkPythonPackage(dep);
                    results[dep] = result;
                } catch (error) {
                    results[dep] = false;
                }
            }
            
            logger.info('📋 Status dependências Python', results);
            return results;
            
        } catch (error) {
            logger.error('❌ Erro ao verificar dependências', error);
            return {};
        }
    }

    async checkPythonPackage(packageName) {
        return new Promise((resolve) => {
            exec(`python -c "import ${packageName}; print('OK')"`, (error, stdout) => {
                resolve(!error && stdout.includes('OK'));
            });
        });
    }

    async installPythonDependencies() {
        try {
            logger.info('📦 Instalando dependências Python...');
            
            const packages = ['openpyxl', 'Pillow', 'pandas'];
            
            for (const pkg of packages) {
                logger.info(`🔧 Instalando ${pkg}...`);
                await this.installPythonPackage(pkg);
            }
            
            logger.info('✅ Dependências Python instaladas');
            return true;
            
        } catch (error) {
            logger.error('❌ Erro ao instalar dependências', error);
            return false;
        }
    }

    async installPythonPackage(packageName) {
        return new Promise((resolve, reject) => {
            exec(`pip install ${packageName}`, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Erro ao instalar ${packageName}: ${error.message}`));
                } else {
                    resolve(true);
                }
            });
        });
    }
}

module.exports = new PythonExcelToImageService();
