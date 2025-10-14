import type { AnyCircuitElement, PcbSmtPadRotatedPill } from "circuit-json"
import { su } from "@tscircuit/circuit-json-util"
import type { Primitive } from "./types"
import { type Point, getExpandedStroke } from "./util/expand-stroke"

type MetaData = {
  _parent_pcb_component?: any
  _parent_source_component?: any
  _source_port?: any
}

let globalPcbDrawingObjectCount = 0

export const getNewPcbDrawingObjectId = (prefix: string) =>
  `${prefix}_${globalPcbDrawingObjectCount++}`

const parseLengthValue = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase()
    if (!trimmed) return fallback

    const numericMatch = trimmed.match(/-?\d+(?:\.\d+)?/)
    if (!numericMatch) return fallback

    const parsed = Number.parseFloat(numericMatch[0])
    if (!Number.isFinite(parsed)) return fallback

    if (trimmed.endsWith("mil")) return parsed * 0.0254
    if (trimmed.endsWith("mm")) return parsed
    if (trimmed.endsWith("cm")) return parsed * 10
    if (trimmed.endsWith("um")) return parsed / 1000
    if (trimmed.endsWith("in")) return parsed * 25.4
    if (trimmed.endsWith("\"")) return parsed * 25.4
    if (trimmed.endsWith("m")) return parsed * 1000

    return parsed
  }

  return fallback
}

const isPointLike = (value: unknown): value is Point =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as any).x === "number" &&
  typeof (value as any).y === "number"

const getPointFromElement = (
  element: AnyCircuitElement | undefined,
): Point | null => {
  if (!element) return null
  const candidate = element as any

  if (typeof candidate.x === "number" && typeof candidate.y === "number") {
    return { x: candidate.x, y: candidate.y }
  }

  if (
    candidate.center &&
    typeof candidate.center.x === "number" &&
    typeof candidate.center.y === "number"
  ) {
    return { x: candidate.center.x, y: candidate.center.y }
  }

  if (
    candidate.anchor_position &&
    typeof candidate.anchor_position.x === "number" &&
    typeof candidate.anchor_position.y === "number"
  ) {
    return {
      x: candidate.anchor_position.x,
      y: candidate.anchor_position.y,
    }
  }

  if (
    candidate.position &&
    typeof candidate.position.x === "number" &&
    typeof candidate.position.y === "number"
  ) {
    return { x: candidate.position.x, y: candidate.position.y }
  }

  if (
    candidate.point &&
    typeof candidate.point.x === "number" &&
    typeof candidate.point.y === "number"
  ) {
    return { x: candidate.point.x, y: candidate.point.y }
  }

  return null
}

const findElementReferencingId = (
  id: string,
  allElements: AnyCircuitElement[],
  exclude?: AnyCircuitElement,
): AnyCircuitElement | undefined => {
  for (const element of allElements) {
    if (exclude && element === exclude) continue

    const entries = Object.entries(element as Record<string, unknown>)
    for (const [key, value] of entries) {
      if (typeof value === "string" && value === id && key.endsWith("_id")) {
        return element
      }
    }
  }

  return undefined
}

const resolvePointReference = (
  ref: Point | string | undefined,
  allElements: AnyCircuitElement[],
  currentElement: AnyCircuitElement,
): Point | null => {
  if (!ref) return null
  if (isPointLike(ref)) return ref

  if (typeof ref === "string") {
    const parsedPoint = ref
      .split(/[;,\s]+/)
      .map((part) => Number.parseFloat(part))

    if (parsedPoint.length === 2 && parsedPoint.every((n) => Number.isFinite(n))) {
      return { x: parsedPoint[0], y: parsedPoint[1] }
    }

    const referencedElement = findElementReferencingId(ref, allElements, currentElement)
    const point = getPointFromElement(referencedElement)
    if (point) return point
  }

  return null
}

const rotateVector = (vector: Point, angle: number): Point => {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: vector.x * cos - vector.y * sin,
    y: vector.x * sin + vector.y * cos,
  }
}

export const convertElementToPrimitives = (
  element: AnyCircuitElement,
  allElements: AnyCircuitElement[],
): (Primitive & MetaData)[] => {
  const _parent_pcb_component =
    "pcb_component_id" in element
      ? allElements.find(
          (elm) =>
            elm.type === "pcb_component" &&
            elm.pcb_component_id === element.pcb_component_id,
        )
      : undefined
  const _parent_source_component =
    _parent_pcb_component && "source_component_id" in _parent_pcb_component
      ? allElements.find(
          (elm) =>
            elm.type === "source_component" &&
            elm.source_component_id ===
              _parent_pcb_component.source_component_id,
        )
      : undefined

  const _source_port_id =
    "source_port_id" in element
      ? element.source_port_id
      : "pcb_port_id" in element
        ? su(allElements as any).pcb_port.get(element.pcb_port_id!)
            ?.source_port_id
        : undefined

  const _source_port = _source_port_id
    ? allElements.find(
        (e) => e.type === "source_port" && e.source_port_id === _source_port_id,
      )
    : undefined

  switch (element.type) {
    case "pcb_board": {
      const { width, height, center, outline } = element

      if (outline && outline.length > 2) {
        return outline.map((point, index, array) => {
          return {
            _pcb_drawing_object_id: `line_${globalPcbDrawingObjectCount++}`,
            pcb_drawing_type: "line",
            x1: point.x,
            y1: point.y,
            x2: index === array.length - 1 ? array[0].x : array[index + 1].x,
            y2: index === array.length - 1 ? array[0].y : array[index + 1].y,
            width: 1, // Add the required width property
            zoomIndependent: true,
            layer: "board",
            _element: element,
          }
        })
      }
      return [
        {
          _pcb_drawing_object_id: `line_${globalPcbDrawingObjectCount++}`,
          pcb_drawing_type: "line",
          x1: center.x - width / 2,
          y1: center.y - height / 2,
          x2: center.x + width / 2,
          y2: center.y - height / 2,
          width: 1, // Add the required width property
          zoomIndependent: true,
          layer: "board",
          _element: element,
        },
        {
          _pcb_drawing_object_id: `line_${globalPcbDrawingObjectCount++}`,
          pcb_drawing_type: "line",
          x1: center.x - width / 2,
          y1: center.y + height / 2,
          x2: center.x + width / 2,
          y2: center.y + height / 2,
          width: 1, // Add the required width property
          zoomIndependent: true,
          layer: "board",
          _element: element,
        },
        {
          _pcb_drawing_object_id: `line_${globalPcbDrawingObjectCount++}`,
          pcb_drawing_type: "line",
          x1: center.x - width / 2,
          y1: center.y - height / 2,
          x2: center.x - width / 2,
          y2: center.y + height / 2,
          width: 1, // Add the required width property
          zoomIndependent: true,
          layer: "board",
          _element: element,
        },
        {
          _pcb_drawing_object_id: `line_${globalPcbDrawingObjectCount++}`,
          pcb_drawing_type: "line",
          x1: center.x + width / 2,
          y1: center.y - height / 2,
          x2: center.x + width / 2,
          y2: center.y + height / 2,
          width: 1, // Add the required width property
          zoomIndependent: true,
          layer: "board",
          _element: element,
        },
      ]
    }
    case "pcb_smtpad": {
      if (element.shape === "rect" || element.shape === "rotated_rect") {
        const { shape, x, y, width, height, layer, rect_border_radius } =
          element

        return [
          {
            _pcb_drawing_object_id: `rect_${globalPcbDrawingObjectCount++}`,
            pcb_drawing_type: "rect",
            x,
            y,
            w: width,
            h: height,
            layer: layer || "top",
            _element: element,
            _parent_pcb_component,
            _parent_source_component,
            _source_port,
            ccw_rotation: (element as any).ccw_rotation,
            roundness: rect_border_radius,
          },
        ]
      } else if (element.shape === "circle") {
        const { x, y, radius, layer } = element
        return [
          {
            _pcb_drawing_object_id: `circle_${globalPcbDrawingObjectCount++}`,
            pcb_drawing_type: "circle",
            x,
            y,
            r: radius,
            layer: layer || "top",
            _element: element,
            _parent_pcb_component,
            _parent_source_component,
            _source_port,
          },
        ]
      } else if (element.shape === "polygon") {
        const { layer, points } = element
        return [
          {
            _pcb_drawing_object_id: `polygon_${globalPcbDrawingObjectCount++}`,
            pcb_drawing_type: "polygon",
            points,
            layer: layer || "top",
            _element: element,
            _parent_pcb_component,
            _parent_source_component,
            _source_port,
          },
        ]
      } else if (element.shape === "pill" || element.shape === "rotated_pill") {
        const { x, y, width, height, layer } = element
        return [
          {
            _pcb_drawing_object_id: `pill_${globalPcbDrawingObjectCount++}`,
            pcb_drawing_type: "pill",
            x,
            y,
            w: width,
            h: height,
            layer: layer || "top",
            _element: element,
            _parent_pcb_component,
            _parent_source_component,
            _source_port,
            ccw_rotation: (element as PcbSmtPadRotatedPill).ccw_rotation,
          },
        ]
      }
      return []
    }
    case "pcb_hole": {
      if (element.hole_shape === "circle" || !element.hole_shape) {
        const { x, y, hole_diameter } = element

        return [
          {
            _pcb_drawing_object_id: `circle_${globalPcbDrawingObjectCount++}`,
            pcb_drawing_type: "circle",
            x,
            y,
            r: hole_diameter / 2,
            layer: "drill",
            _element: element,
            _parent_pcb_component,
            _parent_source_component,
          },
        ]
      }
      // TODO square hole
      // TODO oval hole
      return []
    }
    case "pcb_plated_hole": {
      if (element.shape === "circle") {
        const { x, y, hole_diameter, outer_diameter } = element

        return [
          {
            _pcb_drawing_object_id: `circle_${globalPcbDrawingObjectCount++}`,
            pcb_drawing_type: "circle",
            x,
            y,
            r: outer_diameter / 2,
            // TODO support layer on pcb_plated_hole
            layer: "top",
            _element: element,
            _parent_pcb_component,
            _parent_source_component,
            _source_port,
          },
          {
            _pcb_drawing_object_id: `circle_${globalPcbDrawingObjectCount++}`,
            pcb_drawing_type: "circle",
            x,
            y,
            r: hole_diameter / 2,
            // TODO support layer on pcb_plated_hole
            layer: "drill",
            _element: element,

            // double highlights are annoying
            // _element: element,
          },
        ]
      } else if (element.shape === "oval") {
        const { x, y, outer_height, outer_width, hole_height, hole_width } =
          element

        return [
          {
            _pcb_drawing_object_id: `oval_${globalPcbDrawingObjectCount++}`,
            pcb_drawing_type: "oval",
            x,
            y,
            rX: outer_width / 2,
            rY: outer_height / 2,
            layer: "top", // TODO: Confirm layer handling for oval plated holes
            _element: element,
            _parent_pcb_component,
            _parent_source_component,
            _source_port,
          },
          {
            _pcb_drawing_object_id: `oval_${globalPcbDrawingObjectCount++}`,
            _element: element,
            pcb_drawing_type: "oval",
            x,
            y,
            rX: hole_width / 2,
            rY: hole_height / 2,
            layer: "drill",
          },
        ]
      } else if (element.shape === "pill") {
        const { x, y, outer_height, outer_width, hole_height, hole_width } =
          element

        return [
          {
            _pcb_drawing_object_id: `pill_${globalPcbDrawingObjectCount++}`,
            pcb_drawing_type: "pill",
            x,
            y,
            w: outer_width,
            h: outer_height,
            layer: "top", // TODO: Confirm layer handling for oval plated holes
            _element: element,
            _parent_pcb_component,
            _parent_source_component,
            _source_port,
            ccw_rotation: element.ccw_rotation,
          },
          {
            _pcb_drawing_object_id: `pill_${globalPcbDrawingObjectCount++}`,
            _element: element,
            pcb_drawing_type: "pill",
            x,
            y,
            w: hole_width,
            h: hole_height,
            layer: "drill",
            ccw_rotation: element.ccw_rotation,
          },
        ]
      } else if (element.shape === "circular_hole_with_rect_pad") {
        const {
          x,
          y,
          hole_diameter,
          rect_pad_width,
          rect_pad_height,
          rect_border_radius,
        } = element
        const hole_offset_x = (element as any).hole_offset_x ?? 0
        const hole_offset_y = (element as any).hole_offset_y ?? 0

        return [
          {
            _pcb_drawing_object_id: `rect_${globalPcbDrawingObjectCount++}`,
            pcb_drawing_type: "rect",
            x,
            y,
            w: rect_pad_width,
            h: rect_pad_height,
            layer: "top", // Rectangular pad on top layer
            _element: element,
            _parent_pcb_component,
            _parent_source_component,
            _source_port,
            roundness: rect_border_radius,
          },
          {
            _pcb_drawing_object_id: `circle_${globalPcbDrawingObjectCount++}`,
            _element: element,
            pcb_drawing_type: "circle",
            x: x + hole_offset_x,
            y: y + hole_offset_y,
            r: hole_diameter / 2,
            layer: "drill", // Circular hole in drill layer
          },
        ]
      } else if (element.shape === "pill_hole_with_rect_pad") {
        const {
          x,
          y,
          hole_width,
          hole_height,
          rect_pad_width,
          rect_pad_height,
          rect_border_radius,
        } = element

        return [
          {
            _pcb_drawing_object_id: `rect_${globalPcbDrawingObjectCount++}`,
            pcb_drawing_type: "rect",
            x,
            y,
            w: rect_pad_width,
            h: rect_pad_height,
            layer: "top", // Rectangular pad on top layer
            _element: element,
            _parent_pcb_component,
            _parent_source_component,
            _source_port,
            roundness: rect_border_radius,
          },
          {
            _pcb_drawing_object_id: `pill_${globalPcbDrawingObjectCount++}`,
            _element: element,
            pcb_drawing_type: "pill",
            x,
            y,
            w: hole_width,
            h: hole_height,
            layer: "drill", // Pill-shaped hole in drill layer
          },
        ]
      } else if (element.shape === "rotated_pill_hole_with_rect_pad") {
        const {
          x,
          y,
          hole_width,
          hole_height,
          hole_ccw_rotation,
          rect_pad_width,
          rect_pad_height,
          rect_ccw_rotation,
          rect_border_radius,
        } = element as any // Use as any to access new properties

        return [
          {
            _pcb_drawing_object_id: `rect_${globalPcbDrawingObjectCount++}`,
            pcb_drawing_type: "rect",
            x,
            y,
            w: rect_pad_width,
            h: rect_pad_height,
            layer: "top", // Rectangular pad on top layer
            _element: element,
            _parent_pcb_component,
            _parent_source_component,
            _source_port,
            ccw_rotation: rect_ccw_rotation,
            roundness: rect_border_radius,
          },
          {
            _pcb_drawing_object_id: `pill_${globalPcbDrawingObjectCount++}`,
            _element: element,
            pcb_drawing_type: "pill",
            x,
            y,
            w: hole_width,
            h: hole_height,
            layer: "drill", // Pill-shaped hole in drill layer
            ccw_rotation: hole_ccw_rotation,
          },
        ]
      } else {
        return []
      }
    }
    case "pcb_keepout": {
      if (element.shape === "circle") {
        const { center, radius } = element

        return [
          {
            _pcb_drawing_object_id: `circle_${globalPcbDrawingObjectCount++}`,
            pcb_drawing_type: "circle",
            x: center.x,
            y: center.y,
            r: radius,
            layer: "top",
            _element: element,
            _parent_pcb_component,
            _parent_source_component,
            mesh_fill: true,
          },
        ]
      } else if (element.shape === "rect") {
        const { center, width, height } = element

        return [
          {
            _pcb_drawing_object_id: `rect_${globalPcbDrawingObjectCount++}`,
            pcb_drawing_type: "rect",
            x: center.x,
            y: center.y,
            w: width,
            h: height,
            layer: "top",
            _element: element,
            _parent_pcb_component,
            _parent_source_component,
            mesh_fill: true,
          },
        ]
      }
      break
    }
    case "pcb_trace": {
      const primitives: Primitive[] = []

      if (element.route_thickness_mode === "interpolated") {
        // Prepare the stroke input
        const strokeInput: Point[] = element.route.map((r) => ({
          x: r.x,
          y: r.y,
          trace_width: r.route_type === "wire" ? r.width : 0.5,
        }))

        // Use getExpandedStroke to generate the polygon points
        const expandedStroke = getExpandedStroke(strokeInput, 0.5) // Use 0.5 as default width

        const layer = (element.route[0] as any).layer

        // Generate a single polygon primitive from the expanded stroke
        primitives.push({
          _pcb_drawing_object_id: `polygon_${globalPcbDrawingObjectCount++}`,
          _element: element,
          pcb_drawing_type: "polygon",
          points: expandedStroke,
          layer, // same layer for all points
        })

        // Add circles for vias
        element.route.forEach((r) => {
          if (r.route_type === "via") {
            primitives.push({
              _pcb_drawing_object_id: `circle_${globalPcbDrawingObjectCount++}`,
              _element: element,
              pcb_drawing_type: "circle",
              x: r.x,
              y: r.y,
              r: (r as any).outer_diameter / 2,
              layer: (r as any).from_layer,
            })
          }
        })

        return primitives
      }
      let prevX: number | null = null
      let prevY: number | null = null

      for (const route of element.route) {
        if (route.route_type === "wire") {
          if (prevX !== null && prevY !== null) {
            primitives.push({
              _pcb_drawing_object_id: `line_${globalPcbDrawingObjectCount++}`,
              _element: element,
              pcb_drawing_type: "line",
              x1: prevX,
              y1: prevY,
              x2: route.x,
              y2: route.y,
              width: route.width,
              squareCap: false,
              layer: route.layer,
            })
          }

          prevX = route.x
          prevY = route.y
        }
      }

      return primitives
    }
    // The builder currently outputs these as smtpads and holes, so pcb_via isn't
    // used, but that maybe should be changed
    case "pcb_via": {
      const { x, y, outer_diameter, hole_diameter, from_layer, to_layer } =
        element

      return [
        {
          _pcb_drawing_object_id: `circle_${globalPcbDrawingObjectCount++}`,
          pcb_drawing_type: "circle",
          x,
          y,
          r: outer_diameter / 2,
          layer: from_layer!,
          _element: element,
          _parent_pcb_component,
          _parent_source_component,
        },
        {
          _pcb_drawing_object_id: `circle_${globalPcbDrawingObjectCount++}`,
          _element: element,
          pcb_drawing_type: "circle",
          x,
          y,
          r: hole_diameter / 2,
          layer: "drill",
          _parent_pcb_component,
          _parent_source_component,
        },
        {
          _pcb_drawing_object_id: `circle_${globalPcbDrawingObjectCount++}`,
          pcb_drawing_type: "circle",
          x,
          y,
          r: outer_diameter / 2,
          layer: to_layer!,
          _element: element,
          _parent_pcb_component,
          _parent_source_component,
        },
      ]
    }

    case "pcb_silkscreen_rect": {
      return [
        {
          _pcb_drawing_object_id: `rect_${globalPcbDrawingObjectCount++}`,
          pcb_drawing_type: "rect",
          x: element.center.x,
          y: element.center.y,
          w: element.width,
          h: element.height,
          layer:
            element.layer === "bottom" ? "bottom_silkscreen" : "top_silkscreen",
          stroke_width: element.stroke_width,
          is_filled: element.is_filled,
          has_stroke: element.has_stroke,
          is_stroke_dashed: element.is_stroke_dashed,
          _element: element,
        },
      ]
    }

    case "pcb_silkscreen_circle": {
      return [
        {
          _pcb_drawing_object_id: `circle_${globalPcbDrawingObjectCount++}`,
          pcb_drawing_type: "circle",
          x: element.center.x,
          y: element.center.y,
          r: element.radius,
          layer:
            element.layer === "bottom" ? "bottom_silkscreen" : "top_silkscreen",
        },
      ]
    }

    case "pcb_silkscreen_oval": {
      return [
        {
          _pcb_drawing_object_id: `oval_${globalPcbDrawingObjectCount++}`,
          pcb_drawing_type: "oval",
          x: element.center.x,
          y: element.center.y,
          rX: element.radius_x / 2,
          rY: element.radius_y / 2,
          layer:
            element.layer === "bottom" ? "bottom_silkscreen" : "top_silkscreen",
        },
      ]
    }

    // @ts-ignore
    case "pcb_silkscreen_pill": {
      return [
        {
          _pcb_drawing_object_id: `pill_${globalPcbDrawingObjectCount++}`,
          pcb_drawing_type: "pill",
          // @ts-ignore
          x: element.center.x,
          // @ts-ignore
          y: element.center.y,
          // @ts-ignore
          w: element.width,
          // @ts-ignore
          h: element.height,
          layer:
            // @ts-ignore
            element.layer === "bottom" ? "bottom_silkscreen" : "top_silkscreen",
        },
      ]
    }

    case "pcb_note_dimension":
    case "pcb_fabrication_note_dimension": {
      const isFabrication = element.type === "pcb_fabrication_note_dimension"
      const fromPoint = resolvePointReference(
        (element as any).from,
        allElements,
        element,
      )
      const toPoint = resolvePointReference(
        (element as any).to,
        allElements,
        element,
      )

      if (!fromPoint || !toPoint) {
        return []
      }

      const dx = toPoint.x - fromPoint.x
      const dy = toPoint.y - fromPoint.y
      const distance = Math.hypot(dx, dy)
      if (distance === 0) {
        return []
      }

      const unit: Point = { x: dx / distance, y: dy / distance }
      const normal: Point = { x: -unit.y, y: unit.x }

      const arrowSize = Math.max(parseLengthValue((element as any).arrow_size, 1), 0.01)
      const fontSize = Math.max(parseLengthValue((element as any).font_size, 1), 0.01)
      const offsetDistance = isFabrication
        ? parseLengthValue((element as any).offset, 0)
        : 0

      const startShifted: Point = {
        x: fromPoint.x + normal.x * offsetDistance,
        y: fromPoint.y + normal.y * offsetDistance,
      }
      const endShifted: Point = {
        x: toPoint.x + normal.x * offsetDistance,
        y: toPoint.y + normal.y * offsetDistance,
      }

      const midpoint: Point = {
        x: (startShifted.x + endShifted.x) / 2,
        y: (startShifted.y + endShifted.y) / 2,
      }

      const providedText =
        typeof (element as any).text === "string"
          ? (element as any).text.trim()
          : undefined

      const labelText = providedText && providedText.length
        ? providedText
        : distance.toFixed(2)

      const rawLayer = (element as any).layer
      const dimensionLayer = isFabrication
        ? rawLayer === "bottom" || rawLayer === "bottom_fabrication"
          ? "bottom_fabrication"
          : "top_fabrication"
        : "dwgs_user"

      const primitives: (Primitive & MetaData)[] = []
      const lineWidth = Math.max(arrowSize * 0.1, 0.05)
      const arrowAngle = Math.PI / 6

      const pushLine = (
        prefix: string,
        line: { x1: number; y1: number; x2: number; y2: number; width?: number },
      ) => {
        primitives.push({
          _pcb_drawing_object_id: getNewPcbDrawingObjectId(prefix),
          pcb_drawing_type: "line",
          x1: line.x1,
          y1: line.y1,
          x2: line.x2,
          y2: line.y2,
          width: line.width ?? lineWidth,
          squareCap: false,
          layer: dimensionLayer,
          _element: element,
          _parent_pcb_component,
          _parent_source_component,
          _source_port,
        })
      }

      const createArrow = (point: Point, direction: Point, prefix: string) => {
        const left = rotateVector(direction, arrowAngle)
        const right = rotateVector(direction, -arrowAngle)

        pushLine(prefix, {
          x1: point.x,
          y1: point.y,
          x2: point.x + left.x * arrowSize,
          y2: point.y + left.y * arrowSize,
        })

        pushLine(prefix, {
          x1: point.x,
          y1: point.y,
          x2: point.x + right.x * arrowSize,
          y2: point.y + right.y * arrowSize,
        })
      }

      if (Math.abs(offsetDistance) > 1e-6) {
        pushLine("dimension_extension", {
          x1: fromPoint.x,
          y1: fromPoint.y,
          x2: startShifted.x,
          y2: startShifted.y,
        })

        pushLine("dimension_extension", {
          x1: toPoint.x,
          y1: toPoint.y,
          x2: endShifted.x,
          y2: endShifted.y,
        })
      }

      pushLine("dimension", {
        x1: startShifted.x,
        y1: startShifted.y,
        x2: endShifted.x,
        y2: endShifted.y,
      })

      createArrow(startShifted, unit, "dimension_arrow")
      createArrow(endShifted, { x: -unit.x, y: -unit.y }, "dimension_arrow")

      if (labelText) {
        const textDistanceFromLine = Math.max(arrowSize * 1.2, fontSize * 0.6)
        const offsetSign = offsetDistance >= 0 ? 1 : -1
        const textPosition: Point = {
          x: midpoint.x + normal.x * textDistanceFromLine * offsetSign,
          y: midpoint.y + normal.y * textDistanceFromLine * offsetSign,
        }

        const angleDeg = ((Math.atan2(unit.y, unit.x) * 180) / Math.PI + 360) % 360
        let textAngleDeg = angleDeg
        if (textAngleDeg > 90 && textAngleDeg < 270) {
          textAngleDeg = (textAngleDeg + 180) % 360
        }

        primitives.push({
          _pcb_drawing_object_id: getNewPcbDrawingObjectId("dimension_text"),
          pcb_drawing_type: "text",
          x: textPosition.x,
          y: textPosition.y,
          layer: dimensionLayer,
          size: fontSize,
          align: "center",
          text: labelText,
          ccw_rotation: textAngleDeg,
          _element: element,
          _parent_pcb_component,
          _parent_source_component,
          _source_port,
        })
      }

      return primitives
    }

    case "pcb_silkscreen_line": {
      return [
        {
          _pcb_drawing_object_id: `line_${globalPcbDrawingObjectCount++}`,
          pcb_drawing_type: "line",
          x1: element.x1,
          y1: element.y1,
          x2: element.x2,
          y2: element.y2,
          width: 0.1, // TODO add strokewidth
          squareCap: false,
          layer:
            element.layer === "bottom" ? "bottom_silkscreen" : "top_silkscreen",
        },
      ]
    }

    case "pcb_fabrication_note_path":
    case "pcb_silkscreen_path": {
      const {
        pcb_component_id,
        route, // Array<{ x: number, y: number }>
        type,
      } = element

      let layer:
        | "bottom_silkscreen"
        | "top_silkscreen"
        | "bottom_fabrication"
        | "top_fabrication"
        | null

      if (type === "pcb_silkscreen_path") {
        layer =
          element.layer === "bottom" ? "bottom_silkscreen" : "top_silkscreen"
      } else if (type === "pcb_fabrication_note_path") {
        layer = "top_fabrication"
      }

      return route
        .slice(0, -1)
        .map((point, index) => {
          const nextPoint = route[index + 1]
          return {
            _pcb_drawing_object_id: `line_${globalPcbDrawingObjectCount++}`,
            pcb_drawing_type: "line",
            x1: point.x,
            y1: point.y,
            x2: nextPoint.x,
            y2: nextPoint.y,
            width: element.stroke_width ?? 0.1,
            squareCap: false,
            layer: layer!,
            _element: element,
            _parent_pcb_component,
            _parent_source_component,
            _source_port,
          } as Primitive & MetaData
        })
        .filter(Boolean)
    }

    case "pcb_silkscreen_text": {
      return [
        {
          _pcb_drawing_object_id: `text_${globalPcbDrawingObjectCount++}`,
          pcb_drawing_type: "text",
          x: element.anchor_position.x,
          y: element.anchor_position.y,
          layer:
            element.layer === "bottom" ? "bottom_silkscreen" : "top_silkscreen",
          align: element.anchor_alignment ?? "center",
          text: element.text,
          size: element.font_size, // Add the required 'size' property
          ccw_rotation: element.ccw_rotation,
        },
      ]
    }
    case "pcb_copper_pour": {
      const pour = element as any

      switch (pour.shape) {
        case "rect": {
          const { center, width, height, layer, rotation } = pour
          return [
            {
              _pcb_drawing_object_id: getNewPcbDrawingObjectId(
                "pcb_copper_pour_rect",
              ),
              pcb_drawing_type: "rect",
              x: center.x,
              y: center.y,
              w: width,
              h: height,
              layer: layer,
              _element: element,
              ccw_rotation: rotation,
            },
          ]
        }
        case "polygon": {
          const { points, layer } = pour
          return [
            {
              _pcb_drawing_object_id: getNewPcbDrawingObjectId(
                "pcb_copper_pour_polygon",
              ),
              pcb_drawing_type: "polygon",
              points: points,
              layer: layer,
              _element: element,
            },
          ]
        }
        case "brep": {
          const { brep_shape, layer } = pour
          return [
            {
              _pcb_drawing_object_id: getNewPcbDrawingObjectId(
                "pcb_copper_pour_brep",
              ),
              pcb_drawing_type: "polygon_with_arcs",
              brep_shape: brep_shape,
              layer: layer,
              _element: element,
            },
          ]
        }
      }
      return []
    }

    case "pcb_fabrication_note_text": {
      return [
        {
          _pcb_drawing_object_id: getNewPcbDrawingObjectId("text"),
          pcb_drawing_type: "text",
          x: element.anchor_position.x,
          y: element.anchor_position.y,
          layer:
            element.layer === "bottom"
              ? "bottom_fabrication"
              : "top_fabrication",
          size: element.font_size,
          align: element.anchor_alignment ?? "center",
          text: element.text,
        },
      ]
    }
    case "pcb_cutout": {
      const cutoutElement = element as any
      switch (cutoutElement.shape) {
        case "rect": {
          return [
            {
              _pcb_drawing_object_id:
                getNewPcbDrawingObjectId("pcb_cutout_rect"),
              pcb_drawing_type: "rect",
              x: cutoutElement.center.x,
              y: cutoutElement.center.y,
              w: cutoutElement.width,
              h: cutoutElement.height,
              layer: "drill",
              _element: element,
              _parent_pcb_component,
              _parent_source_component,
            },
          ]
        }
        case "circle": {
          return [
            {
              _pcb_drawing_object_id:
                getNewPcbDrawingObjectId("pcb_cutout_circle"),
              pcb_drawing_type: "circle",
              x: cutoutElement.center.x,
              y: cutoutElement.center.y,
              r: cutoutElement.radius,
              layer: "drill",
              _element: element,
              _parent_pcb_component,
              _parent_source_component,
            },
          ]
        }
        case "polygon": {
          return [
            {
              _pcb_drawing_object_id:
                getNewPcbDrawingObjectId("pcb_cutout_polygon"),
              pcb_drawing_type: "polygon",
              points: cutoutElement.points,
              layer: "drill",
              _element: element,
              _parent_pcb_component,
              _parent_source_component,
            },
          ]
        }
        default:
          console.warn(`Unsupported pcb_cutout shape: ${cutoutElement.shape}`)
          return []
      }
    }
  }

  // console.warn(`Unsupported element type: ${element.type}`)
  return []
}
