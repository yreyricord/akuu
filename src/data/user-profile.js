/** Profil utilisateur — prénom, nom, nom complet */

export function buildFullName(firstName, lastName) {
  return [String(firstName || '').trim(), String(lastName || '').trim()].filter(Boolean).join(' ')
}

export function parseLegacyFullName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return { first_name: '', last_name: '' }
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(' ')
  }
}

export function normalizeUserProfile(input = {}) {
  let first_name = String(input.first_name || input.firstName || '').trim()
  let last_name = String(input.last_name || input.lastName || '').trim()
  let name = String(input.name || '').trim()

  if (!first_name && !last_name && name) {
    const parsed = parseLegacyFullName(name)
    first_name = parsed.first_name
    last_name = parsed.last_name
  }
  if (!name) name = buildFullName(first_name, last_name)
  if (!first_name && name) first_name = parseLegacyFullName(name).first_name

  return { first_name, last_name, name }
}

export function displayFirstName(profile) {
  const p = normalizeUserProfile(profile)
  return p.first_name || parseLegacyFullName(p.name).first_name || ''
}
