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
