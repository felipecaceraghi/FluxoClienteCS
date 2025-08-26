const search = require('../src/services/planilha-search.service');

(async () => {
    try {
        console.log('Pesquisa cliente cadastro: Autotechnik');
        const c1 = await search.pesquisaClienteCadastro('Autotechnik');
        console.log('count:', c1.count);
        console.log('sample:', c1.rows && c1.rows.slice(0,2));

        console.log('\nPesquisa grupo produtos: Grupo Autotechnik');
        const p1 = await search.pesquisaGrupoProdutos('Grupo Autotechnik');
        console.log('count:', p1.count);
        console.log('sample:', p1.rows && p1.rows.slice(0,2));

        console.log('\nPesquisa cliente saida: Okena');
        const s1 = await search.pesquisaClienteSaida('Okena');
        console.log('count:', s1.count);
        console.log('sample:', s1.rows && s1.rows.slice(0,2));

        process.exit(0);
    } catch (err) {
        console.error('Erro no teste de busca:', err);
        process.exit(1);
    }
})();
