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
- **IRIS Inside:** interactive modeled-floor selection by floor rail or tower picking, focused camera moves, selected-floor highlight, an X-ray facade mode, adjustable selected-floor cutaway plane, exploded floor stack, isolated-floor rotation, illustrative furnished apartment with day-to-night interior lights, room selection, synchronized conceptual floor plan, keyboard/touch apartment walk-through with simple conceptual wall/furniture collision, and return-to-exterior camera restoration.
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

The workflow `.github/workflows/deploy-iris-pages.yml` runs on every push to `feature/immersive-architectural-experience` and can also be started manually from the Actions tab. It checks JavaScript syntax, required files, duplicate HTML IDs and runs Playwright browser smoke tests for all nine menu experiences, including the Lift Placement Viewer. The deployment job publishes the static site only when verification succeeds. If several pushes arrive close together, older in-progress runs are cancelled so the newest branch state is the version published.

**One-time GitHub setting:** open repository **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**. If the existing Pages deployment environment has branch restrictions, allow `feature/immersive-architectural-experience` to deploy. Without this setting or permission, the workflow can run but Pages deployment may fail.

Published site: https://shivakandula456-tech.github.io/iri/

The site remains static HTML/CSS/vanilla JavaScript with locally bundled Three.js and no app backend, framework, API keys or build step. When `EXTERIOR_MODEL_URL` is explicitly set to a `.glb` asset, the optional GLTFLoader is imported lazily from the pinned Three.js r164 CDN module; that optional model-loading path requires internet access.

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

### Explore IRIS — eight connected experiences

Open **Explore IRIS** in the top navigation to find all eight options in one responsive menu:

1. **Vertical Building Cutaway** — cut through the tower across all modeled levels, show conceptual floor plates, and adjust the live cut plane. The selected-floor cutaway remains available inside IRIS Inside.
2. **Blueprint-to-Apartment Morph** — transition from the architectural edge view into the illustrative apartment walkthrough.
3. **Sunlight & Shadow Explorer** — change the time-of-day control to move the conceptual sun direction, update lighting and refresh the scene shadow map. It is a visual study, not location-calibrated solar analysis.
4. **Seamless Building Portal** — enter the sample apartment directly from the exterior.
5. **Architectural Layer Explorer** — toggle conceptual facade/massing, floor plates, glazing, metal/bronze details, balustrades, roof/crown/podium grouping, and site/landscape, alongside X-ray, floor isolation, cutaway and exploded-tower controls. Material groupings are inferred from the procedural model and are not architect-issued construction layers.
6. **Room-to-Room Journey** — enter the apartment and navigate by the room list or conceptual plan.
7. **Live Visual Comparison** — save two canvas snapshots and compare them using a movable split divider.
8. **Architectural Postcard Studio** — add a title and caption to the rendered view, preview it, and download a PNG.

The menu controls orchestrate existing viewer functions. It is not a verified architectural model. Floor geometry, sample rooms and dimensions remain illustrative until approved project drawings or model assets are provided.

### IRIS Inside — interactive floors and sample apartment

- Select **Explore floors** to open the IRIS Inside panel. Select a level from the floor rail or click a visible tower surface; the viewer highlights that level and moves the camera toward it.
- Use **Vertical tower cutaway** to clip the full modeled tower and reveal a vertical section with conceptual floor plates. Use **Selected-floor cutaway** to clip only the chosen level. In either cutaway mode, drag the **Cut plane depth** slider to adjust the section. **Reassemble tower** returns the floor stack to the conceptual building arrangement.
- Use **X-ray facade** to fade the selected level's facade materials, **Isolate floor** to show the selected level, or **Explode tower** to separate floor groups.
- In floor/cutaway/exploded modes, enable **Rotate floor** and drag horizontally to rotate the selected level. Turn it off to restore normal camera control.
- Use **Enter apartment** to move into the illustrative sample apartment. Drag to look; use WASD/arrow keys or the on-screen directional pad to move. Simple conceptual wall/furniture collision bounds help prevent walking directly through the sample partitions. Choose a room from the plan or room list to move to it. **Return to floor** exits the walk-through and **Return to exterior** restores the saved exterior camera.
- Interior fixture lights and room lighting respond to the shared 07:00–20:00 atmosphere control. The current sample apartment, floor plates and room plan are illustrative geometry. No approved Iris Residences apartment drawings or interior `.glb` assets were supplied. They are not the project's verified unit plan, dimensions, fixture layout or number of rooms.
- Optional local interior assets can be mapped in `INTERIOR_ASSETS` inside `js/building-explorer.js` by floor number, using project-relative `.glb` paths. The mapping is empty by default. Room picking for imported models requires room tags compatible with the room metadata; imported assets must be checked and aligned before public release.

## Accuracy, references and permissions

The approximate dimensions and unknown rear/side/roof details are documented in `docs/inferred-geometry.md`. Site roads, planting and distant context are conceptual, not a property survey. The model is not for construction, statutory approvals, sales disclosures, wayfinding or regulatory representations.

The official project page and image references are listed in `docs/source-manifest.md`. Image rights remain with their respective owners; verify permission before public or commercial redistribution. Published project details must be reconfirmed with Anandtara before client-approved release. The current public page contains conflicting Phase I/Phase II RERA ID pairings in different sections; these are intentionally not repeated in the viewer.

## Immersive experience work

The `feature/immersive-architectural-experience` branch adds the guided tour and live time-of-day lighting controller. The tour uses existing camera presets and should stop immediately when the visitor interacts manually. Time-of-day is a visual presentation control, not an accurate solar-position simulation. A WebGPU renderer comparison remains future work; they are not presented as implemented features.

## Current verification status

The GitHub Actions workflow now runs repeatable source checks and automated Playwright browser smoke tests before publishing from the feature branch. Review the latest run under the repository **Actions** tab. Do not treat a run as passed until its verification job succeeds and the deployment job completes. The in-chat environment has not independently completed a live WebGL browser session, so local/static checks are not a substitute for the Actions browser run. Use `docs/testing-checklist.md` for additional manual desktop and mobile acceptance tests.


## Lift Placement Viewer

Open **Explore IRIS → Lift Placement Viewer** to launch a separate browser tab containing a dedicated 3D vertical cutaway built from the same procedural tower model and a schematic 2D floor plan. Initial lift locations, dimensions, door orientation and served-floor pattern are placeholders in `js/lift-data.js`; verify them against approved plans and lift sections before using project-specific dimensions. This is a conceptual visual study and is not for construction.
