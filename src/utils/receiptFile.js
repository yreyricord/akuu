/**
 * Validation et conversion des justificatifs trésorerie → PDF.
 */

import { PDFDocument } from 'pdf-lib'

const ALLOWED_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png', 'heic', 'heif', 'webp', 'gif'])

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
  'image/gif'
])

/** Attribut HTML `accept` pour les inputs fichier. */
export const RECEIPT_ACCEPT_ATTR =
  '.pdf,.jpg,.jpeg,.png,.heic,.heif,.webp,application/pdf,image/jpeg,image/png,image/heic,image/heif,image/webp'

export const RECEIPT_FORMATS_LABEL = 'PDF, JPG, JPEG, PNG, HEIC, WEBP'

export function getReceiptExtension(file) {
  const match = (file?.name ?? '').toLowerCase().match(/\.([a-z0-9]+)$/)
  return match ? match[1] : ''
}

export function isPdfFile(file) {
  return file?.type === 'application/pdf' || getReceiptExtension(file) === 'pdf'
}

export function isAllowedReceiptFile(file) {
  if (!file?.name) return false
  const ext = getReceiptExtension(file)
  if (ALLOWED_EXTENSIONS.has(ext)) return true
  if (file.type && ALLOWED_MIME_TYPES.has(file.type)) return true
  return false
}

function pdfFileName(originalName) {
  const base = (originalName ?? 'facture').replace(/\.[^.]+$/i, '') || 'facture'
  return `${base}.pdf`
}

async function heicToJpeg(file) {
  const { default: heic2any } = await import('heic2any')
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
  const blob = Array.isArray(result) ? result[0] : result
  return new File([blob], file.name.replace(/\.[^.]+$/i, '.jpg'), { type: 'image/jpeg' })
}

/**
 * Côté le plus long d'une photo de justificatif après compression.
 * 2200 px ≈ 190 dpi sur un ticket A4 : texte lisible, fichier ~10× plus léger
 * qu'une photo 12 Mpx (l'envoi vers Apps Script se fait en base64, +33 %).
 */
export const RECEIPT_MAX_EDGE = 2200
export const RECEIPT_JPEG_QUALITY = 0.82
/** Au-delà, avertir avant l'envoi (connexion lente sur le terrain). */
export const UPLOAD_WARN_BYTES = 4 * 1024 * 1024

async function loadDrawable(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      // from-image : applique l'orientation EXIF (photos iPhone en portrait)
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      /* repli <img> ci-dessous */
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image illisible'))
    }
    img.src = url
  })
}

/**
 * Redimensionne (côté max `maxEdge`) et ré-encode en JPEG.
 * Redessiner sur un canvas « redresse » aussi les photos : pdf-lib ignore
 * l'orientation EXIF, une photo portrait apparaissait couchée dans le PDF.
 */
export async function compressImageFile(file, { maxEdge = RECEIPT_MAX_EDGE, quality = RECEIPT_JPEG_QUALITY } = {}) {
  if (typeof document === 'undefined') return file
  const src = await loadDrawable(file)
  const w = src.width || src.naturalWidth
  const h = src.height || src.naturalHeight
  if (!w || !h) throw new Error('Image illisible')
  const scale = Math.min(1, maxEdge / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w * scale))
  canvas.height = Math.max(1, Math.round(h * scale))
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff' // fond blanc pour les PNG transparents
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height)
  if (typeof src.close === 'function') src.close()
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  if (!blob) throw new Error('Conversion image impossible')
  return new File([blob], file.name.replace(/\.[^.]+$/i, '.jpg'), { type: 'image/jpeg' })
}

async function rasterToJpeg(file) {
  if (file.type === 'image/jpeg' || ['jpg', 'jpeg'].includes(getReceiptExtension(file))) {
    return file
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d').drawImage(img, 0, 0)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Conversion image impossible'))
            return
          }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/i, '.jpg'), { type: 'image/jpeg' }))
        },
        'image/jpeg',
        0.92
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image illisible'))
    }
    img.src = url
  })
}

async function prepareImageFile(file) {
  const ext = getReceiptExtension(file)
  let source = file
  if (['heic', 'heif'].includes(ext) || ['image/heic', 'image/heif'].includes(file.type)) {
    try {
      source = await heicToJpeg(file)
    } catch {
      throw new Error('Fichier HEIC illisible — exportez en JPG ou PDF depuis votre appareil.')
    }
  }
  try {
    return await compressImageFile(source)
  } catch {
    // Repli : comportement historique (pleine résolution)
    if (source !== file) return source
    if (ext === 'png' || file.type === 'image/png') return file
    if (['jpg', 'jpeg'].includes(ext) || file.type === 'image/jpeg') return file
    return rasterToJpeg(file)
  }
}

/** Convertit une image (JPG, PNG, HEIC, WEBP…) en PDF une page. */
export async function imageFileToPdf(file) {
  const prepared = await prepareImageFile(file)
  const bytes = await prepared.arrayBuffer()
  const pdfDoc = await PDFDocument.create()
  const usePng = getReceiptExtension(prepared) === 'png' || prepared.type === 'image/png'
  const image = usePng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes)
  const { width, height } = image.scale(1)
  const page = pdfDoc.addPage([width, height])
  page.drawImage(image, { x: 0, y: 0, width, height })
  const pdfBytes = await pdfDoc.save()
  return new File([pdfBytes], pdfFileName(file.name), { type: 'application/pdf' })
}

/** PDF inchangé ; images converties en PDF. */
export async function normalizeReceiptToPdf(file) {
  if (isPdfFile(file)) return file
  return imageFileToPdf(file)
}
