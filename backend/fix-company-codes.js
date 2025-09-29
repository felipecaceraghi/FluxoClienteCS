const db = require('./src/database/connection');

async function corrigirCodigosEmpresas() {
    try {
        console.log('🔧 Corrigindo códigos das empresas no banco de dados...');

        // Mapeamento dos códigos incorretos para os corretos
        const correcoes = [
            { codigoAtual: '2634', codigoCorreto: '2112', nome: 'Tap Tap Perdizes' },
            { codigoAtual: '2635', codigoCorreto: '810', nome: 'Inventcloud Tecnologia' }
        ];

        for (const correcao of correcoes) {
            console.log(`\n📝 Corrigindo empresa "${correcao.nome}":`);
            console.log(`   Código atual: ${correcao.codigoAtual}`);
            console.log(`   Código correto: ${correcao.codigoCorreto}`);

            // Verificar se a empresa com código incorreto existe
            const empresaExistente = await db.get(
                'SELECT id, codigo, nome FROM companies WHERE codigo = ? AND active = 1',
                [correcao.codigoAtual]
            );

            if (empresaExistente) {
                console.log(`   ✅ Empresa encontrada: ${empresaExistente.nome}`);

                // Verificar se já existe empresa com o código correto
                const empresaCorreta = await db.get(
                    'SELECT id, codigo, nome FROM companies WHERE codigo = ? AND active = 1',
                    [correcao.codigoCorreto]
                );

                if (empresaCorreta) {
                    console.log(`   ⚠️  Já existe empresa com código correto: ${empresaCorreta.nome}`);
                    console.log(`   🔄 Desativando empresa com código incorreto...`);

                    // Desativar a empresa com código incorreto
                    await db.run(
                        'UPDATE companies SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                        [empresaExistente.id]
                    );

                    console.log(`   ✅ Empresa com código incorreto desativada`);
                } else {
                    console.log(`   🔄 Atualizando código da empresa...`);

                    // Atualizar o código da empresa
                    await db.run(
                        'UPDATE companies SET codigo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                        [correcao.codigoCorreto, empresaExistente.id]
                    );

                    console.log(`   ✅ Código atualizado com sucesso`);
                }
            } else {
                console.log(`   ❌ Empresa com código ${correcao.codigoAtual} não encontrada`);
            }
        }

        console.log('\n🔍 Verificando correções:');

        // Verificar se as correções foram aplicadas
        for (const correcao of correcoes) {
            const empresaCorrigida = await db.get(
                'SELECT id, codigo, nome FROM companies WHERE codigo = ? AND active = 1',
                [correcao.codigoCorreto]
            );

            if (empresaCorrigida) {
                console.log(`   ✅ ${correcao.nome}: Código ${empresaCorrigida.codigo} - OK`);
            } else {
                console.log(`   ❌ ${correcao.nome}: Código ${correcao.codigoCorreto} - NÃO ENCONTRADO`);
            }
        }

        console.log('\n🎉 Correção concluída!');

    } catch (error) {
        console.error('❌ Erro durante correção:', error);
    } finally {
        await db.close();
    }
}

corrigirCodigosEmpresas();