import sys
import requests
import json
from datetime import datetime
import xlwings as xw
import os
import re
import base64
import traceback
import dotenv
import time  # RE-ADICIONADO: Para a lógica de repetição

dotenv.load_dotenv()  # Carrega variáveis de ambiente do arquivo .env

# É necessário instalar as bibliotecas:
# pip install beautifulsoup4 pywin32 xlwings requests python-dotenv
from bs4 import BeautifulSoup
import win32clipboard  # RE-ADICIONADO: Para usar a área de transferência

# Configurar encoding UTF-8 para garantir a compatibilidade de caracteres
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# Configurações do Microsoft Graph
CONFIG = {
    "client_id": os.getenv("GRAPH_CLIENT_ID"),
    "client_secret": os.getenv("GRAPH_CLIENT_SECRET"),
    "tenant_id": os.getenv("GRAPH_TENANT_ID"),
    "sender_email": os.getenv("EMAIL_SENDER"),
    "token_url": f"https://login.microsoftonline.com/{os.getenv('GRAPH_TENANT_ID')}/oauth2/v2.0/token",
    "graph_url": "https://graph.microsoft.com/v1.0"
}


def get_formatted_html_from_excel(excel_path):
    """
    ALTERADO: Extrai e formata o HTML da planilha usando a área de transferência,
    com lógica de repetição para maior estabilidade.
    """
    app, wb = None, None
    try:
        print("INFO: Iniciando extração do Excel via clipboard...")
        if not os.path.exists(excel_path):
            raise FileNotFoundError(f"Arquivo Excel não encontrado: {excel_path}")

        app = xw.App(visible=False, add_book=False)
        app.display_alerts = False
        wb = app.books.open(excel_path)
        sheet = wb.sheets[0]
        last_row = sheet.used_range.last_cell.row
        target_range = sheet.range(f'A1:L{last_row}')
        target_range.copy()
        
        # NOVO: Tenta abrir o clipboard várias vezes para evitar erro de "Acesso Negado"
        retries = 5
        delay = 0.5  # 500ms
        for i in range(retries):
            try:
                win32clipboard.OpenClipboard()
                break  # Se funcionou, sai do loop
            except Exception as e:
                # Verifica se o erro é de acesso negado e se ainda há tentativas
                if "Acesso negado" in str(e) and i < retries - 1:
                    print(f"WARN: Acesso ao clipboard negado. Tentando novamente em {delay}s... ({i+1}/{retries})", file=sys.stderr)
                    time.sleep(delay)
                else:
                    raise e  # Se não for o erro esperado ou se for a última tentativa, levanta a exceção

        try:
            CF_HTML = win32clipboard.RegisterClipboardFormat("HTML Format")
            if not win32clipboard.IsClipboardFormatAvailable(CF_HTML):
                raise RuntimeError("Formato HTML não encontrado no clipboard.")
            raw_html = win32clipboard.GetClipboardData(CF_HTML).decode('utf-8', errors='ignore')
        finally:
            win32clipboard.CloseClipboard()

        soup = BeautifulSoup(raw_html, 'html.parser')
        
        # NOVO: Injeta o CSS das classes como estilo inline para manter a formatação
        style_tag = soup.find('style')
        if style_tag and style_tag.string:
            # Extrai as regras de CSS do <style> tag
            css_rules = {m.group(1): m.group(2).strip() for m in re.finditer(r'\.([a-zA-Z0-9_-]+)\s*\{([^}]+)\}', style_tag.string)}
            if css_rules:
                # Aplica as regras de CSS em cada tag que tem uma classe
                for tag in soup.find_all(class_=True):
                    s = tag.get('style', '')
                    inline_style = ';'.join([css_rules[cn] for cn in tag['class'] if cn in css_rules])
                    if inline_style:
                         tag['style'] = s + (';' if s else '') + inline_style

        # Remove tags de imagem desnecessárias que o Excel pode exportar
        for img_tag in soup.find_all('img'):
            img_tag.decompose()

        table = soup.find('table')
        if not table:
            raise ValueError("Nenhuma tabela foi encontrada no HTML copiado do Excel.")

        print("INFO: Extração e formatação do HTML concluídas.")
        return str(table)

    finally:
        if wb: wb.close()
        if app: app.quit()


def run_complete_process(excel_path, image_path, recipient, subject, message):
    """
    Função principal que executa todo o fluxo: extrai, formata, injeta a imagem e envia.
    """
    # 1. Extrair e formatar a tabela do Excel
    table_html = get_formatted_html_from_excel(excel_path)

    # 2. Carregar e codificar a imagem local
    print(f"INFO: Carregando imagem local: '{image_path}'...")
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Arquivo de imagem não encontrado: {image_path}")
    with open(image_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    image_html_tag = f'<img src="data:image/png;base64,{encoded_string}" alt="Imagem" style="width:115%; height:auto;" />'

    # 3. Injetar a imagem na célula C3
    print("INFO: Injetando imagem na célula C3...")
    soup = BeautifulSoup(table_html, 'html.parser')
    table = soup
    if table:
        rows = table.find_all('tr')
        if len(rows) >= 3:  # Linha 3
            cells = rows[2].find_all(['td', 'th'])
            if len(cells) >= 3:  # Coluna C
                cells[2].clear()
                cells[2].append(BeautifulSoup(image_html_tag, 'html.parser'))

    final_html = str(soup)

    # 4. Obter token de acesso
    print("INFO: Obtendo token de acesso...")
    data = {'client_id': CONFIG['client_id'], 'client_secret': CONFIG['client_secret'], 'scope': 'https://graph.microsoft.com/.default', 'grant_type': 'client_credentials'}
    response = requests.post(CONFIG['token_url'], data=data)
    response.raise_for_status()
    token = response.json()['access_token']

    # 5. Montar o corpo do e-mail
    body_html = f"""
    <html><body>
        <p style="font-family: Arial, sans-serif;">{message}</p><br>
        {final_html}
        <br>
        <p style="font-family: Arial, sans-serif; font-size: 10px; color: #999;">E-mail gerado em {datetime.now().strftime('%d/%m/%Y %H:%M')}.</p>
    </body></html>
    """

    email_data = {
        "message": {
            "subject": subject,
            "body": {"contentType": "HTML", "content": body_html},
            "toRecipients": [{"emailAddress": {"address": recipient}}]
        }
    }

    # 6. Enviar o e-mail
    print(f"INFO: Enviando e-mail para {recipient}...")
    send_url = f"{CONFIG['graph_url']}/users/{CONFIG['sender_email']}/sendMail"
    response = requests.post(
        send_url,
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
        json=email_data
    )
    response.raise_for_status()

if __name__ == "__main__":
    try:
        if len(sys.argv) != 6:
            raise ValueError(f"Número incorreto de argumentos. Esperado 5, recebido {len(sys.argv) - 1}.")

        run_complete_process(
            excel_path=sys.argv[1],
            image_path=sys.argv[2],
            recipient=sys.argv[3],
            subject=sys.argv[4],
            message=sys.argv[5]
        )
        
        print("SUCCESS:E-mail enviado com sucesso.")

    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)


