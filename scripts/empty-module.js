// Módulo vazio para onde os testes redirecionam `server-only`/`client-only`.
// Ver scripts/test-setup.mjs. Precisa ser um arquivo real, e não um `data:`
// URL: o carregador CommonJS (o tsx transpila os `.ts` deste projeto para CJS)
// tenta ABRIR a URL devolvida pelo hook, e um `data:` vira ENOENT.
module.exports = {}
