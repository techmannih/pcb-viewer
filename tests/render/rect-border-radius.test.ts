import { describe, it, expect } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { convertElementToPrimitives } from "../../src/lib/convert-element-to-primitive"
import { drawPrimitives } from "../../src/lib/draw-primitives"
import { identity } from "transformation-matrix"

class LoggingDrawer {
  logs: any[] = []
  transform = identity()
  foregroundLayer = "top"
  equip() {}
  rect(opts: any) {
    this.logs.push({ type: "rect", ...opts })
  }
  rotatedRect(
    x: number,
    y: number,
    w: number,
    h: number,
    ccw_rotation: number,
    r?: number,
  ) {
    this.logs.push({
      type: "rotatedRect",
      x,
      y,
      w,
      h,
      ccw_rotation,
      r,
    })
  }
  pill(x: number, y: number, w: number, h: number) {
    this.logs.push({ type: "pill", x, y, w, h })
  }
  rotatedPill(
    x: number,
    y: number,
    w: number,
    h: number,
    ccw_rotation: number,
  ) {
    this.logs.push({
      type: "rotatedPill",
      x,
      y,
      w,
      h,
      ccw_rotation,
    })
  }
  circle(x: number, y: number, r: number) {
    this.logs.push({ type: "circle", x, y, r })
  }
  oval(x: number, y: number, rX: number, rY: number) {
    this.logs.push({ type: "oval", x, y, rX, rY })
  }
}

describe("rect_border_radius rendering", () => {
  it("draws primitives with border radius", () => {
    const elements: AnyCircuitElement[] = [
      {
        type: "pcb_plated_hole",
        shape: "circular_hole_with_rect_pad",
        x: 10,
        y: 10,
        hole_diameter: 2,
        rect_pad_width: 4,
        rect_pad_height: 4,
        rect_border_radius: 0.5,
        pcb_component_id: "c1",
        pcb_plated_hole_id: "h1",
      } as any,
      {
        type: "pcb_plated_hole",
        shape: "pill_hole_with_rect_pad",
        x: 20,
        y: 10,
        hole_width: 2,
        hole_height: 4,
        rect_pad_width: 6,
        rect_pad_height: 6,
        rect_border_radius: 0.5,
        pcb_component_id: "c1",
        pcb_plated_hole_id: "h2",
      } as any,
      {
        type: "pcb_plated_hole",
        shape: "rotated_pill_hole_with_rect_pad",
        x: 30,
        y: 10,
        hole_width: 2,
        hole_height: 4,
        hole_ccw_rotation: 45,
        rect_pad_width: 6,
        rect_pad_height: 6,
        rect_ccw_rotation: 45,
        rect_border_radius: 0.5,
        pcb_component_id: "c1",
        pcb_plated_hole_id: "h3",
      } as any,
      {
        type: "pcb_smtpad",
        shape: "rect",
        x: 40,
        y: 10,
        width: 6,
        height: 6,
        layer: "top",
        rect_border_radius: 0.5,
        pcb_smtpad_id: "p1",
        pcb_component_id: "c1",
      } as any,
      {
        type: "pcb_smtpad",
        shape: "rotated_rect",
        x: 50,
        y: 10,
        width: 6,
        height: 6,
        layer: "top",
        ccw_rotation: 30,
        rect_border_radius: 0.5,
        pcb_smtpad_id: "p2",
        pcb_component_id: "c1",
      } as any,
    ]

    const primitives = elements.flatMap((e) =>
      convertElementToPrimitives(e, elements),
    )

    const drawer = new LoggingDrawer()
    drawPrimitives(drawer as any, primitives)

    expect(drawer.logs).toMatchSnapshot()
  })
})
