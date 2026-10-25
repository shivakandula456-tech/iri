# Initial diagnosis — Iris Residences Exterior Digital Twin

**Audit date:** 2026-10-26  
**Baseline selected:** `iris-exterior-digital-twin` from the supplied RAR archive.  
**Scope:** Source and packaging inspection against the supplied Phase 1 master prompt. No code was executed in a fully functioning browser during this audit.

## Archive comparison

- The supplied RAR contains the more developed modular source: `app.js`, `styles.css`, `js/` scene modules, local `assets/vendor/three.module.js`, local `OrbitControls.js`, reference images and four historical evidence screenshots.
- The smaller ZIP contains an earlier implementation and `PROJECT_PRESENTATION_NOTES.md` plus a README. It uses a different, less complete code path. It is useful as reference material, not as the active baseline.
- The RAR build's local Three.js file reports revision 164. The app uses an import map to resolve `three` to the local vendor file, and OrbitControls resolves through the same alias.

## Present in the source

- Procedural 3D building geometry split across `js/building.js` and `js/geometry-kit.js`.
- Building mass, both long elevations, short elevations, podium/entrance and roof/crown construction.
- A conceptual surrounding site and landscape in `js/site.js`.
- Procedural sky/environment in `js/sky.js` and reusable PBR materials in `js/materials.js`.
- OrbitControls configuration, camera-director transitions, nine named camera presets, and a separate Free-Look controller.
- Keyboard presets, pointer-lock option, touch movement joystick and vertical controls.
- Loading and failure UI, WebGL checks, resize handling, reduced-motion handling, adaptive render resolution and scene resource disposal.
- Local reference-image assets and earlier desktop/intro/reduced-motion/WebGL-error screenshots.

## Confirmed deficiencies / implementation risks

1. The required `README.md` was missing from the RAR although the fatal-screen link pointed to it.
2. All four required audit documents were missing: initial diagnosis, source manifest, inferred geometry and testing checklist.
3. No `.glb` file was supplied. This candidate now includes a lazy GLTFLoader path tied to Three.js r164 when `EXTERIOR_MODEL_URL` is configured. The loader is fetched from a pinned CDN only in that optional mode; it has not been runtime-tested here. No architectural GLB is fabricated.
4. The About-panel text referred to source notes and a test log under `docs/`, although only `docs/evidence/` existed. The required README and four documentation files have now been added.
5. The RAR interface did not expose a persistent official project link or the published-project snapshot described in the earlier presentation notes. Both are now added.
6. The Roof preset existed, but its previous camera position was oblique. The candidate adjusts it toward a top-down inspection angle and backs off Home/Front/Rear framing slightly; these camera changes still require browser validation.
7. The supplied screenshots are prior visual evidence, not proof that every camera interaction passes today. Current live browser verification remains pending.
8. The official construction gallery images are promotional image compositions containing branding/text overlays as well as construction imagery; treat them as secondary visual evidence and do not model the overlaid branding/QR codes as building details.

## Static checks performed

- `node --check` succeeded for `app.js` and each `js/*.js` source module.
- HTML scan found no duplicate `id` values.
- All relative JavaScript imports resolved to present local files; the `three` bare-specifier imports resolve through the import map.
- Direct local HTML references resolve, including the new README link.

## Browser-test limitation

Attempts to load the app through a local static server and through a `file://` URL were blocked by the browser environment (`ERR_BLOCKED_BY_ADMINISTRATOR`). A direct headless Chromium run also failed to initialise its software graphics context. Therefore, interactive runtime checks are **not passed**; they remain pending on an available normal browser or published static URL.

## Recommended next implementation priorities

1. Run the full camera/preset/intro/mobile test matrix in a real browser.
2. Refine framing or collisions only when tests demonstrate a defect; avoid speculative camera changes without reviewing the live result.
3. Compare each elevation and rooftop detail against the official visual references; keep inferred details explicitly documented.
4. Obtain an approved architectural model/elevation set if the project needs higher factual accuracy.
5. Confirm image/logo rights and have the developer verify any published project facts before external release.
