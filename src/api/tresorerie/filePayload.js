/** Encode fichiers en base64 pour Apps Script (Phase B) */

export function fileToAttachment(file) {
  if (!file) return null
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      const base64 = typeof result === 'string' ? result.split(',')[1] : ''
      resolve({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        base64
      })
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function filesToAttachments(files) {
  const list = Array.from(files || [])
  return Promise.all(list.map((f) => fileToAttachment(f)))
}
