const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class ExcelNativeHtmlService {
    
    async getExcelNativeHtml(excelFilePath) {
        try {
            logger.info('🎯 Obtendo HTML NATIVO do Excel (sem processamento)', { 
                arquivo: excelFilePath 
            });

            // Verificar se arquivo existe
            if (!fs.existsSync(excelFilePath)) {
                throw new Error(`Arquivo Excel não encontrado: ${excelFilePath}`);
            }

            // Caminho do script Python para HTML nativo
            const pythonScriptPath = path.join(__dirname, 'excel_native_html.py');
            
            // Criar script Python se não existir
            await this.createNativeHtmlScript(pythonScriptPath);

            // Executar script Python
            const result = await this.executeNativeHtmlScript(pythonScriptPath, excelFilePath);
            
            if (result.success) {
                logger.info('✅ HTML NATIVO obtido do Excel', { 
                    arquivo: excelFilePath,
                    tamanho: result.nativeHtml?.length || 0
                });

                return {
                    success: true,
                    nativeHtml: result.nativeHtml,
                    message: 'HTML NATIVO obtido com sucesso'
                };
            } else {
                throw new Error(`Falha ao obter HTML NATIVO: ${result.error}`);
            }

        } catch (error) {
            logger.error('❌ Erro ao obter HTML NATIVO do Excel', {
                erro: error.message,
                stack: error.stack
            });
            
            throw new Error(`Falha ao obter HTML NATIVO: ${error.message}`);
        }
    }

    async createNativeHtmlScript(scriptPath) {
        const pythonScript = `
import sys
import xlwings as xw
import win32clipboard
import time

def get_excel_native_html(excel_file_path):
    try:
        print("Abrindo Excel para HTML NATIVO...")
        
        # Abrir Excel (invisível mas com alertas desabilitados)
        app = xw.App(visible=False, add_book=False)
        app.display_alerts = False
        app.screen_updating = False
        
        try:
            # Abrir arquivo
            wb = app.books.open(excel_file_path)
            
            # Selecionar primeira planilha
            ws = wb.sheets[0]
            
            # Encontrar intervalo usado
            used_range = ws.used_range
            
            if used_range is None:
                return {"success": False, "error": "Planilha vazia"}
            
            print(f"Copiando intervalo NATIVO: {used_range.address}")
            
            # Limpar clipboard primeiro
            try:
                win32clipboard.OpenClipboard()
                win32clipboard.EmptyClipboard()
                win32clipboard.CloseClipboard()
            except:
                pass
            
            # Selecionar e copiar TUDO
            used_range.select()
            used_range.copy()
            
            # Aguardar copy
            print("Aguardando cópia para clipboard...")
            time.sleep(5)
            
                # Obter HTML EXATO do clipboard
            win32clipboard.OpenClipboard()
            try:
                native_html = None
                
                # Formato HTML do Excel
                try:
                    html_format = win32clipboard.RegisterClipboardFormat("HTML Format")
                    if win32clipboard.IsClipboardFormatAvailable(html_format):
                        html_data = win32clipboard.GetClipboardData(html_format)
                        if html_data:
                            if isinstance(html_data, bytes):
                                # Tentar decodificar em utf-8, senão usar cp1252 (Windows-1252) como fallback
                                try:
                                    native_html = html_data.decode('utf-8')
                                except Exception:
                                    try:
                                        native_html = html_data.decode('cp1252')
                                    except Exception:
                                        native_html = html_data.decode('latin-1', errors='ignore')
                            else:
                                native_html = str(html_data)
                            print(f"HTML Format obtido: {len(native_html)} caracteres")
                                
                except Exception as e:
                    print(f"Erro HTML Format: {e}")
                
                # Se não conseguiu HTML, tentar outros formatos (Unicode Text)
                if not native_html:
                    try:
                        CF_UNICODETEXT = 13
                        if win32clipboard.IsClipboardFormatAvailable(CF_UNICODETEXT):
                            text_data = win32clipboard.GetClipboardData(CF_UNICODETEXT)
                            if text_data:
                                if isinstance(text_data, bytes):
                                    try:
                                        native_html = text_data.decode('utf-8')
                                    except Exception:
                                        native_html = text_data.decode('cp1252', errors='ignore')
                                else:
                                    native_html = str(text_data)
                                print(f"Unicode Text obtido: {len(native_html)} caracteres")
                    except Exception as e:
                        print(f"Erro Unicode Text: {e}")
                
                if native_html:
                    return {
                        "success": True, 
                        "nativeHtml": native_html
                    }
                else:
                    return {"success": False, "error": "Nenhum formato encontrado no clipboard"}
                    
            finally:
                win32clipboard.CloseClipboard()
                
        finally:
            # Fechar arquivo e Excel
            wb.close()
            app.quit()
            
    except Exception as e:
        print(f"ERRO: {str(e)}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("ERRO: Uso correto: python excel_native_html.py <caminho_arquivo>")
        sys.exit(1)
    
    excel_file = sys.argv[1]
    result = get_excel_native_html(excel_file)
    
    if result["success"]:
        print(f"SUCCESS:{result['nativeHtml']}")
    else:
        print(f"ERROR:{result['error']}")
`;

        fs.writeFileSync(scriptPath, pythonScript, 'utf8');
        logger.info('📝 Script Python HTML NATIVO criado');
    }

    async executeNativeHtmlScript(scriptPath, excelPath) {
        return new Promise((resolve, reject) => {
            // Normalizar caminhos para Windows
            const normalizedExcelPath = path.resolve(excelPath);
            const normalizedScriptPath = path.resolve(scriptPath);
            
            // Comando Python
            const command = `python "${normalizedScriptPath}" "${normalizedExcelPath}"`;
            
            logger.info('🔧 Executando script HTML NATIVO', { 
                comando: command
            });
            
            exec(command, { 
                timeout: 90000, // 1.5 minutos timeout
                cwd: path.dirname(normalizedScriptPath),
                encoding: 'utf8',
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer para HTML grande
            }, (error, stdout, stderr) => {
                
                logger.info('📝 Saída do HTML NATIVO', { 
                    temStdout: !!stdout,
                    tamanhoStdout: stdout?.length || 0,
                    temStderr: !!stderr,
                    temError: !!error
                });
                
                if (error) {
                    reject(new Error(`Erro execução HTML NATIVO: ${error.message}`));
                    return;
                }
                
                if (stderr && !stdout.includes('SUCCESS')) {
                    reject(new Error(`Erro HTML NATIVO stderr: ${stderr}`));
                    return;
                }
                
                // Verificar se foi bem-sucedido
                if (stdout.includes('SUCCESS:')) {
                    const nativeHtml = stdout.split('SUCCESS:')[1];
                    
                    resolve({
                        success: true,
                        nativeHtml: nativeHtml
                    });
                } else {
                    reject(new Error(`HTML NATIVO falhou: ${stdout || stderr || 'Erro desconhecido'}`));
                }
            });
        });
    }

    // Método para usar o HTML EXATAMENTE como o Excel gerou
    // Retorna { html, inlineImages: [{cid, filename, contentBytes, contentType}] }
    generateEmailWithNativeHtml(grupo, nativeHtml) {
        const logger = require('../utils/logger');
        // Processar para remover metadados e preservar conteúdo
        let processedHtml = nativeHtml;

        // Remover metadados do Windows clipboard (StartHTML/Version/Fragment markers)
        if (processedHtml.includes('StartHTML:') || processedHtml.includes('Version:')) {
            const htmlStartMatch = processedHtml.match(/<html[^>]*>/i);
            if (htmlStartMatch) {
                const htmlStartPos = processedHtml.indexOf(htmlStartMatch[0]);
                processedHtml = processedHtml.substring(htmlStartPos);
            } else {
                const tableStartMatch = processedHtml.match(/<table[^>]*>/i);
                if (tableStartMatch) {
                    const tableStartPos = processedHtml.indexOf(tableStartMatch[0]);
                    processedHtml = processedHtml.substring(tableStartPos);
                }
            }
        }

        // Limpar metadados restantes
        processedHtml = processedHtml.replace(/Version:[\d\.]+\s*/g, '');
        processedHtml = processedHtml.replace(/StartHTML:\d+\s*/g, '');
        processedHtml = processedHtml.replace(/EndHTML:\d+\s*/g, '');
        processedHtml = processedHtml.replace(/StartFragment:\d+\s*/g, '');
        processedHtml = processedHtml.replace(/EndFragment:\d+\s*/g, '');
        processedHtml = processedHtml.replace(/SourceURL:.*?\s*/g, '');

        // Small set of safe replacements for common mojibake patterns
        processedHtml = processedHtml.replace(/C\?digo/g, 'Código');
        processedHtml = processedHtml.replace(/Raz\?o/g, 'Razão');
        processedHtml = processedHtml.replace(/Sa\?da/g, 'Saída');

        // Collect inline images (data:image/*;base64,...) and convert them to attachments
        const inlineImages = [];
        try {
            const imgRegex = /<img[^>]*src=["'](data:image\/[a-zA-Z]+;base64,([^"']+))["'][^>]*>/g;
            let match;
            let idx = 0;
            while ((match = imgRegex.exec(processedHtml)) !== null) {
                const fullDataUri = match[1];
                const base64Data = match[2];
                const mimeMatch = fullDataUri.match(/^data:(image\/[a-zA-Z]+);base64,/);
                const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
                const cid = `img_${Date.now()}_${idx}`;
                const filename = `image_${idx}.${mimeType.split('/')[1]}`;

                inlineImages.push({ cid, filename, contentBytes: base64Data, contentType: mimeType });

                // Replace the data URI src with cid reference
                processedHtml = processedHtml.replace(fullDataUri, `cid:${cid}`);
                idx++;
            }
        } catch (err) {
            logger.warn('Erro ao extrair imagens inline do HTML', { erro: err.message });
        }

        // Build wrapper HTML and return
        const wrapper = `
            <div style="font-family: Arial, sans-serif; width: 100%; overflow-x: auto; position: relative; margin: 0; padding: 0;">
                <p style="margin: 0 0 5px 0; padding: 0;">Equipe, boa tarde!</p>
                <p style="margin: 0 0 5px 0; padding: 0;">Encaminho abaixo as informações referentes à Entrada de Cliente para ciência e acompanhamento:</p>
                <div style="width: 100%; overflow-x: auto; position: relative; margin: 0; padding: 0; line-height: 1;">
                    ${processedHtml}
                </div>
            </div>
        `.trim();

        return { html: wrapper, inlineImages };
    }
}

module.exports = new ExcelNativeHtmlService();
