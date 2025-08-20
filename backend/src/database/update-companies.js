const db = require('../database/connection');
const logger = require('../utils/logger');

async function updateCompaniesTable() {
    try {
        logger.info('🔄 Atualizando estrutura da tabela companies...');

        // Verificar se coluna grupo já existe
        const tableInfo = await db.query("PRAGMA table_info(companies)");
        const hasGrupoColumn = tableInfo.some(col => col.name === 'grupo');
        
        if (!hasGrupoColumn) {
            // Adicionar coluna grupo
            await db.run('ALTER TABLE companies ADD COLUMN grupo VARCHAR(255)');
            logger.success('✅ Coluna "grupo" adicionada com sucesso');
        } else {
            logger.info('ℹ️ Coluna "grupo" já existe');
        }

        // Verificar se coluna dados_sharepoint existe e removê-la se necessário
        const hasSharepointColumn = tableInfo.some(col => col.name === 'dados_sharepoint');
        
        if (hasSharepointColumn) {
            logger.info('🗑️ Removendo coluna dados_sharepoint desnecessária...');
            
            // SQLite não suporta DROP COLUMN diretamente, então vamos recriar a tabela
            await db.run('BEGIN TRANSACTION');
            
            // Criar tabela temporária
            await db.run(`
                CREATE TABLE companies_new (
                    id TEXT PRIMARY KEY,
                    codigo VARCHAR(50) UNIQUE NOT NULL,
                    nome VARCHAR(255) NOT NULL,
                    grupo VARCHAR(255),
                    active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Copiar dados (sem dados_sharepoint)
            await db.run(`
                INSERT INTO companies_new (id, codigo, nome, grupo, active, created_at, updated_at)
                SELECT id, codigo, nome, NULL, active, created_at, updated_at 
                FROM companies
            `);
            
            // Renomear tabelas
            await db.run('DROP TABLE companies');
            await db.run('ALTER TABLE companies_new RENAME TO companies');
            
            // Recriar índices
            await db.run('CREATE INDEX IF NOT EXISTS idx_companies_codigo ON companies(codigo)');
            await db.run('CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(active)');
            
            await db.run('COMMIT');
            
            logger.success('✅ Tabela companies reestruturada com sucesso');
        }

        logger.success('✅ Atualização da tabela companies concluída');
        
    } catch (error) {
        logger.error('❌ Erro ao atualizar tabela companies', error);
        
        try {
            await db.run('ROLLBACK');
        } catch (rollbackError) {
            logger.error('❌ Erro no rollback', rollbackError);
        }
        
        throw error;
    }
}

// Se executado diretamente
if (require.main === module) {
    updateCompaniesTable()
        .then(() => {
            console.log('🎉 Atualização concluída com sucesso!');
            process.exit(0);
        })
        .catch(err => {
            console.error('💥 Erro na atualização:', err);
            process.exit(1);
        });
}

module.exports = { updateCompaniesTable };
