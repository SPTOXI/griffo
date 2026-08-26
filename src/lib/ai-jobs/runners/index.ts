import 'server-only'

/**
 * Ponto único de registro dos runners de `AiJob`, por `kind`.
 *
 * Importado só pelo efeito colateral (cada runner chama
 * `registerAiJobRunner` ao ser importado) — é o que dá a
 * `lib/ai-jobs/engine.ts#resumeIfStalled` acesso à função certa sem precisar
 * de um `switch` cravado nela, que a obrigaria a importar todos os runners e
 * arriscaria dependência circular (runner → engine → runner).
 *
 * Runners entram aqui conforme cada fluxo é convertido (ver 2.35 na
 * auditoria).
 */
import './profile-extraction'
import './career-orientation'
import './cover-letter'
