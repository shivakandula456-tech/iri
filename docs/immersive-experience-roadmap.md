# Iris Residences — Immersive Experience Roadmap

## Visual direction

**Cinematic-first hybrid.** The visual identity should feel like a premium architectural film, while visitors remain in control of a genuine real-time 3D environment. Avoid dashboard-like UI and oversized panels.

## Current feature slice

- **Guided exterior exploration:** an authored camera route through existing presets. Manual pointer, wheel, camera-preset and mode inputs must stop the tour immediately.
- **Live atmosphere:** a 07:00–20:00 presentation slider updates the procedural sky, direct sunlight, hemisphere fill, fog and exposure. The environment reflection map is rebuilt after slider release, not on every input event.
- **Static deployment:** preserve the existing vanilla JavaScript / Three.js architecture and locally bundled runtime. No backend, database, build pipeline or API key is required.

## Next implementation slice: facade intelligence

- Use raycasting against the actual building group.
- Classify selected surfaces conservatively by hit point, transformed face normal and current geometry metadata.
- Show a restrained label and concise explanation, and provide a clear dismissal path.
- Use a temporary lightweight outline; dispose outline geometry/material when selection changes.
- Do not label inferred features as architect-verified. Do not create apartment-interior or floor-selection features.

## Rendering investigation

1. Keep Three.js r164 / WebGL as the release baseline until the feature branch is browser-tested.
2. Benchmark shadow quality, adaptive pixel ratio, material response and texture cost first.
3. Add restrained post-processing only if the required modules can be bundled locally and performance remains acceptable on mid-range mobile devices.
4. Prototype WebGPU in a separate experimental path only after checking compatibility with the pinned release and avoiding duplicate Three.js engine copies. Do not switch production renderer simply because WebGPU is newer.
5. Keep a readable fallback that preserves the exterior model and camera controls when optional effects are unavailable.

## Optional AR experiment

- Treat WebXR as opt-in, not a startup requirement.
- Require HTTPS and a compatible device/browser; feature-detect runtime before showing an AR action.
- Use an approved, scale-correct GLB model only. The current procedural reconstruction must not be silently represented as a measured or architect-approved model.
- When AR is unavailable, keep the ordinary 3D viewer fully functional.

## Release gate

Do not merge or claim completion until required browser tests pass for initial load, full 360-degree orbit, rear/sides, top-down roof view, zoom/pan, free-look, tour interruption, lighting changes, reduced motion, mobile layouts and static deployment. Record actual results rather than marking tests passed because code exists.
