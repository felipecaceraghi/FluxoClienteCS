# SharePoint Sync - Jobs de Sincronização

## ✅ Implementado

### Job de Sincronização a cada 15 minutos
- ✅ Download automático da planilha do SharePoint
- ✅ Logs de todas as operações
- ✅ Limpeza automática de arquivos antigos (7 dias)
- ✅ Tratamento de erros robusto

## 🔧 Configuração

### Variáveis de Ambiente (.env)
```env
# SharePoint para sincronização de dados
SHAREPOINT_CLIENT_ID=sua_client_id_aqui
SHAREPOINT_CLIENT_SECRET=seu_client_secret_aqui
SHAREPOINT_TENANT_ID=seu_tenant_id_aqui
SHAREPOINT_FILE_URL=sua_sharepoint_file_url_aqui
```

## 🧪 Endpoints para Testes

### 1. Status do Scheduler
```http
GET http://localhost:3001/api/sync/status
Authorization: Bearer seu_token_jwt
```

**Resposta:**
```json
{
    "success": true,
    "data": {
        "scheduler": {
            "isRunning": true,
            "totalJobs": 2,
            "jobs": [
                {"name": "sharepoint-sync", "running": true},
                {"name": "file-cleanup", "running": true}
            ]
        },
        "stats": {
            "lastSync": {
                "status": "DOWNLOAD_SUCCESS",
                "createdAt": "2025-08-20T20:30:00.000Z"
            },
            "stats": {
                "total": 5,
                "sucessos": 4,
                "erros": 1,
                "ultimaSincronizacao": "2025-08-20T20:30:00.000Z"
            }
        }
    }
}
```

### 2. Executar Sincronização Manual
```http
POST http://localhost:3001/api/sync/sync
Authorization: Bearer seu_token_jwt
```

### 3. Histórico de Sincronizações
```http
GET http://localhost:3001/api/sync/sync-history?limit=5&offset=0
Authorization: Bearer seu_token_jwt
```

### 4. Teste de Download (Desenvolvimento)
```http
POST http://localhost:3001/api/sync/test-download
Authorization: Bearer seu_token_jwt
```

## 📊 Jobs Configurados

### 1. **sharepoint-sync**
- **Frequência:** A cada 15 minutos (`*/15 * * * *`)
- **Função:** Baixar planilha do SharePoint
- **Local:** `src/storage/sharepoint-files/`

### 2. **file-cleanup**
- **Frequência:** Diariamente às 2h (`0 2 * * *`)
- **Função:** Remover arquivos com mais de 7 dias

## 🗂️ Estrutura de Arquivos

```
src/storage/sharepoint-files/
├── .gitkeep
└── Cadastro_de_Clientes_2025-08-20T20-30-00-000Z.xlsm
```

## 📝 Logs de Sincronização

Todos os jobs são registrados na tabela `sync_logs`:

```sql
CREATE TABLE sync_logs (
    id TEXT PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,        -- 'SHAREPOINT_DOWNLOAD'
    status VARCHAR(20) NOT NULL,      -- 'DOWNLOAD_SUCCESS', 'ERROR'
    registros_processados INTEGER,
    registros_novos INTEGER,
    registros_atualizados INTEGER,
    erro_detalhes TEXT,              -- JSON com detalhes do erro
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🎯 Próximos Passos

1. ✅ **Job de download** - Implementado
2. ⏳ **Processar arquivo Excel** - Próxima etapa
3. ⏳ **Mapear dados para tabela companies** - Próxima etapa
4. ⏳ **Sincronização incremental** - Futuro

## 🚀 Como Funciona

1. **Servidor inicia** → Scheduler é iniciado automaticamente
2. **A cada 15 min** → Job executa download da planilha
3. **Download bem-sucedido** → Arquivo salvo com timestamp
4. **Logs criados** → Tudo registrado na base de dados
5. **Arquivos antigos** → Removidos automaticamente após 7 dias

## 🔍 Monitoramento

- Logs detalhados no console
- Registros na base de dados
- Endpoints para monitoramento via API
- Tratamento de erros robusto
