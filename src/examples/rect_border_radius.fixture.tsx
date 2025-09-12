import { PCBViewer } from "../PCBViewer"
import type { AnyCircuitElement } from "circuit-json"

export const RectBorderRadiusDemo: React.FC = () => {
  const circuit: AnyCircuitElement[] = [
    {
      x: 0,
      y: 0,
      type: "pcb_plated_hole",
      shape: "circular_hole_with_rect_pad",
      layers: ["top", "bottom"],
      port_hints: ["1"],
      pcb_port_id: "circular_pad",
      hole_diameter: 0.6,
      rect_pad_width: 2,
      rect_pad_height: 2,
      rect_border_radius: 0.4,
      pcb_component_id: "comp1",
      pcb_plated_hole_id: "hole1",
    },
    {
      x: 4,
      y: 0,
      type: "pcb_plated_hole",
      shape: "pill_hole_with_rect_pad",
      layers: ["top", "bottom"],
      port_hints: ["1"],
      pcb_port_id: "pill_pad",
      hole_width: 0.6,
      hole_height: 1.4,
      rect_pad_width: 2,
      rect_pad_height: 2,
      rect_border_radius: 0.4,
      pcb_component_id: "comp2",
      pcb_plated_hole_id: "hole2",
    },
    {
      x: 8,
      y: 0,
      type: "pcb_plated_hole",
      shape: "rotated_pill_hole_with_rect_pad",
      layers: ["top", "bottom"],
      port_hints: ["1"],
      pcb_port_id: "rotated_pill_pad",
      hole_width: 0.6,
      hole_height: 1.4,
      hole_ccw_rotation: 45,
      rect_pad_width: 2,
      rect_pad_height: 2,
      rect_ccw_rotation: 45,
      rect_border_radius: 0.4,
      pcb_component_id: "comp3",
      pcb_plated_hole_id: "hole3",
    },
    {
      x: 0,
      y: 4,
      type: "pcb_smtpad",
      shape: "rect",
      width: 3,
      height: 2,
      rect_border_radius: 0.4,
      layer: "top",
      pcb_smtpad_id: "smt1",
    },
    {
      x: 4,
      y: 4,
      type: "pcb_smtpad",
      shape: "rotated_rect",
      width: 3,
      height: 2,
      rect_border_radius: 0.4,
      ccw_rotation: 45,
      layer: "top",
      pcb_smtpad_id: "smt2",
    },
  ]

  return (
    <div style={{ backgroundColor: "black" }}>
      <PCBViewer circuitJson={circuit} />
    </div>
  )
}

export default RectBorderRadiusDemo
