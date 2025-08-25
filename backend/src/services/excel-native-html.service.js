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
                                native_html = html_data.decode('utf-8', errors='ignore')
                            else:
                                native_html = str(html_data)
                            print(f"HTML Format obtido: {len(native_html)} caracteres")
                                
                except Exception as e:
                    print(f"Erro HTML Format: {e}")
                
                # Se não conseguiu HTML, tentar outros formatos
                if not native_html:
                    try:
                        CF_UNICODETEXT = 13
                        if win32clipboard.IsClipboardFormatAvailable(CF_UNICODETEXT):
                            text_data = win32clipboard.GetClipboardData(CF_UNICODETEXT)
                            if text_data:
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
    generateEmailWithNativeHtml(grupo, nativeHtml) {
        // Processar para remover metadados e corrigir encoding
        let processedHtml = nativeHtml;
        
        // Remover TODOS os metadados do Windows clipboard
        if (processedHtml.includes('StartHTML:') || processedHtml.includes('Version:')) {
            // Encontrar o início do HTML real (após todos os metadados)
            const htmlStartMatch = processedHtml.match(/<html[^>]*>/i);
            if (htmlStartMatch) {
                const htmlStartPos = processedHtml.indexOf(htmlStartMatch[0]);
                processedHtml = processedHtml.substring(htmlStartPos);
            } else {
                // Se não encontrar <html>, procurar por <table>
                const tableStartMatch = processedHtml.match(/<table[^>]*>/i);
                if (tableStartMatch) {
                    const tableStartPos = processedHtml.indexOf(tableStartMatch[0]);
                    processedHtml = processedHtml.substring(tableStartPos);
                }
            }
        }
        
        // Limpar completamente qualquer metadado restante
        processedHtml = processedHtml.replace(/Version:[\d\.]+\s*/g, '');
        processedHtml = processedHtml.replace(/StartHTML:\d+\s*/g, '');
        processedHtml = processedHtml.replace(/EndHTML:\d+\s*/g, '');
        processedHtml = processedHtml.replace(/StartFragment:\d+\s*/g, '');
        processedHtml = processedHtml.replace(/EndFragment:\d+\s*/g, '');
        processedHtml = processedHtml.replace(/SourceURL:.*?\s*/g, '');
        
        // Corrigir encoding de caracteres especiais
        processedHtml = processedHtml.replace(/C�digo/g, 'Código');
        processedHtml = processedHtml.replace(/Vig�ncia/g, 'Vigência');
        processedHtml = processedHtml.replace(/Raz�o/g, 'Razão');
        processedHtml = processedHtml.replace(/Servi�os/g, 'Serviços');
        processedHtml = processedHtml.replace(/Servi�o/g, 'Serviço');
        processedHtml = processedHtml.replace(/Neg�cio/g, 'Negócio');
        processedHtml = processedHtml.replace(/Tribut�rio/g, 'Tributário');
        processedHtml = processedHtml.replace(/Sa�da/g, 'Saída');
        processedHtml = processedHtml.replace(/Funcion�rios/g, 'Funcionários');
        processedHtml = processedHtml.replace(/Pr�-Labore/g, 'Pró-Labore');
        processedHtml = processedHtml.replace(/Estagi�rios/g, 'Estagiários');
        processedHtml = processedHtml.replace(/Aut�nomos/g, 'Autônomos');
        processedHtml = processedHtml.replace(/Dom�sticas/g, 'Domésticas');
        processedHtml = processedHtml.replace(/Cont�bil/g, 'Contábil');
        processedHtml = processedHtml.replace(/Haver�/g, 'Haverá');
        processedHtml = processedHtml.replace(/Cobran�a/g, 'Cobrança');
        processedHtml = processedHtml.replace(/Implanta��o/g, 'Implantação');
        processedHtml = processedHtml.replace(/honor�rio/g, 'honorário');
        processedHtml = processedHtml.replace(/�teis/g, 'úteis');
        processedHtml = processedHtml.replace(/Dom�nio/g, 'Domínio');
        processedHtml = processedHtml.replace(/N�o/g, 'Não');
        
        // CORREÇÕES ESPECÍFICAS PARA CERTIDÃO
        processedHtml = processedHtml.replace(/Certidço/g, 'Certidao Negativa');
        processedHtml = processedHtml.replace(/Certidðão/g, 'Certidao Negativa');
        processedHtml = processedHtml.replace(/Certidçao/g, 'Certidao Negativa');
        processedHtml = processedHtml.replace(/Certid[aã]o/g, 'Certidao Negativa');
        processedHtml = processedHtml.replace(/Negativ[aãà]/g, 'Negativa');
        
        // Corrigir caracteres especiais problemáticos
        processedHtml = processedHtml.replace(/��/g, '  '); // Espaços especiais
        processedHtml = processedHtml.replace(/�/g, 'ç'); // Cedilha
        processedHtml = processedHtml.replace(/�/g, 'ã'); // Til em a
        processedHtml = processedHtml.replace(/�/g, 'õ'); // Til em o
        processedHtml = processedHtml.replace(/�/g, 'á'); // Acento agudo em a
        processedHtml = processedHtml.replace(/�/g, 'é'); // Acento agudo em e
        processedHtml = processedHtml.replace(/�/g, 'í'); // Acento agudo em i
        processedHtml = processedHtml.replace(/�/g, 'ó'); // Acento agudo em o
        processedHtml = processedHtml.replace(/�/g, 'ú'); // Acento agudo em u
        processedHtml = processedHtml.replace(/�/g, 'à'); // Acento grave em a
        processedHtml = processedHtml.replace(/�/g, 'è'); // Acento grave em e
        processedHtml = processedHtml.replace(/�/g, 'ê'); // Acento circunflexo em e
        processedHtml = processedHtml.replace(/�/g, 'â'); // Acento circunflexo em a
        processedHtml = processedHtml.replace(/�/g, 'ô'); // Acento circunflexo em o
        
        // Limpar espaços em branco excessivos
        processedHtml = processedHtml.replace(/\s+/g, ' ').trim();
        
        // Garantir formatação específica para "Novo cliente" (font-size: 25pt, negrito)
        processedHtml = processedHtml.replace(
            /(<[^>]*>)([^<]*Novo cliente[^<]*)/gi,
            (match, openTag, textContent) => {
                // Se o texto contém "Novo cliente", garantir que tenha o estilo correto
                if (textContent.includes('Novo cliente')) {
                    // Verificar se já tem estilo inline
                    if (openTag.includes('style=')) {
                        // Adicionar ou sobrescrever font-size e font-weight
                        let modifiedTag = openTag.replace(/font-size:\s*[^;]+;?/gi, '');
                        modifiedTag = modifiedTag.replace(/font-weight:\s*[^;]+;?/gi, '');
                        modifiedTag = modifiedTag.replace(/style="([^"]*)"/, 'style="$1; font-size: 25pt !important; font-weight: bold !important;"');
                        return modifiedTag + textContent;
                    } else {
                        // Adicionar estilo se não existir
                        const styledTag = openTag.replace(/(<[^>]+)/, '$1 style="font-size: 25pt !important; font-weight: bold !important;"');
                        return styledTag + textContent;
                    }
                }
                return match;
            }
        );
        
        // Aplicar estilo adicional para qualquer célula que contém "Novo cliente"
        processedHtml = processedHtml.replace(
            /(Novo cliente[^<]*)/gi,
            '<span style="font-size: 25pt !important; font-weight: bold !important;">$1</span>'
        );
        
        // Incluir imagem na posição EXATA baseada na estrutura do Excel
        let logoBase64 = '';
        try {
            const fs = require('fs');
            const path = require('path');
            const imagePath = path.join(__dirname, '../image.png');
            
            if (fs.existsSync(imagePath)) {
                const imageBuffer = fs.readFileSync(imagePath);
                logoBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
                logger.info('✅ Imagem carregada para email', { tamanho: imageBuffer.length });
            }
        } catch (error) {
            logger.warn('⚠️ Erro ao carregar imagem', { erro: error.message });
        }
        
        // Incluir imagem na posição EXATA: linha 3, coluna C (como na planilha)
        if (logoBase64 && processedHtml) {
            // A imagem está na linha 3, coluna C da planilha
            // Baseado no debug, a linha 3 tem height:60.0pt (onde colocamos a imagem no Excel)
            
            logger.info('🔍 Procurando pela linha com height:60.0pt (linha 3 do Excel)...');
            
            // Procurar pela linha que tem height:60.0pt (linha 3 onde está a imagem)
            const linha3Pattern = /<tr[^>]*height:60\.0pt[^>]*>(.*?)<\/tr>/s;
            const linha3Match = processedHtml.match(linha3Pattern);
            
            if (linha3Match) {
                logger.info('✅ Linha 3 encontrada (height:60.0pt)');
                
                // Extrair o conteúdo da linha
                const linha3Content = linha3Match[1];
                
                // Contar as células <td> e marcar a 3ª (coluna C) com um ID único
                let tdCount = 0;
                const linha3Modified = linha3Content.replace(/<td[^>]*>.*?<\/td>/g, (match) => {
                    tdCount++;
                    if (tdCount === 3) { // Terceira célula (coluna C)
                        logger.info('🎯 Marcando célula C3 para imagem e embutindo overlay');
                        return `<td id="logo-cell-c3" style="position: relative; text-align: center; vertical-align: top; padding: 0; margin: 0;">
                            <div style="position: absolute; left: 0; top: 0; width: 400px; height: 50px; margin: 0; padding: 0; line-height: 0;">
                                <img src="${logoBase64}" alt="Logo" style="display: block; width: 100%; height: 100%; margin: 0; padding: 0; border: 0;" />
                            </div>
                            <!-- célula mantida vazia visualmente, overlay embutido -->
                        </td>`;
                    }
                    return match;
                });
                
                // Substituir a linha completa no HTML
                const linha3CompleteModified = `<tr${linha3Match[0].match(/<tr([^>]*)>/)[1]}>${linha3Modified}</tr>`;
                processedHtml = processedHtml.replace(linha3Match[0], linha3CompleteModified);
                
                // A imagem foi embutida dentro da célula #logo-cell-c3, portanto não inserimos overlay externo
                logger.info('✅ Overlay embutido dentro de #logo-cell-c3 (sem inserção externa)');
            } else {
                // Fallback: procurar por qualquer linha com height=80 (altura da linha 3)
                logger.info('🔍 Procurando por linha com height=80...');
                const linha3AltPattern = /<tr[^>]*height=80[^>]*>(.*?)<\/tr>/s;
                const linha3AltMatch = processedHtml.match(linha3AltPattern);
                
                if (linha3AltMatch) {
                    logger.info('✅ Linha alternativa encontrada (height=80)');
                    
                    const linha3Content = linha3AltMatch[1];
                    let tdCount = 0;
                    const linha3Modified = linha3Content.replace(/<td[^>]*>.*?<\/td>/g, (match) => {
                        tdCount++;
                        if (tdCount === 3) { // Terceira célula (coluna C)
                            logger.info('🎯 Marcando célula C3 para imagem (fallback) e embutindo overlay');
                            return `<td id="logo-cell-c3" style="position: relative; text-align: center; vertical-align: top; padding: 0; margin: 0;">
                                <div style="position: absolute; left: 0; top: 0; width: 400px; height: 50px; margin: 0; padding: 0; line-height: 0;">
                                    <img src="${logoBase64}" alt="Logo" style="display: block; width: 100%; height: 100%; margin: 0; padding: 0; border: 0;" />
                                </div>
                                <!-- célula mantida vazia visualmente, overlay embutido -->
                            </td>`;
                        }
                        return match;
                    });
                    
                    const linha3CompleteModified = `<tr${linha3AltMatch[0].match(/<tr([^>]*)>/)[1]}>${linha3Modified}</tr>`;
                    processedHtml = processedHtml.replace(linha3AltMatch[0], linha3CompleteModified);
                    
                    // Inserir imagem DENTRO do container da tabela com posicionamento sobre célula C3 (fallback)
                    // Overlay embutido na célula #logo-cell-c3; não inserir overlay externo
                    logger.info('✅ Overlay embutido dentro de #logo-cell-c3 (fallback height=80)');
                } else {
                    // Último fallback: inserir imagem no container
                    logger.info('🔍 Usando último fallback: inserir imagem no container');
                    // Último fallback: tentar calcular top, senão usar 90px
                    // Último fallback: overlay deve ter sido embutido quando possível; nada a inserir externamente
                    logger.info('✅ Último fallback aplicado: overlay embutido quando possível');
                }
            }
        }
        
        return `
            <div style="font-family: Arial, sans-serif; width: 100%; overflow-x: auto; position: relative; margin: 0; padding: 0;">
                <p style="margin: 0 0 5px 0; padding: 0;">Equipe, boa tarde!</p>
                <p style="margin: 0 0 5px 0; padding: 0;">Encaminho abaixo as informações referentes à Entrada de Cliente para ciência e acompanhamento:</p>
                
                <!-- CONTEÚDO DO EXCEL COM IMAGEM NA POSIÇÃO ORIGINAL -->
                <div style="width: 100%; overflow-x: auto; position: relative; margin: 0; padding: 0; line-height: 1;">
                    ${processedHtml}
                </div>
                
            </div>
        `.trim();
    }
}

module.exports = new ExcelNativeHtmlService();
