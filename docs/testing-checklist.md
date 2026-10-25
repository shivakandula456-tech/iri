# Browser testing checklist

**Status date:** 2026-10-26. **Important:** Tests marked *Pending* have not been verified in an interactive browser. Do not treat source-code presence or historical screenshots as a pass.

## Static checks performed during this audit

| Check | Expected result | Actual result | Status |
|---|---|---|---|
| JavaScript syntax (`app.js`, all `js/*.js`) | Every module parses | `node --check` succeeded for each module | PASS — syntax only |
| Relative JavaScript imports | Every relative import points to a file | Existing imports resolved | PASS — paths only |
| Import map | `three` resolves to the bundled Three.js module | `three` maps to `./assets/vendor/three.module.js`; local engine reports r164 | PASS — static inspection |
| Duplicate HTML IDs | None | No duplicate IDs found | PASS — static inspection |
| README link | Target exists | `README.md` added | PASS — file exists |
| Official site link | A persistent external link is present | Header and About-panel links point to the official project page | PASS — static inspection |
| Optional GLB loader path | glTF 2.0 can be loaded when configured, without affecting the default procedural mode | Lazy `GLTFLoader` module path added; no GLB supplied and loader network/runtime path not exercised | PARTIAL — runtime pending |
| Interactive WebGL initialization | Scene appears and becomes ready | Browser navigation was blocked by the environment; not verified | PENDING |
| IRIS Inside source syntax | Modified application, UI, tower geometry and floor explorer controllers parse | Static syntax parse passed for app, UI, building, geometry-kit, explorer, blueprint and facade-inspector modules | PASS — syntax only |
| IRIS Inside DOM contract | Explorer interface has unique IDs and required UI references | 90 HTML IDs; no duplicates; 79 required UI element references resolved | PASS — static inspection |

## Required browser acceptance tests

For all pending rows, record the browser/OS, actual outcome, notes and retest outcome after testing on a normal browser or published static URL.

| ID | Test | Expected result | Status |
|---|---|---|---|
| A | Initial load | 3D scene initializes; no endless loading screen; no console/runtime errors | Pending — not run |
| B | Complete horizontal orbit | Continuous 360° orbit reveals front, rear and both ends; real 3D depth is evident | Pending — not run |
| C | Rear preset | Rear facade fully visible; no blank walls or exposed gaps | Pending — not run |
| D | Left/right presets | Each side elevation correctly faces the camera and is inspectable | Pending — not run |
| E | Roof / Top preset | Roof surface, perimeter and crown are visible from a genuinely elevated/top-down view | Pending — not run; preset adjusted but not visually verified |
| F | Zoom | Close facade inspection and full-site overview work; zoom does not jump through surfaces | Pending — not run |
| G | Pan / Home | Pan remains controllable; Home restores a known usable camera pose | Pending — not run |
| H | Free-Look | Position and orientation can both change; forward/back/strafe/vertical movement work | Pending — not run |
| I | Controller handoff | Repeated mode switching causes no shaking, jumping, duplicate inputs or residual movement | Pending — not run |
| J | Intro | Skip, natural completion, replay and interruption hand control to the visitor correctly | Pending — not run |
| K | Desktop/tablet/mobile | Resizing, portrait/landscape, touch orbit/pan/zoom and visible controls work | Pending — not run |
| L | Reduced motion | Intro is still/simplified and camera does not auto-move unexpectedly | Pending — not run |
| M | Static deployment | Relative assets resolve; no machine-specific paths or required backend; GitHub Pages works | Pending — not run |
| N | Scope and accuracy | Interior prototype is clearly labelled illustrative; no invented floor plan, dimensions or apartment configuration is presented as verified; no pricing/booking/payment flows | Pending — code inspection supports caveats; final browser regression pending |

| O | Guided exterior exploration | Tour moves through overview, front, entrance, right, rear, left, elevated, roof and Home; manual camera input stops the tour immediately | Pending — not run on this branch |
| P | Time-of-day atmosphere | Slider updates sky, lighting and exposure; environment reflections refresh after release without freezing the viewer | Pending — not run on this branch |

| Q | Facade inspection | Inspect mode selects real building meshes; selection annotation and outline show; drag still moves camera; closing or disabling inspection removes outline resources | Pending — not run on this branch |

| R | Cinematic rendering | Local post-processing modules resolve; bloom can be toggled; scene remains visible if composer initialization fails; resizing and adaptive quality keep the composer buffers in sync | Pending — not run on this branch |

| S | Optional WebXR AR | AR action appears only when secure-context capability check succeeds; miniature can be placed/repositioned on hit-tested surface; exit restores original viewer; unsupported/failed sessions leave normal viewer usable | Pending — requires compatible AR device and HTTPS |
| T | Director's Cut controls | Pause stops tour progression; resume continues; Next stop advances; Skip stops the tour; manual camera input interrupts; step label/progress remains synchronized | Pending — not run on this branch |
| U | Blueprint-to-Reality | Blueprint hides shaded meshes and draws the same geometry as technical edges; Reality restores original visibility/materials; repeated switching leaves no duplicate overlays or resource growth | Pending — not run on this branch |
| V | Day-to-night window emission | Warm facade windows and lobby glass gain emission at evening/night and return to a restrained daytime state; no viewer freeze during slider release | Pending — not run on this branch |
| W | Signature Reveal | Opening begins in sunset palette, title/rule reveal runs, reduced-motion preference simplifies motion, Skip/Replay consistently clears stale classes and restores controls | Pending — not run on this branch |
| X | IRIS Inside floor selection | Explore Floors opens; all configured floor buttons render; clicking each floor button and clicking the tower select the matching floor and move focus; selected floor label/highlight remains synchronized | Pending — not run on this branch |
| Y | Exploded stack and reassembly | Eligible floor groups separate around the selected floor; the selected floor can rotate; Reassemble resets floor group transforms and shows the full tower/site; repeated cycles leave no residual offsets | Pending — not run on this branch |
| Z | Selected-floor cutaway | The cutaway exposes the front side of the selected level only; neighboring floors keep their facade; moving to another floor restores old materials and clips only the new selection | Pending — not run on this branch |
| AA | Synchronized room plan | Selecting each schematic room highlights the matching 3D room zone and the plan/list button; selected room title/description updates consistently | Pending — not run on this branch |
| AB | Apartment walk-through | Enter Apartment moves inside; drag changes view direction; WASD/arrows and touch D-pad move within bounds; selecting a room moves camera to it; Return to Floor stops walking and restores orbit controls | Pending — not run on this branch |
| AC | Return to exterior | Closing from each explorer mode, including an in-progress camera transition, restores original camera pose, OrbitControls distances/enabled state and site visibility without leaking clipping materials or room geometry | Pending — not run on this branch |
| AD | Optional interior GLB | With the default empty asset map, no interior GLB is requested; with a configured same-site asset, it lazy-loads for the selected floor; a missing/bad asset falls back to conceptual interior and never leaves the viewer blank | Pending — not run on this branch |

## Testing environment limitation

The test environment returned `ERR_BLOCKED_BY_ADMINISTRATOR` for navigation to both a local static HTTP URL and the local `file://` URL. A separate headless Chromium run also failed to initialize its software graphics context. Therefore, no interactive runtime test is claimed as passed here.

## Release gate

Do not mark this concept acceptance-complete until tests A–AD have been run in a normal browser, actual defects have been fixed, and the affected tests have been repeated. Save current screenshots and the final browser-console/network notes under `docs/evidence/` after that test pass.


## Detailed feature tests for the immersive branch

### Signature Reveal
- Replay Intro from 07:00, noon and 20:00; confirm each replay resets to sunset before the camera reveal.
- Replay with the operating-system reduced-motion preference on and off; confirm prior intro classes do not leak across runs.

### Director's Cut guided tour
- Start from Home and confirm each stop transitions smoothly.
- Pause during a stop, confirm tour progression is suspended, then resume and advance with Next stop.
- Skip while paused or transitioning; the panel must close and camera control must remain available.
- Start orbiting or zooming during a tour transition and confirm the tour stops without continuing to the next preset.
- Stop using the tour button, select another preset, switch to Free-look, and replay the intro; each should stop the route immediately.

### Time-of-day
- Drag the slider through 07:00, noon, 18:00 and 20:00.
- Observe facade glazing and lobby glass; evening emission should fade in after dusk and remain restrained in daylight.
- Confirm the sky changes during the drag and the environment reflection map refreshes after release.
- Confirm the viewer does not freeze or show a blank frame after the release-triggered environment rebuild.

### Blueprint-to-Reality
- Toggle Blueprint/Reality several times on front, rear, side and roof views.
- Confirm the blueprint uses actual tower edges, then restores shaded materials and normal scene interaction without leaving overlays behind.

### Facade inspection
- Enable Inspect and click on the front, rear, side, entrance and upper roof surfaces.
- Confirm each result identifies its side/floor context and calls out that details are conceptual/inferred.
- Drag after enabling inspection; it must orbit rather than select.
- Click the empty background and close the info panel; both should clear the outline and release its geometry/material.


### Cinematic rendering
- Confirm the local post-processing modules load from the same pinned Three.js r164 engine.
- Toggle Cinematic finish off and on; compare highlights without loss of facade detail.
- Resize the window and allow adaptive quality to change resolution; confirm composer output stays aligned to the canvas.
- Simulate a post-processing initialization failure in a test copy and verify the base renderer remains usable.


### Optional AR preview
- Test over HTTPS on a device/browser reporting `immersive-ar` and `hit-test` support.
- Start AR, confirm the background shows the camera passthrough and the placement ring follows a detected surface.
- Tap to place the miniature, then tap another surface to reposition it.
- End the session with the button or system control; confirm the full-size building, site, sky, lighting controls and camera work as before.
- Test unsupported/non-secure context and a rejected AR session. The normal viewer must still initialize and remain usable.


### IRIS Inside — floor and apartment exploration
- Start in the full exterior view; open IRIS Inside and confirm the saved camera and site visibility are recorded.
- Click several numbered floor controls, including the first and highest configured floor, then click the visible tower to check raycast-to-floor mapping and camera focus.
- Test exterior highlight, isolated floor, cutaway and exploded modes. Inspect that the front facade clipping is limited to the selected floor and that adjacent floors remain visually intact.
- In exploded mode, rotate the selected level; reassemble and confirm the complete floor stack is restored without offsets or unintended rotations.
- Enter the sample apartment on desktop and touch layouts. Drag to look; walk with WASD, arrows and the on-screen D-pad; verify movement remains bounded by the illustrative apartment.
- Select every room from both the schematic plan and room list. Confirm the same room is highlighted in the plan and 3D zone and that the room text updates. Check selecting a room while in walk-through moves the camera to the room.
- Return to Floor, switch levels, then close the explorer from each mode. Confirm camera, OrbitControls distance limits, full facade, atmosphere and site are restored.
- Verify the repeated-use path (open, explode, rotate, reassemble, cutaway, enter apartment, return, close) does not accumulate duplicate objects, clipping materials or disposed geometry.
- Keep the caveat visible: all sample rooms and plan blocks are illustrative. Do not promote these layouts as verified apartment drawings.
- If a local interior GLB is configured later, check that only the selected level asset loads, source/unit scaling matches the floor, room tags map correctly, and failed loads preserve the conceptual fallback. The default asset map is empty.
