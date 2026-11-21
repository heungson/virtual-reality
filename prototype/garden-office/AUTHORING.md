# Edit a Garden Office scene

From the project root, run `python -m http.server 8100 --bind 127.0.0.1`. Open `http://127.0.0.1:8100/prototype/garden-office/`. Use a second terminal for the commands below. Stop the server with Ctrl+C when you finish.

## Browser editor

1. Select **Edit layout**.
   To change the heading, enter a **Scene title** and select **Apply title**. Clear the field and select **Apply title** to restore the default heading.
2. Select a **Component type**. Select an open floor to mark the position. Select **Place**.
3. Select a lamp or roof in the scene, or use **Component in scene**. Use the move buttons to adjust its position. You can remove an added component.
4. Select **Download layout** to save the scene. Select **Load layout or approach** to open a saved scene.
5. Select **Finish editing**. Use the arrow keys or select the path to walk. You can also select the terrace lamp to walk to the end of the path.

## Scene files

The browser and command interface use the same version 1 scene. A scene has a `version` and an `instances` array. Each instance has an `id`, an `asset` and a `placement`. See [the asset kit](ASSETS.md) for the placement axes.

You can change the stair width and number of treads, the landing dimensions, the arch dimensions and position, and the terrace lamp scale and position. The original stairs must keep their walk endpoints. The courtyard, turn and midpoint landings must support the route. Both feet of the middle arch must stay on the midpoint landing. The original lamp base must stay on the terrace. You can add any asset from the component list and remove added scenery by ID. The original eight instances are required. Added scenery does not change the route.

The **Joseon roof** is a small roof study. Place it on an open floor. Its asset ID is `joseon-roof`. Its `anchor` is the center of its base. Its optional `scale` can be from 0.3 to 3. The default is 1. The roof has curved eaves, gray tile bands and a timber frame.

The `pond`, `boardwalk`, and `pavilion-roof` assets add scenery. The `anchor` is the point at the lowest x and y coordinates of the base. Use the z coordinate of the base. All dimensions in the table are in scene units. Give every listed dimension in a command interface placement. Use floors and stairs to provide walk support.

| Asset ID | Placement dimensions | Editor dimensions on placement |
| --- | --- | --- |
| `pond` | `width` and `depth`, 4 to 400 each | 100 × 70 |
| `boardwalk` | `width` and `depth`, 4 to 400 each | 90 × 22 |
| `pavilion-roof` | `span` and `depth`, 8 to 300 each. `height`, 8 to 130 | 96 × 72 × 36 |

Add `"profile": "curved"` to a `pavilion-roof` placement to raise the eave corners. Use `"profile": "straight"` or omit the field in a scene file for the default roof. In an edit request, set `"profile": "straight"` to restore the default roof.

Add a `route` field to set the walk stops in order. Use 2 to 32 stops. Each stop has a unique `name` of 1 to 48 characters and a unique `point` with x, y and z coordinates. The first stop is the start. The last stop is the end. Omit the route to use the original walk.

```json
[
  {"name": "Welcome", "point": [68, 336, 2]},
  {"name": "Courtyard", "point": [262, 336, 44]},
  {"name": "Side of courtyard", "point": [231, 350, 44]}
]
```

When both stops are on the original walk, the walk follows its turns and stairs between them. Positions off the original walk must connect to the previous and next stops on supported, level floor. Check clearance in the browser when you add scenery or place a stop near an object.

## Seowon hall

To open the [Seowon hall scene](seowon-hall.json), select **Edit layout** and **Load layout or approach**. Load the scene file and select **Finish editing**. Follow the route from **Arrival gate** to the hall. The hall roof uses the curved profile. Both wing roofs use the default profile.

To validate the same scene from the project root, run:

```powershell
node prototype/garden-office/scene-api.mjs read prototype/garden-office/seowon-hall.json
```

## Seowon arrival approach

In the browser, select **Edit layout** and **Load layout or approach**. Select [JOS-002-approach.json](design-library/JOS-002-approach.json). The import gives you the arrival court, first flight, middle terrace, and two named stops.

To add the second flight, append these floors to `floors` in **Floors and stairs (JSON)**. The gap between the left and right floor parts keeps the stair opening clear.

```json
[
  {"id":"upper-terrace","anchor":[68.8,24,31.68],"width":374.4,"depth":111.6,"slab":31.68},
  {"id":"upper-terrace-left","anchor":[68.8,135.6,31.68],"width":154.08,"depth":24,"slab":31.68},
  {"id":"upper-terrace-right","anchor":[288.88,135.6,31.68],"width":154.32,"depth":24,"slab":31.68}
]
```

Append this item to `stairs` in the same field.

```json
{"id":"upper-flight","from":[255.88,162.48,16.56],"to":[255.88,135.6,31.68],"width":66,"count":5}
```

Append this stop to **Named route stops (JSON)**.

```json
{"name":"Upper landing","point":[255.88,135.6,31.68]}
```

Select **Apply structure and route**. The editor checks the two fields together. If the check fails, correct the draft and apply it again. The last accepted scene stays active.

Select **Download layout** to save the accepted scene. Select **Finish editing** and walk from **Arrival gate** through **Middle landing** to **Upper landing**. In the editor, use **Load layout or approach** to open the saved scene. Select **Open Garden Office** to restore the original scene.

To import the first flight with the command interface, run the command below. The import uses the normalized stair endpoints, tread count, and stair opening. It uses the design slab dimensions and floor heights. Each study unit is 24 scene units, with 40 scene units added to x. The arrival paving uses a slab thickness of 0.28 study units.

```powershell
node prototype/garden-office/scene-api.mjs import-approach prototype/garden-office/design-library/JOS-002-approach.json > prototype/garden-office/seowon-arrival.json
```

The result has an empty `instances` array, two named route stops, and a `geometry` object. Each item in `geometry.floors` has an `id`, `anchor`, `width`, `depth` and `slab` thickness. Each item in `geometry.stairs` has an `id`, lower endpoint `from`, upper endpoint `to`, `width` and tread `count`. Keep the full width of each end on a floor of the same height. Keep the stair opening clear. Route stops must have floor support. The walk connects the stops along level floor segments and stairs.

Use the same scene file in the editor and the command interface. To change geometry through the command interface, include the full `geometry` object in an edit request. Give the full `route` array if the stops also change. An authored scene always needs a route. The arrival import covers the gate, first flight, and middle landing.

## Command interface

Run these commands in PowerShell from the project root. The first command lists the assets and placement fields. The second writes a copy of the default scene. The third reads the copy and changes the terrace lamp scale. The last reads and validates the result.

```powershell
node prototype/garden-office/scene-api.mjs list
node prototype/garden-office/scene-api.mjs read > prototype/garden-office/draft.json
'{"version":1,"edits":[{"id":"terrace-lamp","placement":{"scale":1.2}}]}' | node prototype/garden-office/scene-api.mjs apply prototype/garden-office/draft.json - > prototype/garden-office/edited.json
node prototype/garden-office/scene-api.mjs read prototype/garden-office/edited.json
```

Use PowerShell 7 for these examples. You can also pass the path of a UTF-8 edits file in place of `-`. Keep scene and edit files in the project directory. The CLI writes scene JSON to standard output. Write the result to a different path from either input. The command interface has no connection to the live office store.

An edit request has a `version` and an `edits` array. To change a component, give its ID and the placement fields to change. To add a component, give a new ID, an asset ID and a complete placement. To remove an added component, give its ID and `"remove": true`. The command checks the final scene as one unit. If a check fails, the command reports the problem on standard error, exits with status 1 and returns no scene JSON.

To set the route, include `route` with the full stop array in the edit request. Use `"edits": []` when only the route changes. Omit `route` to keep the current stops. In the original scene, use `"route": null` to restore the original walk.

To set the scene title, use an edit request such as `{"version":1,"edits":[],"title":"Pavilion Walk"}`. The title can have up to 80 UTF-16 code units. It must include a character other than whitespace and contain no ASCII control characters. The scene keeps the exact text. Omit `title` to keep the current value. Use `"title": null` in the edit request to remove the title from the saved scene and restore the default heading.
