import { PCBViewer } from "../PCBViewer"

export const RectBorderRadiusExample: React.FC = () => {
  return (
    <div style={{ backgroundColor: "black" }}>
      <PCBViewer
        circuitJson={
          [
            {
              type: "pcb_smtpad",
              pcb_smtpad_id: "smtpad_rect",
              shape: "rect",
              x: 0,
              y: 0,
              width: 4,
              height: 4,
              layer: "top",
              rect_border_radius: 1,
            },
            {
              type: "pcb_smtpad",
              pcb_smtpad_id: "smtpad_rotated_rect",
              shape: "rotated_rect",
              x: 8,
              y: 0,
              width: 4,
              height: 4,
              layer: "top",
              ccw_rotation: 45,
              rect_border_radius: 1,
            },
            {
              type: "pcb_plated_hole",
              pcb_plated_hole_id: "hole_circular_rect",
              shape: "circular_hole_with_rect_pad",
              x: 0,
              y: 8,
              hole_diameter: 2,
              rect_pad_width: 6,
              rect_pad_height: 6,
              rect_border_radius: 1,
            },
            {
              type: "pcb_plated_hole",
              pcb_plated_hole_id: "hole_pill_rect",
              shape: "pill_hole_with_rect_pad",
              x: 8,
              y: 8,
              hole_width: 2,
              hole_height: 4,
              rect_pad_width: 6,
              rect_pad_height: 6,
              rect_border_radius: 1,
            },
            {
              type: "pcb_plated_hole",
              pcb_plated_hole_id: "hole_rotated_pill_rect",
              shape: "rotated_pill_hole_with_rect_pad",
              x: 16,
              y: 8,
              hole_width: 2,
              hole_height: 4,
              hole_ccw_rotation: 30,
              rect_pad_width: 6,
              rect_pad_height: 6,
              rect_ccw_rotation: 45,
              rect_border_radius: 1,
            },
          ] as any
        }
      />
    </div>
  )
}

export default RectBorderRadiusExample
