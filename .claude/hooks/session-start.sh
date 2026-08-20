#!/bin/bash
# Instala as dependências no início da sessão.
#
# O motivo: o contêiner das sessões remotas nasce com o repositório clonado e
# SEM `node_modules`. Nesse estado `npm test` não falha de forma honesta — os
# arquivos de teste que importam `zod` (matching, extract, profile) morrem no
# carregamento e os ~99 testes deles simplesmente não rodam. O relatório final
# mostra uma contagem menor, e bastaria esses arquivos não importarem nada
# externo para ele exibir `fail 0` com um terço da suíte ausente.
#
# É a mesma família de armadilha das aspas no glob do `npm test`: a suíte
# encolhe em silêncio e o resultado parece bom.
set -euo pipefail

# Só faz sentido no ambiente remoto; na máquina de quem desenvolve as
# dependências já estão instaladas, e reinstalar a cada sessão só atrasa.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# `npm install` e não `npm ci`: o estado do contêiner é cacheado depois do
# hook, e o install incremental aproveita esse cache. Com tudo presente ele é
# praticamente instantâneo, então rodar em toda sessão não custa.
npm install --no-audit --no-fund

# O `@prisma/client` gera o cliente no próprio postinstall, mas se esse
# postinstall não rodar, o typecheck e o `npm run build` quebram com um erro
# que não diz o que aconteceu. É barato garantir.
if [ ! -d node_modules/.prisma/client ]; then
  npx --yes prisma generate
fi
