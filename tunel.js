// tunel.js (Node >=14)
const localtunnel = require('localtunnel');

const PORT = 3001;
const SUBDOMAIN = 'fluxoclientecs';
const RETRY_MS = 5000;

async function startTunnel() {
  while (true) {
    try {
      const tunnel = await localtunnel({ port: PORT, subdomain: SUBDOMAIN });
      console.log(`[OK] Tunnel ativo em: ${tunnel.url}`);

      tunnel.on('close', () => {
        console.error('[WARN] Tunnel foi fechado. Tentando reabrir...');
      });

      // Mantém o processo vivo até o túnel fechar:
      await new Promise((resolve) => {
        tunnel.on('close', resolve);
        tunnel.on('error', (err) => {
          console.error('[ERR] Evento de erro no túnel:', err?.message || err);
          resolve();
        });
      });
    } catch (err) {
      console.error('[ERR] Falha ao criar túnel:', err?.message || err);
    }
    console.log(`[INFO] Nova tentativa em ${RETRY_MS / 1000}s...`);
    await new Promise((r) => setTimeout(r, RETRY_MS));
  }
}

startTunnel();
