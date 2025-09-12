import { describe, it, expect } from "bun:test"
import { circuitToSvg } from "circuit-to-svg"
import type { AnyCircuitElement } from "circuit-json"

describe("rect_border_radius rendering", () => {
  it("renders shapes with rect_border_radius", () => {
    const circuit: AnyCircuitElement[] = [
      {
        type: "pcb_plated_hole",
        pcb_plated_hole_id: "h1",
        shape: "circular_hole_with_rect_pad",
        x: 40,
        y: 50,
        hole_diameter: 20,
        rect_pad_width: 50,
        rect_pad_height: 30,
        rect_border_radius: 5,
      } as any,
      {
        type: "pcb_plated_hole",
        pcb_plated_hole_id: "h2",
        shape: "pill_hole_with_rect_pad",
        x: 120,
        y: 50,
        hole_width: 20,
        hole_height: 10,
        rect_pad_width: 50,
        rect_pad_height: 30,
        rect_border_radius: 5,
      } as any,
      {
        type: "pcb_plated_hole",
        pcb_plated_hole_id: "h3",
        shape: "rotated_pill_hole_with_rect_pad",
        x: 200,
        y: 50,
        hole_width: 20,
        hole_height: 10,
        hole_ccw_rotation: 45,
        rect_pad_width: 50,
        rect_pad_height: 30,
        rect_ccw_rotation: 45,
        rect_border_radius: 5,
      } as any,
      {
        type: "pcb_smtpad",
        pcb_smtpad_id: "s1",
        shape: "rect",
        x: 280,
        y: 50,
        width: 50,
        height: 30,
        layer: "top",
        rect_border_radius: 5,
      } as any,
      {
        type: "pcb_smtpad",
        pcb_smtpad_id: "s2",
        shape: "rotated_rect",
        x: 360,
        y: 50,
        width: 50,
        height: 30,
        layer: "top",
        ccw_rotation: 45,
        rect_border_radius: 5,
      } as any,
    ]

    const svg = circuitToSvg(circuit as any)
    expect(svg).toMatchSnapshot()
  })
})
