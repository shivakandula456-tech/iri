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
| N | Scope compliance | No apartment interiors, floor plans, flat selectors, pricing, booking or payment workflows | Pending — code inspection supports scope; final browser regression pending |

## Testing environment limitation

The test environment returned `ERR_BLOCKED_BY_ADMINISTRATOR` for navigation to both a local static HTTP URL and the local `file://` URL. A separate headless Chromium run also failed to initialize its software graphics context. Therefore, no interactive runtime test is claimed as passed here.

## Release gate

Do not mark this concept acceptance-complete until tests A–N have been run in a normal browser, actual defects have been fixed, and the affected tests have been repeated. Save current screenshots and the final browser-console/network notes under `docs/evidence/` after that test pass.
