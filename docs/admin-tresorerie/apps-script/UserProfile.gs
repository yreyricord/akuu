/** Prénom / nom / nom complet — Users & sessions */

function buildFullName_(firstName, lastName) {
  var parts = [];
  if (String(firstName || '').trim()) parts.push(String(firstName).trim());
  if (String(lastName || '').trim()) parts.push(String(lastName).trim());
  return parts.join(' ');
}

function parseLegacyFullName_(fullName) {
  var parts = String(fullName || '').trim().split(/\s+/).filter(function (p) { return p; });
  if (!parts.length) return { first_name: '', last_name: '' };
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(' ')
  };
}

function normalizeUserProfile_(input) {
  input = input || {};
  var first = String(input.first_name || input.firstName || '').trim();
  var last = String(input.last_name || input.lastName || '').trim();
  var full = String(input.name || '').trim();

  if (!first && !last && full) {
    var parsed = parseLegacyFullName_(full);
    first = parsed.first_name;
    last = parsed.last_name;
  }
  if (!full) full = buildFullName_(first, last);
  if (!first && full) first = parseLegacyFullName_(full).first_name;

  var out = { first_name: first, last_name: last, name: full };
  Object.keys(input).forEach(function (key) {
    if (key === 'first_name' || key === 'last_name' || key === 'name' ||
        key === 'firstName' || key === 'lastName') return;
    out[key] = input[key];
  });
  return out;
}

function profileFromAccessRequest_(body) {
  var first = String(body.first_name || body.firstName || '').trim();
  var last = String(body.last_name || body.lastName || '').trim();
  if (!first || !last) {
    var legacy = String(body.name || '').trim();
    if (legacy) return normalizeUserProfile_({ name: legacy });
    return null;
  }
  return normalizeUserProfile_({ first_name: first, last_name: last });
}
