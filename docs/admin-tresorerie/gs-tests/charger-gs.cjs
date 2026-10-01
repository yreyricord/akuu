// Concatène les fichiers Apps Script dans l'ordre de chargement pour les exécuter dans Node.
const fs = require('fs'); const path = require('path')
const DIR = path.join(__dirname, '..', 'apps-script')
const ORDER = ['Config', 'UserProfile', 'SheetsRepo', 'Security', 'Auth', 'FileNaming', 'DriveService', 'EmailNotify', 'Business',
  'AccessRequests', 'JournalAnnee', 'ComptaAnnee', 'Exercices', 'ExerciceCloture', 'GenererCloture', 'Avances', 'CaissePerou',
  'TresorerieMeta', 'Releves', 'Corrections', 'SiteData', 'App', 'Setup', 'Diagnostic', 'Bascule']
module.exports = () => ORDER.map((n) => fs.readFileSync(path.join(DIR, n + '.gs'), 'utf8')).join('\n')
