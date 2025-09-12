import { PCBViewer } from "../PCBViewer"

export const RectBorderRadiusExample: React.FC = () => {
  const circuit = [
    {
      type: "pcb_plated_hole",
      shape: "circular_hole_with_rect_pad",
      x: 0,
      y: 0,
      hole_diameter: 0.6,
      rect_pad_width: 2,
      rect_pad_height: 2,
      rect_border_radius: 0.4,
      layers: ["top", "bottom"],
      pcb_plated_hole_id: "c1",
    },
    {
      type: "pcb_plated_hole",
      shape: "pill_hole_with_rect_pad",
      x: 5,
      y: 0,
      hole_width: 0.6,
      hole_height: 1.2,
      rect_pad_width: 2.5,
      rect_pad_height: 1.5,
      rect_border_radius: 0.3,
      pcb_plated_hole_id: "c2",
    },
    {
      type: "pcb_plated_hole",
      shape: "rotated_pill_hole_with_rect_pad",
      x: 10,
      y: 0,
      hole_width: 0.6,
      hole_height: 1.2,
      hole_ccw_rotation: 45,
      rect_pad_width: 2.5,
      rect_pad_height: 1.5,
      rect_ccw_rotation: 30,
      rect_border_radius: 0.2,
      pcb_plated_hole_id: "c3",
    },
    {
      type: "pcb_smtpad",
      shape: "rect",
      x: 0,
      y: -5,
      width: 2,
      height: 1,
      layer: "top",
      rect_border_radius: 0.2,
      pcb_smtpad_id: "s1",
    },
    {
      type: "pcb_smtpad",
      shape: "rotated_rect",
      x: 5,
      y: -5,
      width: 2,
      height: 1,
      layer: "top",
      ccw_rotation: 45,
      rect_border_radius: 0.3,
      pcb_smtpad_id: "s2",
    },
  ] as any

  return (
    <div style={{ backgroundColor: "black" }}>
      <PCBViewer circuitJson={circuit} />
    </div>
  )
}

export default RectBorderRadiusExample
