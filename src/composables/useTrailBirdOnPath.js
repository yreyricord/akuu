/**
 * Positionne un picto sur l’extrémité « dessinée » d’un path SVG (stroke-dashoffset).
 */

/** Frises verticales (points au centre, courbe ondulée) : le PNG est souvent axe « tête en haut ». */
export const TRAIL_BIRD_ANGLE_OFFSET_VERTICAL_FRIZE = -90

/** Chemin quasi horizontal (ex. étapes volontaires) : suivre la tangente sans correction. */
export const TRAIL_BIRD_ANGLE_OFFSET_HORIZONTAL_PATH = 0

/**
 * @param {SVGPathElement | null} pathEl
 * @param {number} pathLength
 * @param {number} dashOffset
 * @param {{ look?: number, angleOffset?: number }} [options]
 */
export function computeTrailBirdLayout (pathEl, pathLength, dashOffset, options = {}) {
  const look = options.look ?? 16
  const angleOffset = options.angleOffset ?? 0
  if (!pathEl || pathLength <= 0) {
    return { x: 0, y: 0, angle: 0, visible: false }
  }
  const travelled = Math.max(0, Math.min(pathLength, pathLength - dashOffset))
  const pt = pathEl.getPointAtLength(travelled)
  let angleDeg = 0
  if (travelled < look) {
    const p2 = pathEl.getPointAtLength(Math.min(pathLength, travelled + look))
    angleDeg = Math.atan2(p2.y - pt.y, p2.x - pt.x) * (180 / Math.PI)
  } else {
    const p0 = pathEl.getPointAtLength(travelled - look)
    angleDeg = Math.atan2(pt.y - p0.y, pt.x - p0.x) * (180 / Math.PI)
  }
  return {
    x: pt.x,
    y: pt.y,
    angle: angleDeg + angleOffset,
    visible: true
  }
}

/**
 * Trouve une distance curvilinéaire sur le path dont le point a une ordonnée Y proche de targetY
 * (repère SVG, origine en haut du conteneur). Utilisé pour garder le colibri au centre vertical du viewport.
 *
 * @param {SVGPathElement} pathEl
 * @param {number} pathLength
 * @param {number} targetY
 * @param {number} [samples]
 * @returns {number} travelled dans [0, pathLength]
 */
export function approximateTravelledForPathY (pathEl, pathLength, targetY, samples = 72) {
  if (!pathEl || pathLength <= 0) return 0
  const n = Math.max(12, samples)
  let bestT = 0
  let bestErr = Infinity
  for (let i = 0; i <= n; i++) {
    const t = (pathLength * i) / n
    const y = pathEl.getPointAtLength(t).y
    const err = Math.abs(y - targetY)
    if (err < bestErr) {
      bestErr = err
      bestT = t
    }
  }
  const span = pathLength / n
  let lo = Math.max(0, bestT - span)
  let hi = Math.min(pathLength, bestT + span)
  for (let k = 0; k < 14; k++) {
    const t1 = lo + (hi - lo) / 3
    const t2 = hi - (hi - lo) / 3
    const e1 = Math.abs(pathEl.getPointAtLength(t1).y - targetY)
    const e2 = Math.abs(pathEl.getPointAtLength(t2).y - targetY)
    if (e1 < e2) hi = t2
    else lo = t1
  }
  return Math.max(0, Math.min(pathLength, (lo + hi) / 2))
}
