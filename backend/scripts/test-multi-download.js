const {
    downloadSaidaClientesPlanilha,
    downloadCadastroClientesPlanilha,
    downloadProdutosClientesPlanilha
} = require('../src/services/saida-clientes-download.service');

(async () => {
    try {
        console.log('Iniciando downloads...');
        const saida = await downloadSaidaClientesPlanilha();
        console.log('Saída:', saida);

        const cadastro = await downloadCadastroClientesPlanilha();
        console.log('Cadastro:', cadastro);

        const produtos = await downloadProdutosClientesPlanilha();
        console.log('Produtos:', produtos);

        console.log('Todos os downloads concluídos.');
        process.exit(0);
    } catch (err) {
        console.error('Erro nos downloads:', err);
        process.exit(1);
    }
})();
