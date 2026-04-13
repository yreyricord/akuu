/**
 * Ajuste lexical/ortographique EU-PT → pt-BR sur les valeurs string de src/i18n/pt.json.
 * Usage: node scripts/normalize-pt-json-br.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const path = join(root, 'src/i18n/pt.json')

function normalizePtBr (s) {
  let out = s
  const reps = [
    [/Amazónia/g, 'Amazônia'],
    [/património/g, 'patrimônio'],
    [/governação/g, 'governança'],
    [/Objectivos/g, 'Objetivos'],
    [/Objectivo/g, 'Objetivo'],
    [/objectivo/g, 'objetivo'],
    [/\bequipas\b/g, 'equipes'],
    [/\bequipa\b/g, 'equipe'],
    [/Contacto/g, 'Contato'],
    [/contacto/g, 'contato'],
    [/Contacte a equipe da AKUU/g, 'Fale com a equipe da AKUU'],
    [/Contacte a equipe/g, 'Fale com a equipe'],
    [/Recolha/g, 'Coleta'],
    [/recolha/g, 'coleta'],
    [/Faça um donativo/g, 'Faça uma doação'],
    [/com um donativo/g, 'com uma doação'],
    [/do seu donativo/g, 'da sua doação'],
    [/na Amazónia/g, 'na Amazônia'],
    [/a associação da AKUU/g, 'a associação AKUU'],
    [/«/g, '"'],
    [/»/g, '"']
  ]
  for (const [re, to] of reps) {
    out = out.replace(re, to)
  }
  return out
}

function walk (v) {
  if (typeof v === 'string') return normalizePtBr(v)
  if (Array.isArray(v)) return v.map((x) => walk(x))
  if (v !== null && typeof v === 'object') {
    const o = {}
    for (const k of Object.keys(v)) o[k] = walk(v[k])
    return o
  }
  return v
}

const data = JSON.parse(readFileSync(path, 'utf8'))
writeFileSync(path, `${JSON.stringify(walk(data), null, 2)}\n`, 'utf8')
console.log('Normalized pt.json → Brazilian Portuguese patterns.')
