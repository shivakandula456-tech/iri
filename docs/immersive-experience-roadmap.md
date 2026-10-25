# Iris Residences — Immersive Experience Roadmap

## Visual direction

**Cinematic-first hybrid.** The visual identity should feel like a premium architectural film, while visitors remain in control of a genuine real-time 3D environment. Avoid dashboard-like UI and oversized panels.

## Current feature slice

- **Guided exterior exploration:** an authored camera route through existing presets. Manual pointer, wheel, camera-preset and mode inputs must stop the tour immediately.
- **Live atmosphere:** a 07:00–20:00 presentation slider updates the procedural sky, direct sunlight, hemisphere fill, fog and exposure. The environment reflection map is rebuilt after slider release, not on every input event.
- **Cinematic highlights:** a subtle, optional local UnrealBloomPass stage is included after the base scene pass. The toggle is inside Atmosphere and the app has a direct-render fallback if composer initialization fails.
- **Static deployment:** preserve the existing vanilla JavaScript / Three.js architecture and locally bundled runtime. No backend, database, build pipeline or API key is required.

## Implemented in the current branch: facade intelligence

- Uses raycasting against the actual building group.
- Classifies selected surfaces by hit point, transformed face normal, name hints and current geometry metadata.
- Shows a restrained label and explanation with side/floor context, plus a temporary geometry outline.
- Disposes the outline geometry/material when the selection changes or inspection is disabled.
- Feature annotations deliberately identify the model as conceptual/inferred, not architect-verified. No apartment interior or floor-selection features are included.

**Verification status:** source integration is committed on the feature branch; interactive selection and disposal behaviour remain pending in a real browser.

## Rendering investigation

1. Keep Three.js r164 / WebGL as the release baseline until the feature branch is browser-tested.
2. Benchmark the current local bloom pass, shadow quality, adaptive pixel ratio, material response and texture cost first.
3. Add restrained post-processing only if the required modules can be bundled locally and performance remains acceptable on mid-range mobile devices.
4. Prototype WebGPU in a separate experimental path only after checking compatibility with the pinned release and avoiding duplicate Three.js engine copies. Do not switch production renderer simply because WebGPU is newer.
5. Keep a readable fallback that preserves the exterior model and camera controls when optional effects are unavailable.

## Implemented optional AR preview (browser testing pending)

- WebXR is opt-in and is not required for startup.
- The AR button is shown only after the browser reports immersive-AR support in a secure context.
- The current conceptual procedural tower is placed as a miniature (not claimed as an approved scale model) after a hit-test surface is detected; tapping again repositions it.
- The site/horizon and sky background are hidden during placement, and the original scene is restored on session end.
- Rendering uses the base WebGL path during XR; traditional post-processing is skipped. Failed session start must return to the normal viewer.

**Verification status:** implementation is committed on the feature branch; test on a compatible HTTPS device is pending.

## Release gate

Do not merge or claim completion until required browser tests pass for initial load, full 360-degree orbit, rear/sides, top-down roof view, zoom/pan, free-look, tour interruption, lighting changes, reduced motion, mobile layouts and static deployment. Record actual results rather than marking tests passed because code exists.
