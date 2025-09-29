const db = require('./src/database/connection');

async function verificarEstadoAtual() {
    try {
        console.log('Verificando estado atual do banco de dados...');

        // Verificar empresas ativas
        const empresasAtivas = await db.query(
            'SELECT id, codigo, nome, grupo, active FROM companies WHERE active = 1 ORDER BY nome'
        );

        console.log(`\nEmpresas ativas no banco (${empresasAtivas.length}):`);
        empresasAtivas.forEach(emp => {
            console.log(`  ${emp.codigo}: ${emp.nome} (${emp.grupo || 'sem grupo'})`);
        });

        // Verificar se as empresas originais ainda existem (desativadas)
        const empresasDesativadas = await db.query(
            'SELECT id, codigo, nome, grupo, active FROM companies WHERE active = 0 AND codigo IN (2634, 2635) ORDER BY nome'
        );

        console.log(`\nEmpresas desativadas (${empresasDesativadas.length}):`);
        empresasDesativadas.forEach(emp => {
            console.log(`  ${emp.codigo}: ${emp.nome} (${emp.grupo || 'sem grupo'})`);
        });

    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        await db.close();
    }
}

verificarEstadoAtual();