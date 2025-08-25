
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
