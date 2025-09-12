import { describe, it, expect } from "bun:test"
import { convertElementToPrimitives } from "../../src/lib/convert-element-to-primitive"

const circuitElements: any[] = [
  {
    type: "pcb_plated_hole",
    shape: "circular_hole_with_rect_pad",
    x: 0,
    y: 0,
    hole_diameter: 0.6,
    rect_pad_width: 2,
    rect_pad_height: 2,
    rect_border_radius: 0.2,
  },
  {
    type: "pcb_plated_hole",
    shape: "pill_hole_with_rect_pad",
    x: 5,
    y: 0,
    hole_width: 1,
    hole_height: 2,
    rect_pad_width: 3,
    rect_pad_height: 4,
    rect_border_radius: 0.3,
  },
  {
    type: "pcb_plated_hole",
    shape: "rotated_pill_hole_with_rect_pad",
    x: 10,
    y: 0,
    hole_width: 1,
    hole_height: 2,
    hole_ccw_rotation: 45,
    rect_pad_width: 3,
    rect_pad_height: 4,
    rect_ccw_rotation: 45,
    rect_border_radius: 0.4,
  },
  {
    type: "pcb_smtpad",
    shape: "rect",
    x: 0,
    y: 5,
    width: 2,
    height: 3,
    layer: "top",
    rect_border_radius: 0.1,
  },
  {
    type: "pcb_smtpad",
    shape: "rotated_rect",
    x: 5,
    y: 5,
    width: 2,
    height: 3,
    layer: "top",
    ccw_rotation: 45,
    rect_border_radius: 0.2,
  },
]

describe("rect_border_radius conversion", () => {
  it("converts rect-based elements with border radius", () => {
    const primitives = circuitElements.flatMap((el) =>
      convertElementToPrimitives(el as any, circuitElements as any),
    )
    expect(primitives).toMatchSnapshot()
  })
})
