// Smoke test to verify the xlsx-saida-generator service loads and exports functions
try {
  const s = require('./src/services/xlsx-saida-generator.service.js');
  console.log('Exports:', Object.keys(s));
} catch (err) {
  console.error('Error while requiring service:', err && err.message);
  process.exit(1);
}
