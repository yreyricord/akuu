/** Encode fichiers en base64 pour Apps Script (Phase B) */

/**
 * @param {File} file
 * @param {{ onProgress?: (ratio: number) => void, signal?: AbortSignal }} [opts]
 */
export function fileToAttachment(file, opts = {}) {
  if (!file) return null
  const { onProgress, signal } = opts
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError())
      return
    }
    const reader = new FileReader()
    const onAbort = () => {
      reader.abort()
      reject(abortError())
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    reader.onprogress = (e) => {
      if (onProgress && e.lengthComputable && e.total) onProgress(e.loaded / e.total)
    }
    reader.onload = () => {
      signal?.removeEventListener('abort', onAbort)
      const result = reader.result
      const base64 = typeof result === 'string' ? result.split(',')[1] : ''
      onProgress?.(1)
      resolve({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        base64
      })
    }
    reader.onerror = () => {
      signal?.removeEventListener('abort', onAbort)
      reject(reader.error)
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Encode plusieurs fichiers ; `onProgress(ratio)` agrège la progression
 * pondérée par la taille de chaque fichier.
 */
export async function filesToAttachments(files, opts = {}) {
  const list = Array.from(files || []).filter(Boolean)
  const total = list.reduce((s, f) => s + (f.size || 0), 0) || 1
  const loaded = list.map(() => 0)
  const report = () => opts.onProgress?.(loaded.reduce((s, v) => s + v, 0) / total)
  return Promise.all(
    list.map((f, i) =>
      fileToAttachment(f, {
        signal: opts.signal,
        onProgress: (ratio) => {
          loaded[i] = ratio * (f.size || 0)
          report()
        }
      })
    )
  )
}

/** Taille approximative du corps JSON envoyé (base64 = +33 %). */
export function estimatePayloadBytes(files) {
  const raw = Array.from(files || []).filter(Boolean).reduce((s, f) => s + (f.size || 0), 0)
  return Math.ceil(raw * 4 / 3) + 2048
}

export function abortError() {
  const err = new Error('Envoi annulé.')
  err.code = 'ABORTED'
  return err
}
