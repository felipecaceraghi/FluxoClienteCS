import sys
import requests
import json
from datetime import datetime
import xlwings as xw
import os
import tempfile
import base64
import re

# É necessário instalar a biblioteca BeautifulSoup4: pip install beautifulsoup4
from bs4 import BeautifulSoup

# É necessário instalar a biblioteca pywin32: pip install pywin32
import win32clipboard

# Configurar encoding UTF-8 para saída
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# Configurações do Microsoft Graph (mesmas do sistema atual)
CONFIG = {
    "client_id": "de286ff7-cc71-4a79-90c3-c04b61e3b948",
    "client_secret": os.getenv('AZURE_CLIENT_SECRET', 'YOUR_CLIENT_SECRET_HERE'),
    "tenant_id": "520c4df2-db46-4fdd-b833-6a96df9215bf",
    "sender_email": "notificacaogf@gofurthergroup.com.br",
    "authority": "https://login.microsoftonline.com/520c4df2-db46-4fdd-b833-6a96df9215bf",
    "token_url": "https://login.microsoftonline.com/520c4df2-db46-4fdd-b833-6a96df9215bf/oauth2/v2.0/token",
    "graph_url": "https://graph.microsoft.com/v1.0"
}


def get_access_token(config):
    """Obtém o token de acesso da API Microsoft Graph"""
    data = {
        'client_id': config['client_id'],
        'client_secret': config['client_secret'],
        'scope': 'https://graph.microsoft.com/.default',
        'grant_type': 'client_credentials'
    }
    try:
        response = requests.post(config['token_url'], data=data)
        response.raise_for_status()
        print("   -> Token obtido com sucesso.")
        return response.json()['access_token']
    except Exception as e:
        print(f"❌ Erro ao obter token: {e}")
        return None


def extract_excel_data(excel_file_path):
    """Extrai dados da planilha Excel e retorna HTML formatado"""
    try:
        print("📊 Extraindo dados da planilha Excel...")
        print(f"   -> Arquivo: {excel_file_path}")
        print(f"   -> Arquivo existe: {os.path.exists(excel_file_path)}")

        # Verificar se o arquivo existe
        if not os.path.exists(excel_file_path):
            print(f"   -> ERRO: Arquivo não encontrado: {excel_file_path}")
            return {"success": False, "error": f"Arquivo não encontrado: {excel_file_path}"}

        print("   -> Arquivo encontrado, abrindo com xlwings...")

        # Abrir Excel com xlwings
        app = xw.App(visible=False, add_book=False)
        app.display_alerts = False

        print("   -> Aplicação Excel iniciada")

        wb = app.books.open(excel_file_path)
        sheet = wb.sheets[0]

        print("   -> Planilha aberta")

        # Determinar o último linha usada
        last_row = sheet.used_range.last_cell.row
        target_range = sheet.range(f'A1:L{last_row}')

        print(f"   -> Copiando o range da tabela: A1:L{last_row}")
        target_range.copy()

        print("   -> Range copiado para clipboard")

        # Obter dados do clipboard
        print("   -> Abrindo clipboard...")
        win32clipboard.OpenClipboard()
        try:
            CF_HTML = win32clipboard.RegisterClipboardFormat("HTML Format")
            print(f"   -> Formato HTML registrado: {CF_HTML}")

            if win32clipboard.IsClipboardFormatAvailable(CF_HTML):
                print("   -> Formato HTML disponível no clipboard")
                raw_html_from_excel = win32clipboard.GetClipboardData(CF_HTML).decode('utf-8', errors='ignore')
                print(f"   -> HTML obtido do clipboard, tamanho: {len(raw_html_from_excel)} caracteres")
            else:
                print("   -> ERRO: Formato HTML não encontrado no clipboard")
                raise RuntimeError("Formato HTML não encontrado no clipboard.")
        finally:
            win32clipboard.CloseClipboard()
            print("   -> Clipboard fechado")

        # Fechar Excel
        wb.close()
        app.quit()
        print("   -> Instância do Excel fechada.")

        # Processar HTML
        print("   -> Processando HTML...")
        soup = BeautifulSoup(raw_html_from_excel, 'html.parser')

        # Remover imagens quebradas
        broken_images_found = 0
        for img_tag in soup.find_all('img'):
            img_tag.decompose()
            broken_images_found += 1

        if broken_images_found > 0:
            print(f"   -> {broken_images_found} referência(s) de imagem quebrada removida(s).")

        # Processar CSS inline
        style_tag = soup.find('style')
        if style_tag and style_tag.string:
            css_rules = {m.group(1): m.group(2).strip().replace('"', "'") for m in re.finditer(r'\.([a-zA-Z0-9_-]+)\s*\{([^}]+)\}', style_tag.string)}
            if css_rules:
                for tag in soup.find_all(class_=True):
                    s = tag.get('style', '')
                    tag['style'] = s + (';' if s else '') + ';'.join([css_rules[cn] for cn in tag['class'] if cn in css_rules])

        # Remover tag style após processar
        if style_tag:
            style_tag.decompose()

        # Encontrar e formatar tabela
        table = soup.find('table')
        if table:
            table['style'] = 'border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11px; width: 100%; margin: 10px 0;'

            # Estilizar cabeçalhos
            headers = table.find_all(['td', 'th'])[:12] if table.find_all(['td', 'th']) else []
            for header in headers:
                current_style = header.get('style', '')
                header['style'] = current_style + (';' if current_style else '') + 'border: 1px solid #666; padding: 8px; text-align: center; background-color: #f0f0f0; font-weight: bold;'

            # Estilizar células de dados
            rows = table.find_all('tr')[1:] if len(table.find_all('tr')) > 1 else []
            for row in rows:
                cells = row.find_all(['td', 'th'])
                for cell in cells:
                    current_style = cell.get('style', '')
                    cell['style'] = current_style + (';' if current_style else '') + 'border: 1px solid #ccc; padding: 6px; vertical-align: top;'

            final_html = str(table)
        else:
            final_html = str(soup)

        print(f"   -> HTML processado, tamanho final: {len(final_html)} caracteres")

        return {
            "success": True,
            "clipboardData": final_html,
            "range": f"A1:L{last_row}",
            "format": "html",
            "method": "xlwings_win32clipboard"
        }

    except Exception as e:
        import traceback
        print(f"❌ ERRO na extração: {str(e)}")
        print("   -> Traceback completo:")
        traceback.print_exc()
        return {"success": False, "error": str(e)}


def send_email(to_email, subject, grupo, excel_file_path, additional_message=None):
    """Envia email com dados da planilha extraídos"""
    try:
        print(f"📧 Preparando envio de email para {to_email}...")

        # Extrair dados da planilha
        extraction_result = extract_excel_data(excel_file_path)
        if not extraction_result["success"]:
            return {"success": False, "error": extraction_result["error"]}

        # Obter token de acesso
        print("🔑 Obtendo token de acesso...")
        token = get_access_token(CONFIG)
        if not token:
            return {"success": False, "error": "Falha ao obter token de acesso"}

        # Preparar corpo do email
        if additional_message is None:
            additional_message = f"""
            <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
                Equipe, boa tarde!
            </p>
            <p style="color: #374151; line-height: 1.6; margin: 0 0 25px 0;">
                Encaminho abaixo as informações da ficha de entrada do cliente <strong>{grupo}</strong> para ciência e acompanhamento:
            </p>
            """

        body_html = f"""
        <html>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 1000px; margin: 0 auto;">
            <div style="background: white; padding: 20px; border-radius: 8px;">
                {additional_message}
                <div style="margin: 25px 0; overflow-x: auto;">
                    {extraction_result["clipboardData"]}
                </div>
                <p style="color: #6b7280; font-size: 12px; margin: 20px 0 0 0; font-style: italic;">
                    * Dados copiados diretamente da planilha Excel
                </p>
                <p style="color: #9ca3af; font-size: 10px; margin: 10px 0 0 0;">
                    E-mail gerado em {datetime.now().strftime('%d/%m/%Y %H:%M')}
                </p>
            </div>
        </body>
        </html>
        """

        # Preparar dados do email
        email_data = {{
            "message": {{
                "subject": subject,
                "body": {{
                    "contentType": "HTML",
                    "content": body_html
                }},
                "toRecipients": [{{
                    "emailAddress": {{
                        "address": to_email
                    }}
                }}]
            }}
        }}

        # Enviar email
        send_url = f"{CONFIG['graph_url']}/users/{CONFIG['sender_email']}/sendMail"
        print(f"✉️ Enviando email para {to_email}...")

        response = requests.post(
            send_url,
            headers={{
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }},
            json=email_data
        )

        response.raise_for_status()
        print("✅ Email enviado com sucesso!")

        return {{
            "success": True,
            "message": "Email enviado com sucesso",
            "recipient": to_email,
            "subject": subject,
            "dataExtracted": len(extraction_result["clipboardData"])
        }}

    except Exception as e:
        print(f"❌ Erro no envio do email: {e}")
        return {"success": False, "error": str(e)}


def main():
    """Função principal que pode ser chamada de diferentes formas"""
    if len(sys.argv) < 2:
        print("❌ Uso incorreto. Use:")
        print("   python excel_copy_paste.py <caminho_planilha> [modo] [parametros...]")
        print("")
        print("Modos disponíveis:")
        print("   extract    - Apenas extrair dados da planilha")
        print("   send       - Extrair dados e enviar email")
        print("")
        print("Exemplos:")
        print("   python excel_copy_paste.py planilha.xlsx extract")
        print("   python excel_copy_paste.py planilha.xlsx send email@exemplo.com 'Assunto' 'Grupo'")
        sys.exit(1)

    excel_path = sys.argv[1]

    if len(sys.argv) == 2 or (len(sys.argv) >= 3 and sys.argv[2] == "extract"):
        # Modo: apenas extrair dados
        result = extract_excel_data(excel_path)
        if result["success"]:
            print(f"SUCCESS:{result['clipboardData']}")
        else:
            print(f"ERROR:{result['error']}")

    elif len(sys.argv) >= 6 and sys.argv[2] == "send":
        # Modo: extrair e enviar email
        to_email = sys.argv[3]
        subject = sys.argv[4]
        grupo = sys.argv[5]
        additional_message = sys.argv[6] if len(sys.argv) > 6 else None

        result = send_email(to_email, subject, grupo, excel_path, additional_message)

        if result["success"]:
            print(f"SUCCESS_EMAIL:{json.dumps(result)}")
        else:
            print(f"ERROR_EMAIL:{result['error']}")

    else:
        print("❌ Modo não reconhecido ou parâmetros insuficientes")
        sys.exit(1)


if __name__ == "__main__":
    main()
