const db = require('./src/database/connection');

async function reverterMudancas() {
    try {
        console.log('Revertendo mudancas desnecessarias...');

        // Reativar as empresas que eu desativei incorretamente
        const empresasReativar = [2634, 2635];

        for (const codigo of empresasReativar) {
            await db.run(
                'UPDATE companies SET active = 1, updated_at = CURRENT_TIMESTAMP WHERE codigo = ?',
                [codigo]
            );
            console.log(`Reativada empresa com codigo ${codigo}`);
        }

        console.log('\nVerificando estado apos reversao:');

        // Verificar empresas ativas novamente
        const empresasAtivas = await db.query(
            'SELECT codigo, nome FROM companies WHERE active = 1 AND codigo IN (2112, 810, 2634, 2635) ORDER BY nome'
        );

        console.log('Empresas ativas relevantes:');
        empresasAtivas.forEach(emp => {
            console.log(`  ${emp.codigo}: ${emp.nome}`);
        });

    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        await db.close();
    }
}

reverterMudancas();