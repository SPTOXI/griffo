import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deflateRawSync } from 'node:zlib'
import { buildGazetteer, findCoords, lookupSlugs, unzipEntry } from './city-coords'

// Colunas da GeoNames: id, nome, nome ascii, alternativos, lat, lng, classe,
// código, país, cc2, adm1..adm4, população.
const row = (id: number, name: string, ascii: string, alt: string, lat: number, lng: number, cc: string, pop: number, code = 'PPL') =>
  [id, name, ascii, alt, lat, lng, 'P', code, cc, '', '', '', '', '', pop].join('\t')

const TEXT = [
  row(1, 'Munich', 'Munich', 'Muenchen,München,Monaco di Baviera', 48.14, 11.58, 'DE', 1_260_000),
  row(2, 'São Paulo', 'Sao Paulo', 'SP,Sampa', -23.55, -46.63, 'BR', 12_000_000),
  row(3, 'Santa Maria', 'Santa Maria', '', -29.68, -53.81, 'BR', 260_000),
  row(4, 'Santa Maria', 'Santa Maria', '', -19.0, -44.0, 'BR', 9_000),
  row(5, 'Sp', 'Sp', '', -1, -1, 'BR', 5_000),
  row(11, 'Ciudad Juárez', 'Ciudad Juarez', 'Juarez', 31.7, -106.4, 'MX', 1_500_000),
  row(12, 'Juárez', 'Juarez', '', 17.6, -93.2, 'MX', 20_000),
  row(9, 'Santa Rita', 'Santa Rita', 'Riacho', -7, -35, 'BR', 120_000),
  row(10, 'Riacho', 'Riacho', '', -6, -36, 'BR', 20_000),
  row(7, 'Cachoeirinha', 'Cachoeirinha', '', -23.45, -46.66, 'BR', 150_000, 'PPLX'),
  row(8, 'Cachoeirinha', 'Cachoeirinha', '', -29.95, -51.09, 'BR', 118_000),
  row(6, 'Paris', 'Paris', '', 48.85, 2.35, 'FR', 2_100_000),
].join('\n')

test('acha a cidade pelo nome alternativo e pelo país', () => {
  const gaz = buildGazetteer(TEXT, new Set(['DE', 'BR']))
  assert.equal(findCoords(gaz, 'DE', ['munchen'])?.geonameId, 1)
  assert.equal(findCoords(gaz, 'BR', ['sao-paulo'])?.geonameId, 2)
  // País fora da lista nem é lido.
  assert.equal(findCoords(gaz, 'FR', ['paris']), null)
  assert.equal(findCoords(gaz, 'BR', ['nao-existe']), null)
})

test('com nome repetido no país vence a cidade (não o bairro) e a maior; apelido de cidade dez vezes maior vence o nome', () => {
  const gaz = buildGazetteer(TEXT, new Set(['BR', 'MX']))
  assert.equal(findCoords(gaz, 'BR', ['santa-maria'])?.geonameId, 3)
  // Sigla curta fica com a cidade que se chama assim, mesmo pequena.
  assert.equal(findCoords(gaz, 'BR', ['sp'])?.geonameId, 5)
  assert.equal(findCoords(gaz, 'BR', ['sampa'])?.geonameId, 2)
  assert.equal(findCoords(gaz, 'BR', ['cachoeirinha'])?.geonameId, 8)
  assert.equal(findCoords(gaz, 'MX', ['juarez'])?.geonameId, 11)
  // Maior, mas não dez vezes: fica o nome principal.
  assert.equal(findCoords(gaz, 'BR', ['riacho'])?.geonameId, 10)
})

test('procura pelo slug, pelo nome e pelas grafias cruas', () => {
  assert.deepEqual(
    lookupSlugs({ slug: 'munchen', name: 'München', rawCities: ['Munich, Bavaria', 'Remote'] }),
    ['munchen', 'munich']
  )
})

test('unzipEntry lê o arquivo comprimido pelo diretório central', () => {
  const content = Buffer.from(TEXT, 'utf8')
  const data = deflateRawSync(content)
  const name = Buffer.from('cities5000.txt')
  const local = Buffer.alloc(30)
  local.writeUInt32LE(0x04034b50, 0)
  local.writeUInt16LE(8, 8)
  local.writeUInt16LE(name.length, 26)
  const central = Buffer.alloc(46)
  central.writeUInt32LE(0x02014b50, 0)
  central.writeUInt16LE(8, 10)
  central.writeUInt32LE(data.length, 20)
  central.writeUInt32LE(content.length, 24)
  central.writeUInt16LE(name.length, 28)
  central.writeUInt32LE(0, 42)
  const cdOffset = local.length + name.length + data.length
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(1, 8)
  eocd.writeUInt16LE(1, 10)
  eocd.writeUInt32LE(central.length + name.length, 12)
  eocd.writeUInt32LE(cdOffset, 16)
  const zip = Buffer.concat([local, name, data, central, name, eocd])
  assert.equal(unzipEntry(zip, 'cities5000.txt').toString('utf8'), TEXT)
  assert.throws(() => unzipEntry(zip, 'outro.txt'))
})
