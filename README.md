# Iris Residences — Exterior Digital Twin (Phase 1)

A static, browser-based, conceptual 3D exterior study of Iris Residences by Anandtara in Mundhwa, Pune. The active default model is procedural Three.js geometry reconstructed from published exterior imagery; it is not an architect-issued or surveyed model.

## Included

- Procedurally generated tower, facade rhythms, balconies, glazing, roof/crown and entrance podium.
- Conceptual site, paths, planting, trees, lighting and sunset sky.
- Orbit mode, separate free-look mode, keyboard and touch movement.
- Front, Rear, Left, Right, Isometric, Elevated, Roof, Entrance and Home camera presets.
- Skip/replay intro, reduced-motion handling, loading/error states and adaptive render resolution.
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
- `O`: Orbit, `F`: Free-look, `I`: Replay intro, `Home`: reset camera, `Escape`: exit free-look or release pointer lock.
- Intro can be skipped immediately; interaction stops the cinematic camera movement.

## Accuracy, references and permissions

The approximate dimensions and unknown rear/side/roof details are documented in `docs/inferred-geometry.md`. Site roads, planting and distant context are conceptual, not a property survey. The model is not for construction, statutory approvals, sales disclosures, wayfinding or regulatory representations.

The official project page and image references are listed in `docs/source-manifest.md`. Image rights remain with their respective owners; verify permission before public or commercial redistribution. Published project details must be reconfirmed with Anandtara before client-approved release. The current public page contains conflicting Phase I/Phase II RERA ID pairings in different sections; these are intentionally not repeated in the viewer.

## Current verification status

Static checks were performed for JavaScript syntax, local module paths and duplicate HTML IDs. Full interactive browser tests could not be completed in the working environment because browser navigation to the local test page was blocked. See `docs/testing-checklist.md`; do not treat this delivery as fully acceptance-tested until the pending browser tests pass.
