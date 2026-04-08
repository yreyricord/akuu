/**
 * Shared i18n utilities used by check-i18n-parity.mjs and tests.
 */

/**
 * Flatten a nested object to a Set of dot-notation key paths.
 * Arrays and leaf values (string, number, boolean, null) produce a key entry.
 * @param {object} obj
 * @param {string} prefix
 * @returns {Set<string>}
 */
export function flatten(obj, prefix = '') {
  const out = new Set()
  for (const k of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    const v = obj[k]
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      for (const p of flatten(v, path)) out.add(p)
    } else {
      out.add(path)
    }
  }
  return out
}

/**
 * Compare two flattened key sets and return mismatches.
 * @param {Set<string>} base  Reference locale (fr)
 * @param {Set<string>} other Target locale
 * @returns {{ onlyInBase: string[], onlyInOther: string[] }}
 */
export function diffLocales(base, other) {
  return {
    onlyInBase: [...base].filter((k) => !other.has(k)).sort(),
    onlyInOther: [...other].filter((k) => !base.has(k)).sort(),
  }
}
