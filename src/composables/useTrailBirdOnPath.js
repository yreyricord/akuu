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
