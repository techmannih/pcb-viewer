import { PCBViewer } from "../PCBViewer"

export const PlatedHoleSoldermaskOverlay: React.FC = () => {
  const circuitJson = [
    {
      type: "pcb_board",
      pcb_board_id: "board1",
      center: { x: 0, y: 0 },
      width: 25,
      height: 25,
    },
    {
      type: "source_component",
      source_component_id: "generic_0",
      supplier_part_numbers: {},
    },
    {
      type: "pcb_component",
      source_component_id: "generic_0",
      pcb_component_id: "pcb_generic_component_0",
      layer: "top",
      center: { x: 0, y: 0 },
      rotation: 0,
      width: 0,
      height: 0,
    },
    {
      type: "pcb_plated_hole",
      x: -4,
      y: 0,
      outer_diameter: 3,
      hole_diameter: 1.4,
      shape: "circle",
      layer: "top",
      is_covered_with_solder_mask: true,
      pcb_component_id: "pcb_generic_component_0",
      port_hints: [],
    },
    {
      type: "pcb_plated_hole",
      x: 4,
      y: 0,
      outer_diameter: 3,
      hole_diameter: 1.4,
      shape: "circle",
      layer: "top",
      is_covered_with_solder_mask: false,
      pcb_component_id: "pcb_generic_component_0",
      port_hints: [],
    },
    {
      type: "pcb_hole",
      x: -4,
      y: -6,
      hole_shape: "circle",
      hole_diameter: 2.2,
      is_covered_with_solder_mask: true,
    },
    {
      type: "pcb_hole",
      x: 4,
      y: -6,
      hole_shape: "circle",
      hole_diameter: 2.2,
      is_covered_with_solder_mask: false,
    },
  ]

  return (
    <div style={{ backgroundColor: "black" }}>
      <PCBViewer circuitJson={circuitJson as any} />
    </div>
  )
}

export default PlatedHoleSoldermaskOverlay
