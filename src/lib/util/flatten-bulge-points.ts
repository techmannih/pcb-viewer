import type { PointWithBulge } from "../types"

const DEFAULT_SEGMENT_LENGTH_MM = 0.1
const EPSILON = 1e-9

const pointsApproximatelyEqual = (a: PointWithBulge, b: PointWithBulge) =>
  Math.abs(a.x - b.x) < EPSILON && Math.abs(a.y - b.y) < EPSILON

const createArcPoints = (
  start: PointWithBulge,
  end: PointWithBulge,
  bulge: number,
  segmentLength = DEFAULT_SEGMENT_LENGTH_MM,
) => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const chord = Math.hypot(dx, dy)

  if (chord < EPSILON) {
    return []
  }

  const angle = 4 * Math.atan(bulge)

  if (Math.abs(angle) < EPSILON) {
    return []
  }

  const radius = Math.abs(chord / (2 * Math.sin(angle / 2)))

  if (!Number.isFinite(radius) || radius < EPSILON) {
    return []
  }

  const mx = (start.x + end.x) / 2
  const my = (start.y + end.y) / 2
  const normDx = dx / chord
  const normDy = dy / chord
  const perpVx = -normDy
  const perpVy = normDx
  const distToCenter = Math.sqrt(
    Math.max(0, radius * radius - (chord / 2) ** 2),
  )

  const cx = mx + distToCenter * perpVx * Math.sign(bulge)
  const cy = my + distToCenter * perpVy * Math.sign(bulge)

  let startAngle = Math.atan2(start.y - cy, start.x - cx)
  let endAngle = Math.atan2(end.y - cy, end.x - cx)

  if (bulge > 0 && endAngle < startAngle) {
    endAngle += 2 * Math.PI
  } else if (bulge < 0 && endAngle > startAngle) {
    endAngle -= 2 * Math.PI
  }

  const arcLength = Math.abs(endAngle - startAngle) * radius
  const segments = Math.max(1, Math.ceil(arcLength / segmentLength))

  const points: { x: number; y: number }[] = []

  for (let i = 1; i < segments; i++) {
    const t = startAngle + ((endAngle - startAngle) * i) / segments
    points.push({
      x: cx + radius * Math.cos(t),
      y: cy + radius * Math.sin(t),
    })
  }

  return points
}

export const flattenBulgePoints = (
  rawPoints: PointWithBulge[] | undefined,
  segmentLength = DEFAULT_SEGMENT_LENGTH_MM,
) => {
  if (!Array.isArray(rawPoints) || rawPoints.length === 0) {
    return [] as { x: number; y: number }[]
  }

  const lastPoint = rawPoints[rawPoints.length - 1]
  const points =
    rawPoints.length > 1 && lastPoint && pointsApproximatelyEqual(rawPoints[0], lastPoint)
      ? rawPoints.slice(0, -1)
      : rawPoints

  const flattened: { x: number; y: number }[] = []

  for (let i = 0; i < points.length; i++) {
    const current = points[i]
    const next = points[(i + 1) % points.length]

    flattened.push({ x: current.x, y: current.y })

    const bulge = current.bulge ?? 0

    if (Math.abs(bulge) < EPSILON) {
      continue
    }

    const arcPoints = createArcPoints(current, next, bulge, segmentLength)

    for (const arcPoint of arcPoints) {
      flattened.push(arcPoint)
    }
  }

  return flattened
}

