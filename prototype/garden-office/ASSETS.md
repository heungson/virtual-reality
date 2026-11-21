# Garden Office asset kit

Serve this folder over HTTP and open `index.html`. Use Up or Right to advance, Down or Left to return, or select the path or terrace lamp. These are original editable vector shapes. The live office uses its own files.

## Component placement

`layout.mjs` records the positions of the reusable parts. The world unit is consistent for the horizontal axes and elevation. The view projects a point at `[x, y, z]` onto the 1,000 × 690 scene. Increasing `x` moves right and down, increasing `y` moves left and down, and increasing `z` moves straight up. All positions and sizes use world units.

| Asset | Placement and alignment |
| --- | --- |
| `assets/stair.mjs` | `from` and `to` mark the bottom and top center of the stair. Keep the unused horizontal axis fixed. The stair can rise along positive or negative `x` or `y`. Change `count` to change the number of treads. The visitor route uses the same endpoints. In an authored structure, a floor at the same elevation must support the full width at each end. Keep the stair opening clear. The entrance, courtyard and terrace all use this asset. |
| `assets/landing.mjs` | `anchor` is the corner at minimum `x` and `y` on the top face. `width` extends along `x`, `depth` extends along `y`, and `slab` extends down. Align the top face with the stair end and keep adjacent walk surfaces in contact. The courtyard, turn and midpoint use this asset. |
| `assets/arch.mjs` | `anchor` is the center of the arch on the supporting floor. Set the open `span` and the `height` to the inside crown. Put the feet on a landing and check clearance against nearby stairs. The midpoint has one arch. |
| `assets/lamp.mjs` | `anchor` is the bottom center and `scale` changes all dimensions together. The pointer target follows the lamp center. The meeting terrace has one lamp. |

The Node checks confirmed that all four stair directions connect the route and produce treads. When the upper floor moved away from the stair end, validation rejected the gap in each direction. Check the view and walk in the browser when you author a scene.

To change the lamp glass in this scene, edit the `lampGlass` color in its asset file. Reload the scene and check that the glass changes, the lamp base stays on the terrace and selecting the lamp still starts the walk. To replace a component with another drawing, keep its export and alignment convention, then recheck its adjacent parts and the route.
