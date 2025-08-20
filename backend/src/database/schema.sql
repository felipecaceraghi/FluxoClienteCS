-- Schema do banco SQLite para FluxoClienteCS

-- Tabela de usuários para autenticação
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT 1,
    reset_token VARCHAR(255),
    reset_token_expires DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de empresas (sincronizada do SharePoint)
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    grupo VARCHAR(255),
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de emails (grupos X e Y)
CREATE TABLE IF NOT EXISTS emails (
    id TEXT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    grupo VARCHAR(10) NOT NULL, -- 'X' ou 'Y'
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de logs de geração
CREATE TABLE IF NOT EXISTS generation_logs (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    tipo_planilha VARCHAR(10) NOT NULL, -- 'X', 'Y' ou 'AMBAS'
    arquivo_gerado VARCHAR(500),
    emails_enviados TEXT, -- JSON array com lista de emails
    status VARCHAR(20) DEFAULT 'PROCESSANDO', -- 'SUCESSO', 'ERRO', 'PROCESSANDO'
    erro_detalhes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de logs de sincronização do SharePoint
CREATE TABLE IF NOT EXISTS sync_logs (
    id TEXT PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL, -- 'COMPANIES'
    status VARCHAR(20) NOT NULL, -- 'SUCESSO', 'ERRO'
    registros_processados INTEGER DEFAULT 0,
    registros_novos INTEGER DEFAULT 0,
    registros_atualizados INTEGER DEFAULT 0,
    erro_detalhes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_companies_codigo ON companies(codigo);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(active);
CREATE INDEX IF NOT EXISTS idx_emails_grupo ON emails(grupo);
CREATE INDEX IF NOT EXISTS idx_emails_active ON emails(active);
CREATE INDEX IF NOT EXISTS idx_generation_logs_company ON generation_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_user ON generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_created ON generation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
