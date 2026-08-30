import { DICTIONARIES, LANGUAGES, type Language, type TranslationDictionary } from '../src/lib/i18n'

/**
 * Script de Verificação e Sincronização de Dicionários Multi-Idiomas (i18n)
 *
 * Valida a paridade de chaves, estrutura e integridade de todos os 12 dicionários
 * em relação ao dicionário base (Português - BR).
 */

function countKeys(obj: any): number {
  let count = 0
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      count += countKeys(obj[key])
    } else {
      count += 1
    }
  }
  return count
}

function findMissingKeys(baseObj: any, targetObj: any, prefix = ''): string[] {
  const missing: string[] = []
  for (const key of Object.keys(baseObj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (!(key in targetObj)) {
      missing.push(fullKey)
    } else if (typeof baseObj[key] === 'object' && baseObj[key] !== null && !Array.isArray(baseObj[key])) {
      missing.push(...findMissingKeys(baseObj[key], targetObj[key], fullKey))
    } else if (typeof targetObj[key] === 'string' && targetObj[key].trim() === '') {
      missing.push(`${fullKey} (EMPTY_STRING)`)
    }
  }
  return missing
}

export function runI18nAudit() {
  console.log('=====================================================')
  console.log('🌐 GRIFFOWORK - AUDITORIA DE PARIDADE I18N (12 IDIOMAS)')
  console.log('=====================================================\n')

  const base = DICTIONARIES.pt
  const totalBaseKeys = countKeys(base)
  console.log(`📌 Dicionário Base (PT): ${totalBaseKeys} chaves estruturadas em 28 submódulos.\n`)

  let hasErrors = false

  for (const lang of LANGUAGES) {
    const dict = DICTIONARIES[lang]
    if (!dict) {
      console.error(`❌ Idioma [${lang.toUpperCase()}]: Dicionário não encontrado!`)
      hasErrors = true
      continue
    }

    const missing = findMissingKeys(base, dict)
    const keyCount = countKeys(dict)
    const parityPercent = ((1 - missing.length / totalBaseKeys) * 100).toFixed(1)

    if (missing.length === 0) {
      console.log(`✅ [${lang.toUpperCase()}]: 100% de paridade (${keyCount}/${totalBaseKeys} chaves válidas)`)
    } else {
      hasErrors = true
      console.warn(`⚠️ [${lang.toUpperCase()}]: ${parityPercent}% de paridade (${missing.length} chaves pendentes):`)
      for (const m of missing.slice(0, 5)) {
        console.warn(`   - ${m}`)
      }
      if (missing.length > 5) {
        console.warn(`   ... e mais ${missing.length - 5} chaves.`)
      }
    }
  }

  console.log('\n=====================================================')
  if (!hasErrors) {
    console.log('🎉 TODOS OS 12 IDIOMAS ESTÃO 100% SINCRONIZADOS E ÍNTEGROS!')
  } else {
    console.log('⚠️ ALGUNS IDIOMAS APRESENTAM CHAVES DIVERGENTES.')
  }
  console.log('=====================================================\n')

  return !hasErrors
}

if (require.main === module) {
  const ok = runI18nAudit()
  process.exit(ok ? 0 : 1)
}
