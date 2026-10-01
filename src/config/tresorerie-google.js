/**
 * Liens Google Drive + Sheets trésorerie (Phase B).
 * IDs dans .env.local · jamais de secrets OAuth ici.
 */

const env = import.meta.env

/** Dossier racine 3_Trésorerie (depuis 30/09/2026 ; ancien : 2026_NEW_Protocol 1hAisydb…) */
export const DEFAULT_DRIVE_ROOT_ID = '1jjSujWQnVXXP7Up3blVHShKOrBQN_lTq'

/** Archives historiques 2017–2026 (3_Trésorerie upload) */
export const DEFAULT_HISTORIQUE_DRIVE_ID = '1jjSujWQnVXXP7Up3blVHShKOrBQN_lTq'

function envId(key, fallback = '') {
  const v = env[key]?.trim()
  return v || fallback
}

export function driveFolderUrl(folderId) {
  if (!folderId) return null
  return `https://drive.google.com/drive/folders/${folderId}`
}

export function sheetEditUrl(spreadsheetId, gid) {
  if (!spreadsheetId) return null
  const base = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
  return gid ? `${base}?gid=${gid}` : base
}

export function sheetEmbedUrl(spreadsheetId, gid) {
  if (!spreadsheetId) return null
  const params = new URLSearchParams({
    widget: 'true',
    headers: 'false',
    rm: 'minimal'
  })
  if (gid) params.set('gid', gid)
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlembed?${params}`
}

export const tresorerieGoogle = {
  spreadsheetId: envId('VITE_TRESORERIE_SPREADSHEET_ID'),
  sheetGid: envId('VITE_TRESORERIE_SHEET_GID'),

  get sheetEmbedUrl() {
    return sheetEmbedUrl(this.spreadsheetId, this.sheetGid)
  },

  get sheetEditUrl() {
    return sheetEditUrl(this.spreadsheetId, this.sheetGid)
  },

  driveFolders: [
    {
      id: 'root',
      label: '3_Trésorerie',
      description: 'Toutes les années : journaux, factures, relevés, clôtures',
      folderId: envId('VITE_TRESORERIE_DRIVE_ROOT_ID', DEFAULT_DRIVE_ROOT_ID),
      icon: 'root'
    },
    {
      id: 'factures',
      label: "Factures de l'année en cours",
      description: "Où l'application dépose les factures validées",
      folderId: envId('VITE_TRESORERIE_DRIVE_FACTURES_ID'),
      icon: 'factures'
    },
    {
      id: 'releves',
      label: 'Relevés de compte',
      description: 'Imports bancaires manuels',
      folderId: envId('VITE_TRESORERIE_DRIVE_RELEVES_ID'),
      icon: 'releves'
    },
    {
      id: 'comptes',
      label: 'Comptes',
      description: 'Google Sheets master · AKUU_Comptes_Depenses',
      folderId: envId('VITE_TRESORERIE_DRIVE_COMPTES_ID'),
      icon: 'comptes'
    },
    {
      id: 'historique',
      label: 'Archives 2017–2026',
      description: 'Journaux Excel · Factures par année · Detail_PM',
      folderId: envId('VITE_TRESORERIE_HISTORIQUE_DRIVE_ID', DEFAULT_HISTORIQUE_DRIVE_ID),
      icon: 'historique'
    }
  ].map((item) => ({
    ...item,
    url: driveFolderUrl(item.folderId)
  }))
}

export function isSheetConfigured() {
  return Boolean(tresorerieGoogle.spreadsheetId)
}
