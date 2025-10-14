import type { AnyCircuitElement } from "circuit-json"
import type { Primitive } from "./types"
import type { PrimitiveMetadata } from "./primitive-metadata"
import { getNewPcbDrawingObjectId } from "./pcb-drawing-id"

type DimensionMeta = PrimitiveMetadata & { _element: AnyCircuitElement }

type DimensionPoint = { x: number; y: number }

type DimensionElement = {
  arrow_size?: unknown
  font_size?: unknown
  text?: string
  color?: unknown
  offset?: unknown
}

type CreateDimensionPrimitivesOptions = {
  element: DimensionElement
  layer: string
  from: DimensionPoint
  to: DimensionPoint
  meta: DimensionMeta
  offset?: unknown
}

const parseLengthValue = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = parseFloat(value)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }

  return fallback
}

const applyColorOverride = (
  primitives: (Primitive & PrimitiveMetadata)[],
  color: unknown,
) => {
  if (typeof color !== "string") return

  const trimmed = color.trim()
  if (!trimmed) return

  for (const primitive of primitives) {
    primitive.color = trimmed
  }
}

export const createDimensionPrimitives = ({
  element,
  layer,
  from,
  to,
  meta,
  offset,
}: CreateDimensionPrimitivesOptions): (Primitive & DimensionMeta)[] => {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy)

  if (!Number.isFinite(length) || length === 0) {
    return []
  }

  const unitVector = { x: dx / length, y: dy / length }
  const perpendicular = { x: -unitVector.y, y: unitVector.x }

  const arrowSizeFallback = Math.max(length * 0.05, 0.5)
  const arrowSize = Math.min(
    parseLengthValue(element.arrow_size, arrowSizeFallback),
    length / 2,
  )
  const arrowWidth = Math.max(arrowSize * 0.6, arrowSize * 0.3)

  const lineWidth = Math.max(arrowSize / 5, 0.05)

  const offsetDistance = parseLengthValue(offset ?? element.offset, 0)
  const offsetVector = {
    x: perpendicular.x * offsetDistance,
    y: perpendicular.y * offsetDistance,
  }

  const startPoint = {
    x: from.x + offsetVector.x,
    y: from.y + offsetVector.y,
  }
  const endPoint = {
    x: to.x + offsetVector.x,
    y: to.y + offsetVector.y,
  }

  const primitives: (Primitive & DimensionMeta)[] = []

  if (offsetDistance !== 0) {
    primitives.push({
      _pcb_drawing_object_id: getNewPcbDrawingObjectId("line"),
      pcb_drawing_type: "line",
      x1: from.x,
      y1: from.y,
      x2: startPoint.x,
      y2: startPoint.y,
      width: lineWidth,
      layer,
      ...meta,
    })

    primitives.push({
      _pcb_drawing_object_id: getNewPcbDrawingObjectId("line"),
      pcb_drawing_type: "line",
      x1: to.x,
      y1: to.y,
      x2: endPoint.x,
      y2: endPoint.y,
      width: lineWidth,
      layer,
      ...meta,
    })
  }

  primitives.push({
    _pcb_drawing_object_id: getNewPcbDrawingObjectId("line"),
    pcb_drawing_type: "line",
    x1: startPoint.x,
    y1: startPoint.y,
    x2: endPoint.x,
    y2: endPoint.y,
    width: lineWidth,
    layer,
    ...meta,
  })

  const addArrow = (tip: DimensionPoint, direction: 1 | -1) => {
    const base = {
      x: tip.x + unitVector.x * arrowSize * direction,
      y: tip.y + unitVector.y * arrowSize * direction,
    }
    const left = {
      x: base.x + perpendicular.x * arrowWidth,
      y: base.y + perpendicular.y * arrowWidth,
    }
    const right = {
      x: base.x - perpendicular.x * arrowWidth,
      y: base.y - perpendicular.y * arrowWidth,
    }

    primitives.push({
      _pcb_drawing_object_id: getNewPcbDrawingObjectId("line"),
      pcb_drawing_type: "line",
      x1: tip.x,
      y1: tip.y,
      x2: left.x,
      y2: left.y,
      width: lineWidth,
      layer,
      ...meta,
    })

    primitives.push({
      _pcb_drawing_object_id: getNewPcbDrawingObjectId("line"),
      pcb_drawing_type: "line",
      x1: tip.x,
      y1: tip.y,
      x2: right.x,
      y2: right.y,
      width: lineWidth,
      layer,
      ...meta,
    })
  }

  addArrow(startPoint, 1)
  addArrow(endPoint, -1)

  const fontSize = parseLengthValue(element.font_size, 1)
  const trimmedText = typeof element.text === "string" ? element.text.trim() : ""
  const text = trimmedText.length > 0 ? trimmedText : `${length.toFixed(2)}mm`

  if (text) {
    const baseMidPoint = {
      x: (startPoint.x + endPoint.x) / 2,
      y: (startPoint.y + endPoint.y) / 2,
    }

    const offsetDirection = offsetDistance >= 0 ? 1 : -1
    const textDistanceFromLine = Math.max(fontSize, arrowSize) * 0.6

    const textPosition = {
      x:
        baseMidPoint.x +
        perpendicular.x * textDistanceFromLine * offsetDirection,
      y:
        baseMidPoint.y +
        perpendicular.y * textDistanceFromLine * offsetDirection,
    }

    let rotation = (Math.atan2(dy, dx) * 180) / Math.PI
    if (rotation > 180) rotation -= 360
    if (rotation > 90) rotation -= 180
    if (rotation < -90) rotation += 180

    primitives.push({
      _pcb_drawing_object_id: getNewPcbDrawingObjectId("text"),
      pcb_drawing_type: "text",
      text,
      x: textPosition.x,
      y: textPosition.y,
      size: fontSize,
      layer,
      align: "center",
      ccw_rotation: rotation,
      ...meta,
    })
  }

  applyColorOverride(primitives, element.color)

  return primitives
}
