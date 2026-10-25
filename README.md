# Iris Residences — Exterior Digital Twin (Phase 1)

A static, browser-based, conceptual 3D exterior study of Iris Residences by Anandtara in Mundhwa, Pune. The active default model is procedural Three.js geometry reconstructed from published exterior imagery; it is not an architect-issued or surveyed model.

## Included

- Procedurally generated tower, facade rhythms, balconies, glazing, roof/crown and entrance podium.
- Conceptual site, paths, planting, trees, lighting and sunset sky.
- Orbit mode, separate free-look mode, keyboard and touch movement.
- Front, Rear, Left, Right, Isometric, Elevated, Roof, Entrance and Home camera presets.
- Skip/replay intro, reduced-motion handling, loading/error states and adaptive render resolution.
- Signature Reveal: cinematic camera path, staggered title/rule animation, reduced-motion behavior, skip/replay and sunset reset.
- Living Building day-to-night slider with dynamic sky, sunlight, ambient fill, fog, exposure and evening window/lobby emission.
- Director's Cut guided tour with step progress, pause/resume, next stop and skip controls.
- Reversible Blueprint-to-Reality render mode that reveals the real building geometry as edge lines and restores original materials on exit.
- Guided exterior tour with interruptible camera transitions across the main elevations, entrance, site and roof.
- Optional local post-processing with restrained UnrealBloomPass highlights and an accessible cinematic-finish toggle; base WebGL rendering remains the fallback.
- Facade inspection mode with click-to-select details and temporary geometry outlines; all notes identify the reconstruction as conceptual/inferred.
- **IRIS Inside:** interactive modeled-floor selection by floor rail or tower picking, focused camera moves, selected-floor highlight, exploded floor stack, selected-floor cutaway, isolated floor rotation, illustrative furnished apartment, room selection, synchronized conceptual floor plan, keyboard/touch apartment walk-through, and return-to-exterior camera restoration.
- Optional WebXR AR preview on supported secure-context devices: places a miniature exterior model on a detected surface, supports repositioning and restores the normal viewer on exit.
- Live time-of-day control that updates the conceptual sky, direct sunlight, ambient fill, fog and exposure.
- Locally bundled Three.js r164, OrbitControls, reference images and project documentation.
- An optional GLB loading path. No `.glb` model is supplied in this delivery; the procedural reconstruction is used by default.

## Open locally

Because the app uses JavaScript ES modules, `file://` may be blocked by browser security settings. For local testing, serve this folder with any static HTTP server. For example, Python's standard-library static server can be used for testing only:

```text
python -m http.server 8000
```

Then open `http://localhost:8000/`. This is not an application backend and is not required for deployment.

## Deploy to GitHub Pages

1. Upload the contents of this folder to the repository root (or configure the Pages publishing folder accordingly).
2. Keep all relative paths and the complete `assets/`, `js/`, and `docs/` folders.
3. Enable GitHub Pages for the appropriate branch/folder.
4. Open the published `index.html` URL and complete the browser checklist in `docs/testing-checklist.md`.

No framework, build pipeline, database, API key or custom backend is required. The default procedural viewer uses locally bundled Three.js and local reference assets. When `EXTERIOR_MODEL_URL` is explicitly set to a `.glb` asset, the optional GLTFLoader is imported lazily from the pinned Three.js r164 CDN module; that optional model-loading path therefore requires internet access.

## Optional architect-supplied GLB

Place a licensed, approved `.glb` file in `assets/models/` and update `EXTERIOR_MODEL_URL` in `js/config.js` to its relative path. The model must be prepared in the documented world coordinate system and approximately match the configured building scale/orientation; review its bounding box and update camera presets/collision dimensions as needed. Do not set a path to a nonexistent model. If the loader or model fails, the viewer reports an error rather than silently replacing it with a photograph.

## Controls

- Orbit mode: drag to rotate, scroll/pinch to zoom, right-drag or two-finger pan to pan.
- Free-look: drag to look, W/A/S/D or arrow keys to move, Q/E to change height, Shift to move faster; use the on-screen joystick and height controls on touch devices.
- Presets: buttons 1–9 map to Front, Rear, Left, Right, Isometric, Elevated, Roof, Entrance and Home.
- Guided tour: select **Guided tour** to start the authored exterior route; select it again or manipulate the scene to stop and take control.
- Facade inspection: select **Inspect** then click a tower surface for an outline and a concise conceptual annotation. Dragging still operates the camera; switching to Free-look disables inspection.
- AR preview: on compatible browsers/devices served over HTTPS, use **AR Preview**, move the phone until the placement ring appears and tap to place/reposition the miniature. The button is hidden where immersive AR is unsupported; if hit-test or session startup fails, the regular 3D viewer remains usable.
- Cinematic finish: inside **Atmosphere**, enable or disable restrained highlight bloom. If the local post-processing stack cannot initialize, the viewer returns to the base renderer.
- Atmosphere: open the **Atmosphere** control and move the time-of-day slider between 07:00 and 20:00. Sky and lights update while dragging; the reflection environment refreshes when the slider is released.
- `O`: Orbit, `F`: Free-look, `I`: Replay intro, `Home`: reset camera, `Escape`: exit free-look or release pointer lock.
- Intro can be skipped immediately; interaction stops the cinematic camera movement.

### IRIS Inside — interactive floors and sample apartment

- Select **Explore floors** to open the IRIS Inside panel. Select a level from the floor rail or click a visible tower surface; the viewer highlights that level and moves the camera toward it.
- Use **Reveal cutaway** to clip the selected level's front-side geometry, **Isolate floor** to show the selected level, or **Explode tower** to separate the floor groups. **Reassemble tower** returns the floor stack to the conceptual building arrangement.
- In floor/cutaway/exploded modes, enable **Rotate floor** and drag horizontally to rotate the selected level. Turn it off to restore normal camera control.
- Use **Enter apartment** to move into the illustrative sample apartment. Drag to look; use WASD/arrow keys or the on-screen directional pad to move. Simple conceptual wall/furniture collision bounds help prevent walking directly through the sample partitions. Choose a room from the plan or room list to move to it. **Return to floor** exits the walk-through and **Return to exterior** restores the saved exterior camera.
- The current sample apartment, floor plates and room plan are illustrative geometry. No approved Iris Residences apartment drawings or interior `.glb` assets were supplied. They are not the project's verified unit plan, dimensions, fixture layout or number of rooms.
- Optional local interior assets can be mapped in `INTERIOR_ASSETS` inside `js/building-explorer.js` by floor number, using project-relative `.glb` paths. The mapping is empty by default. Room picking for imported models requires room tags compatible with the room metadata; imported assets must be checked and aligned before public release.

## Accuracy, references and permissions

The approximate dimensions and unknown rear/side/roof details are documented in `docs/inferred-geometry.md`. Site roads, planting and distant context are conceptual, not a property survey. The model is not for construction, statutory approvals, sales disclosures, wayfinding or regulatory representations.

The official project page and image references are listed in `docs/source-manifest.md`. Image rights remain with their respective owners; verify permission before public or commercial redistribution. Published project details must be reconfirmed with Anandtara before client-approved release. The current public page contains conflicting Phase I/Phase II RERA ID pairings in different sections; these are intentionally not repeated in the viewer.

## Immersive experience work

The `feature/immersive-architectural-experience` branch adds the guided tour and live time-of-day lighting controller. The tour uses existing camera presets and should stop immediately when the visitor interacts manually. Time-of-day is a visual presentation control, not an accurate solar-position simulation. A WebGPU renderer comparison remains future work; they are not presented as implemented features.

## Current verification status

The original baseline had static source checks and visual evidence, but the new feature branch has not yet been run through the full browser acceptance suite. Local browser navigation was blocked in the working environment. Follow `docs/testing-checklist.md`, including the guided-tour and lighting tests, before merging or declaring the feature branch release-ready.
