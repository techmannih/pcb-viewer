import { describe, expect, it } from "bun:test"

import { flattenBulgePoints } from "../../src/lib/util/flatten-bulge-points"

describe("flattenBulgePoints", () => {
  it("returns original vertices when no bulge is present", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 5 },
    ]

    expect(flattenBulgePoints(points)).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 5 },
    ])
  })

  it("expands arcs defined by bulge values into multiple segments", () => {
    const quarterCircleBulge = Math.tan(Math.PI / 8)
    const points = [
      { x: 0, y: 0, bulge: quarterCircleBulge },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ]

    const result = flattenBulgePoints(points, 1)

    expect(result.length).toBeGreaterThan(points.length)
    expect(result[0]).toEqual({ x: 0, y: 0 })
    expect(result[result.length - 1]).toEqual({ x: 10, y: 10 })
    expect(result.some((point) => point.y !== 0)).toBe(true)
  })

  it("removes duplicate closing point before processing", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 0, y: 0 },
    ]

    const result = flattenBulgePoints(points)

    const originCount = result.filter(
      (point) => Math.abs(point.x) < 1e-9 && Math.abs(point.y) < 1e-9,
    ).length

    expect(originCount).toBe(1)
  })
})

