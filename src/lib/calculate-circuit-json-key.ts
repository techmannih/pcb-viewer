import type { AnyCircuitElement, PcbTrace } from "circuit-json"

const getElementId = (element: any): string =>
  element.pcb_smtpad_id ||
  element.pcb_plated_hole_id ||
  element.pcb_trace_id ||
  element.pcb_board_id ||
  element.type

const getBoundsOfPcbElements = (elements: any[]) => {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const el of elements) {
    if (el.type === "pcb_smtpad") {
      const x1 = el.x - el.width / 2
      const y1 = el.y - el.height / 2
      const x2 = el.x + el.width / 2
      const y2 = el.y + el.height / 2
      minX = Math.min(minX, x1)
      minY = Math.min(minY, y1)
      maxX = Math.max(maxX, x2)
      maxY = Math.max(maxY, y2)
    } else if (el.type === "pcb_trace") {
      for (const r of el.route ?? []) {
        minX = Math.min(minX, r.x)
        minY = Math.min(minY, r.y)
        maxX = Math.max(maxX, r.x)
        maxY = Math.max(maxY, r.y)
      }
    } else {
      minX = Math.min(minX, el.x ?? 0)
      minY = Math.min(minY, el.y ?? 0)
      maxX = Math.max(maxX, el.x ?? 0)
      maxY = Math.max(maxY, el.y ?? 0)
    }
  }

  if (minX === Infinity) {
    minX = minY = maxX = maxY = 0
  }

  return { minX, minY, maxX, maxY }
}

const formatToFixed4 = (value: number): string =>
  Number.isFinite(value) ? value.toFixed(4) : "NaN"

const generateHash = (input: string): number => {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) + hash + input.charCodeAt(i)
  }
  return Math.abs(hash)
}

export const calculateCircuitJsonKey = (
  circuitJson?: AnyCircuitElement[],
): string => {
  if (!circuitJson?.length) {
    return "0"
  }

  const elementSignatures: string[] = []

  for (const element of circuitJson) {
    if (!element?.type?.startsWith("pcb_")) {
      continue
    }

    const id = getElementId(element)

    const bounds = getBoundsOfPcbElements([element])

    const boundsStr = [
      formatToFixed4(bounds.minX),
      formatToFixed4(bounds.minY),
      formatToFixed4(bounds.maxX),
      formatToFixed4(bounds.maxY),
    ].join(",")
    let signature = `${id}:${boundsStr}`
    if (element.type === "pcb_trace") {
      const routeLength = ((element as PcbTrace).route ?? []).length
      signature += `:${routeLength}`
    }

    elementSignatures.push(signature)
  }

  if (elementSignatures.length === 0) {
    return "0"
  }

  elementSignatures.sort()

  const combinedSignature = elementSignatures.join(",")
  const hash = generateHash(combinedSignature)

  return `${elementSignatures.length}_${hash.toString(36)}`
}
