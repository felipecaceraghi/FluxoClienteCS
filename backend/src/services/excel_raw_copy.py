
import sys
import xlwings as xw
import win32clipboard
import time

def get_raw_excel_content(excel_file_path):
    try:
        print("Abrindo Excel para copy RAW...")
        
        # Abrir Excel (invisível)
        app = xw.App(visible=False)
        
        try:
            # Abrir arquivo
            wb = app.books.open(excel_file_path)
            
            # Selecionar primeira planilha
            ws = wb.sheets[0]
            
            # Encontrar intervalo usado
            used_range = ws.used_range
            
            if used_range is None:
                return {"success": False, "error": "Planilha vazia"}
            
            print(f"Copiando intervalo: {used_range.address}")
            
            # Selecionar e copiar o intervalo COMPLETO
            used_range.select()
            used_range.copy()
            
            # Aguardar para garantir que foi copiado
            time.sleep(2)
            
            # Obter conteúdo RAW da área de transferência
            win32clipboard.OpenClipboard()
            try:
                # Constantes para formatos de clipboard
                CF_TEXT = 1
                CF_UNICODETEXT = 13
                
                formats = []
                
                # Formato HTML (registrar primeiro)
                try:
                    html_format = win32clipboard.RegisterClipboardFormat("HTML Format")
                    if win32clipboard.IsClipboardFormatAvailable(html_format):
                        html_data = win32clipboard.GetClipboardData(html_format)
                        if html_data:
                            formats.append(("HTML", str(html_data)))
                except Exception as e:
                    print(f"Erro ao obter HTML: {e}")
                
                # Formato RTF
                try:
                    rtf_format = win32clipboard.RegisterClipboardFormat("Rich Text Format")
                    if win32clipboard.IsClipboardFormatAvailable(rtf_format):
                        rtf_data = win32clipboard.GetClipboardData(rtf_format)
                        if rtf_data:
                            formats.append(("RTF", str(rtf_data)))
                except Exception as e:
                    print(f"Erro ao obter RTF: {e}")
                
                # Formato texto Unicode
                try:
                    if win32clipboard.IsClipboardFormatAvailable(CF_UNICODETEXT):
                        text_data = win32clipboard.GetClipboardData(CF_UNICODETEXT)
                        if text_data:
                            formats.append(("TEXT", str(text_data)))
                except Exception as e:
                    print(f"Erro ao obter TEXT: {e}")
                
                # Formato texto simples
                try:
                    if win32clipboard.IsClipboardFormatAvailable(CF_TEXT):
                        text_data = win32clipboard.GetClipboardData(CF_TEXT)
                        if text_data:
                            formats.append(("ANSI", str(text_data)))
                except Exception as e:
                    print(f"Erro ao obter ANSI: {e}")
                
                if formats:
                    # Priorizar HTML se disponível, senão texto
                    best_format = formats[0]
                    for fmt_name, fmt_data in formats:
                        if fmt_name == "HTML":
                            best_format = (fmt_name, fmt_data)
                            break
                        elif fmt_name == "TEXT" and best_format[0] not in ["HTML"]:
                            best_format = (fmt_name, fmt_data)
                    
                    print(f"Formato escolhido: {best_format[0]}")
                    print(f"Tamanho dos dados: {len(best_format[1])}")
                    
                    return {
                        "success": True, 
                        "rawContent": best_format[1],
                        "format": best_format[0],
                        "availableFormats": [f[0] for f in formats]
                    }
                else:
                    return {"success": False, "error": "Nenhum formato válido na área de transferência"}
                    
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
        print("ERRO: Uso correto: python excel_raw_copy.py <caminho_arquivo>")
        sys.exit(1)
    
    excel_file = sys.argv[1]
    result = get_raw_excel_content(excel_file)
    
    if result["success"]:
        print(f"SUCCESS:{result['rawContent']}")
    else:
        print(f"ERROR:{result['error']}")
