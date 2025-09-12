import { describe, it, expect } from "bun:test"
import { createCanvas } from "canvas"
import { Drawer } from "../../src/lib/Drawer"
import { convertElementToPrimitives } from "../../src/lib/convert-element-to-primitive"
import {
  drawRect,
  drawRotatedRect,
  drawCircle,
  drawPill,
  drawRotatedPill,
} from "../../src/lib/draw-primitives"

// Test rendering of various shapes with rect_border_radius

describe("rect_border_radius rendering", () => {
  it("renders shapes with rounded rectangles", () => {
    const elements: any[] = [
      {
        type: "pcb_smtpad",
        shape: "rect",
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        layer: "top",
        rect_border_radius: 0.2,
      },
      {
        type: "pcb_smtpad",
        shape: "rotated_rect",
        x: 2,
        y: 0,
        width: 1,
        height: 1,
        layer: "top",
        rect_border_radius: 0.2,
        ccw_rotation: 45,
      },
      {
        type: "pcb_plated_hole",
        shape: "circular_hole_with_rect_pad",
        x: 4,
        y: 0,
        hole_diameter: 0.5,
        rect_pad_width: 1,
        rect_pad_height: 1,
        rect_border_radius: 0.2,
      },
      {
        type: "pcb_plated_hole",
        shape: "pill_hole_with_rect_pad",
        x: 6,
        y: 0,
        hole_width: 0.5,
        hole_height: 1,
        rect_pad_width: 1.2,
        rect_pad_height: 1,
        rect_border_radius: 0.2,
      },
      {
        type: "pcb_plated_hole",
        shape: "rotated_pill_hole_with_rect_pad",
        x: 8,
        y: 0,
        hole_width: 0.5,
        hole_height: 1,
        hole_ccw_rotation: 30,
        rect_pad_width: 1.2,
        rect_pad_height: 1,
        rect_ccw_rotation: 45,
        rect_border_radius: 0.2,
      },
    ]

    const primitives = elements.flatMap((el) =>
      convertElementToPrimitives(el as any, elements as any),
    )

    const canvas = createCanvas(200, 100)
    const drawer = new Drawer({ top: canvas, drill: canvas } as any)

    for (const prim of primitives) {
      switch (prim.pcb_drawing_type) {
        case "rect":
          if (prim.ccw_rotation) drawRotatedRect(drawer, prim as any)
          else drawRect(drawer, prim as any)
          break
        case "pill":
          if (prim.ccw_rotation) drawRotatedPill(drawer, prim as any)
          else drawPill(drawer, prim as any)
          break
        case "circle":
          drawCircle(drawer, prim as any)
          break
      }
    }

    const pngBase64 = canvas.toBuffer("image/png").toString("base64")
    expect(pngBase64).toMatchSnapshot()
  })
})
