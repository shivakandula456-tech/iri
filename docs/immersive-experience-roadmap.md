# Iris Residences — Immersive Experience Roadmap

## Visual direction

**Cinematic-first hybrid.** The visual identity should feel like a premium architectural film, while visitors remain in control of a genuine real-time 3D environment. Avoid dashboard-like UI and oversized panels.

## Current feature slice

- **Signature Reveal:** cinematic exterior camera path, staggered title/rule animation, reduced-motion support, skip/replay, and a sunset palette reset on replay.
- **Living Building / Day-to-Night:** a 07:00–20:00 conceptual time slider adjusts the procedural sky, sun, hemisphere fill, fog, exposure, warm window emission and lobby glow. The environment reflection map rebuilds after slider release, not on every input event.
- **Director's Cut:** authored camera route with a dedicated step panel, progress, pause/resume, next stop and skip controls. Manual pointer and wheel interactions interrupt the route.
- **Cinematic highlights:** a subtle, optional local UnrealBloomPass stage is included after the base scene pass. The toggle is inside Atmosphere and the app has a direct-render fallback if composer initialization fails.
- **Static deployment:** preserve the existing vanilla JavaScript / Three.js architecture and locally bundled runtime. No backend, database, build pipeline or API key is required.

## Interactive facade inspection and Blueprint-to-Reality

- Facade inspection uses raycasting against real building meshes, contextual feature descriptions, elevation and approximate-level labels, and a temporary outline.
- Blueprint view switches the same geometry to architectural edge lines against a restrained technical grid; original mesh visibility and material references are restored on exit.
- Feature annotations deliberately identify the model as conceptual/inferred, not architect-verified.
- **IRIS Inside** adds floor selection, floor-aware facade groups, cutaway clipping, an exploded stack, isolated-floor rotation, a furnished illustrative apartment, room picking, an interactive schematic plan, keyboard/touch walk-through controls and a return-to-exterior transition.
- No approved floor plan or interior model was supplied. Room locations, interior dimensions and furniture are only an illustrative prototype, and no room area or official apartment configuration is asserted.

**Verification status:** source integration is committed on the feature branch. Floor picking, cutaway rendering, exploded movement, apartment navigation and return-to-exterior require interactive testing in a real WebGL browser. Do not merge until the new IRIS Inside tests in `docs/testing-checklist.md` pass.

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
