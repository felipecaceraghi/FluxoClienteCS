
import sys
import xlwings as xw
import pyperclip
import pandas as pd

def copy_excel_range(excel_file_path):
    try:
        print("Abrindo Excel com xlwings...")
        
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
            
            print(f"Intervalo usado: {used_range.address}")
            
            # Copiar intervalo para área de transferência
            used_range.copy()
            
            # Aguardar um pouco para garantir que foi copiado
            import time
            time.sleep(1)
            
            # Obter dados da área de transferência
            try:
                clipboard_content = pyperclip.paste()
                print(f"Conteúdo copiado: {len(clipboard_content)} caracteres")
                
                return {
                    "success": True, 
                    "clipboardData": clipboard_content,
                    "range": used_range.address
                }
            except Exception as clip_error:
                print(f"Erro ao ler área de transferência: {clip_error}")
                
                # Alternativa: ler dados diretamente
                values = used_range.value
                if isinstance(values, list):
                    # Converter para formato tabular
                    clipboard_content = ""
                    for row in values:
                        if isinstance(row, list):
                            clipboard_content += "\t".join(str(cell) if cell is not None else "" for cell in row) + "\n"
                        else:
                            clipboard_content += str(row) + "\n"
                else:
                    clipboard_content = str(values)
                
                return {
                    "success": True, 
                    "clipboardData": clipboard_content,
                    "range": used_range.address
                }
                
        finally:
            # Fechar arquivo e Excel
            wb.close()
            app.quit()
            
    except Exception as e:
        print(f"ERRO: {str(e)}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("ERRO: Uso correto: python excel_copy_paste.py <caminho_arquivo>")
        sys.exit(1)
    
    excel_file = sys.argv[1]
    result = copy_excel_range(excel_file)
    
    if result["success"]:
        print(f"SUCCESS:{result['clipboardData']}")
    else:
        print(f"ERROR:{result['error']}")
