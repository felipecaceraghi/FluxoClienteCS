const db = require('./src/database/connection');

async function cleanupInvalidCompanies() {
    try {
        console.log('🧹 Limpando empresas com códigos inválidos...');
        
        // Deletar empresas com códigos de apenas 1 caractere (provavelmente incorretos)
        const deleteQuery = `
            DELETE FROM companies 
            WHERE LENGTH(codigo) <= 3 OR codigo IS NULL OR codigo = ''
        `;
        
        const result = await db.run(deleteQuery);
        console.log(`✅ ${result.changes} empresas removidas`);
        
        // Verificar quantas empresas restaram
        const countQuery = `SELECT COUNT(*) as total FROM companies`;
        const count = await db.get(countQuery);
        console.log(`📊 Empresas restantes no banco: ${count.total}`);
        
        console.log('🎯 Limpeza concluída!');
        
    } catch (error) {
        console.error('❌ Erro durante limpeza:', error);
    } finally {
        process.exit(0);
    }
}

cleanupInvalidCompanies();
