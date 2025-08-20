# FluxoClienteCS - Backend

Backend em Node.js para o sistema FluxoClienteCS.

## Configuração Inicial

### 1. Instalar dependências
```bash
npm install
```

### 2. Inicializar banco SQLite
```bash
npm run init-db
```

Este comando irá:
- Criar o arquivo `fluxoclientecs.db` 
- Criar todas as tabelas necessárias
- Inserir dados iniciais (usuário admin e emails de exemplo)

### 3. Credenciais padrão
- **Email:** felipe.caceraghi@gofurthergroup.com.br
- **Senha:** admin123

## Estrutura do Banco

### Tabelas criadas:
- `users` - Usuários do sistema
- `companies` - Empresas sincronizadas do SharePoint
- `emails` - Emails dos grupos X e Y
- `generation_logs` - Logs de geração de relatórios
- `sync_logs` - Logs de sincronização

### Arquivos importantes:
- `src/database/schema.sql` - Schema do banco
- `src/database/init.js` - Script de inicialização
- `src/database/connection.js` - Conexão reutilizável

## Como usar

### 1. Instalar dependências adicionais
```bash
npm install
```

### 2. Configurar variáveis de ambiente
Copie o arquivo `.env.example` para `.env` e configure as variáveis.

### 3. Iniciar servidor
```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

### 4. Testar API
- Health Check: `GET http://localhost:3001/health`
- Login: `POST http://localhost:3001/api/auth/login`

## Endpoints disponíveis

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Recuperar senha
- `POST /api/auth/reset-password` - Resetar senha
- `GET /api/auth/me` - Dados do usuário logado
- `GET /api/auth/validate` - Validar token

### Empresas
- `GET /api/companies/search?q=termo` - Buscar empresas
- `GET /api/companies/:codigo` - Buscar por código
- `GET /api/companies` - Listar todas
- `GET /api/companies/stats` - Estatísticas

### Health Check
- `GET /health` - Status básico
- `GET /health/detailed` - Status detalhado

## Próximos passos
1. ✅ Express.js + JWT configurado
2. ⏳ Conectar com SharePoint
3. ⏳ Sistema de sincronização (job a cada 15min)
4. ⏳ Geração de relatórios
