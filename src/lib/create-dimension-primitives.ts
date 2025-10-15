import type { AnyCircuitElement } from "circuit-json"
import type { Primitive } from "./types"

export type DimensionPrimitiveMeta = {
  _element: AnyCircuitElement
  _parent_pcb_component?: AnyCircuitElement
  _parent_source_component?: AnyCircuitElement
  _source_port?: AnyCircuitElement
}

export type CreateDimensionPrimitivesArgs = {
  element: AnyCircuitElement
  layer: string
  from: { x: number; y: number }
  to: { x: number; y: number }
  meta: DimensionPrimitiveMeta
  getId: (prefix: string) => string
  offset?: number
}

const DEFAULT_LINE_WIDTH = 0.4
const DEFAULT_TEXT_SIZE = 10
const TEXT_PADDING = 1.5

export const createDimensionPrimitives = ({
  element,
  layer,
  from,
  to,
  meta,
  getId,
  offset,
}: CreateDimensionPrimitivesArgs): (Primitive & DimensionPrimitiveMeta)[] => {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy)

  if (!Number.isFinite(length) || length === 0) {
    return []
  }

  const normal = {
    x: -dy / length,
    y: dx / length,
  }

  const offsetValue = typeof offset === "number" ? offset : 0
  const offsetVector = {
    x: normal.x * offsetValue,
    y: normal.y * offsetValue,
  }

  const startPoint = {
    x: from.x + offsetVector.x,
    y: from.y + offsetVector.y,
  }

  const endPoint = {
    x: to.x + offsetVector.x,
    y: to.y + offsetVector.y,
  }

  const midpoint = {
    x: (startPoint.x + endPoint.x) / 2,
    y: (startPoint.y + endPoint.y) / 2,
  }

  const extensionStart: Primitive & DimensionPrimitiveMeta = {
    _pcb_drawing_object_id: getId("dimension_extension"),
    pcb_drawing_type: "line",
    x1: from.x,
    y1: from.y,
    x2: startPoint.x,
    y2: startPoint.y,
    width: DEFAULT_LINE_WIDTH,
    layer,
    ...meta,
  }

  const extensionEnd: Primitive & DimensionPrimitiveMeta = {
    _pcb_drawing_object_id: getId("dimension_extension"),
    pcb_drawing_type: "line",
    x1: to.x,
    y1: to.y,
    x2: endPoint.x,
    y2: endPoint.y,
    width: DEFAULT_LINE_WIDTH,
    layer,
    ...meta,
  }

  const dimensionLine: Primitive & DimensionPrimitiveMeta = {
    _pcb_drawing_object_id: getId("dimension_line"),
    pcb_drawing_type: "line",
    x1: startPoint.x,
    y1: startPoint.y,
    x2: endPoint.x,
    y2: endPoint.y,
    width: DEFAULT_LINE_WIDTH,
    layer,
    ...meta,
  }

  const label = (() => {
    const candidate = (element as any)?.text ?? (element as any)?.label
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim()
    }
    return length.toFixed(2)
  })()

  const textSize = (() => {
    const candidate = (element as any)?.text_height ?? (element as any)?.font_size
    return typeof candidate === "number" && Number.isFinite(candidate)
      ? candidate
      : DEFAULT_TEXT_SIZE
  })()

  let textRotation = (Math.atan2(dy, dx) * 180) / Math.PI
  if (textRotation > 90) textRotation -= 180
  if (textRotation < -90) textRotation += 180

  const textOffsetVector = {
    x: offsetVector.x + normal.x * TEXT_PADDING,
    y: offsetVector.y + normal.y * TEXT_PADDING,
  }

  const textPrimitive: Primitive & DimensionPrimitiveMeta = {
    _pcb_drawing_object_id: getId("dimension_text"),
    pcb_drawing_type: "text",
    x: midpoint.x + textOffsetVector.x,
    y: midpoint.y + textOffsetVector.y,
    text: label,
    size: textSize,
    align: "center",
    ccw_rotation: textRotation,
    layer,
    ...meta,
  }

  return [extensionStart, extensionEnd, dimensionLine, textPrimitive]
}
