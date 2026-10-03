/** Ouvre un PDF renvoyé en base64 dans un nouvel onglet (sans téléchargement). */
export function openBase64Pdf(file, mime = 'application/pdf') {
  const bin = atob(file.base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const url = URL.createObjectURL(new Blob([bytes], { type: mime || file.mime || 'application/pdf' }))
  const w = window.open(url, '_blank', 'noopener,noreferrer')
  if (!w) throw new Error('Pop-up bloquée — autorisez les fenêtres pour ce site.')
  setTimeout(() => URL.revokeObjectURL(url), 120_000)
}

/** Télécharge un fichier renvoyé en base64 par l'API ({ file_name, base64 }). */
export function downloadBase64(file, mime) {
  mime = mime || file.mime || 'application/octet-stream'
  const bin = atob(file.base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = file.file_name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
