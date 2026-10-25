# Source manifest

**Purpose:** Record reference origins and how they were used. References are evidence for an independent concept reconstruction, not runtime image planes or verified drawings.

## Official project website

- Project page: https://anandtara.com/iris-residences/
- Developer website: https://anandtara.com/
- The project page was opened during this audit. It identifies Iris Residences in Mundhwa, Pune and contains a project description, gallery, amenities banner and connectivity text. Its facts are published statements, not independently surveyed/verified facts.

## Supplied/local reference assets

| Local asset | Intended use | Confidence / note |
|---|---|---|
| `assets/reference/main-exterior-render.jpg` | Primary exterior massing, front/side corner, facade rhythm, crown, balcony character and sunset palette | Official `SIDE-1.jpg` render; visual reference only, not geometry |
| `assets/reference/corner-front-render.jpg` | Additional front-corner interpretation | Compare visually with main exterior render; do not infer dimensions from image pixels |
| `assets/reference/aerial-roof-render.jpg` | Approximate elongated footprint, roof perimeter and visible rooftop composition | Visual reference; direct URL check was inconclusive in this environment, local copy is present |
| `assets/reference/aerial-roof-render-2.jpg` | Secondary roof/upper-building visual reference | Source provenance/angle should be reconfirmed before public release |
| `assets/reference/official-banner.jpg` | Project branding/context and amenity list | The official website image `Iris-Banner-scaled-1.jpg`; do not treat banner text as architectural evidence |
| `assets/reference/sunset-render.jpg` | Sunset and lighting reference | Use as visual research, not as the interactive scene |
| `assets/reference/entrance-gate-render.jpg` | Entrance gate/podium composition | Conceptual visual reference; site dimensions are not verified |
| `assets/reference/open-space-render.jpg` | Landscape/open-space treatment | Landscape remains conceptual |
| `assets/reference/play-area-render.jpg` | Landscape/play-area context | Do not infer exact site layout or installed facilities |
| `assets/reference/construction-01.jpg` … `construction-06.jpg` | Supplemental evidence for building massing and opening rhythms | Official gallery URLs `/wp-content/uploads/2025/11/01.jpg` through `06.jpg` were opened from the project page; each is a promotional composition with text/branding and a construction-progress photo, not a clean raw photo. Ignore overlaid text and temporary construction elements when inferring permanent architecture. |

## Reference URLs listed in the master prompt

- Primary render: https://anandtara.com/wp-content/uploads/2024/12/SIDE-1.jpg — opened successfully during this audit.
- Aerial image: https://anandtara.com/wp-content/uploads/2024/12/BIRD-EYE-01-1.jpg — direct open was not available through the browsing tool. A local aerial reference exists in the supplied RAR; confirm exact origin/rights.
- Official banner: https://anandtara.com/wp-content/uploads/2024/12/Iris-Banner-scaled-1.jpg — opened successfully during this audit.
- Construction gallery: `https://anandtara.com/wp-content/uploads/2025/11/01.jpg` through `/06.jpg` — images were opened via the official project page's gallery links. They contain branding/text overlays and should be treated as supplementary evidence only.

## Published facts shown in the project snapshot

The official project page states the location as Mundhwa, Pune; configurations as 2 BHK and 3 BHK; project area as 1.2 acres; and lists open gardens, children's play area, gym, yoga room and banquet hall. It also publishes connectivity distances. These are transcribed from the public page and must be reconfirmed with the developer before client-approved release.

The official page currently shows a June 2026 possession date, which has passed as of this audit date. The page also pairs Phase I/Phase II RERA identifiers differently between its paragraph and linked labels. Neither the possession status nor RERA IDs are asserted in this viewer pending developer confirmation.

## Added runtime rendering modules

The immersive interaction modules are local source files rather than external services:

- `js/guided-tour.js` — authored exterior stops, pause/resume and next-stop progression for Director's Cut.
- `js/lighting-controller.js` — conceptual time-of-day transitions, including evening window/lobby emission.
- `js/facade-inspector.js` — raycast-based feature selection and temporary geometric annotation.
- `js/blueprint-controller.js` — reversible edge-only rendering over the same model geometry, restoring the original mesh materials and visibility.
- `js/camera-director.js` — camera path, presets, intro timing and interaction handoff.


The immersive feature branch vendors the optional post-processing modules directly from the official Three.js repository at the `r164` release/tag, matching the locally bundled runtime engine:

- Upstream repository: https://github.com/mrdoob/three.js
- Upstream release path: `examples/jsm/postprocessing/` and `examples/jsm/shaders/`
- Local destinations: `assets/vendor/postprocessing/` and `assets/vendor/shaders/`
- Modules include EffectComposer, Pass, RenderPass, ShaderPass, OutputPass, UnrealBloomPass, MaskPass, CopyShader, LuminosityHighPassShader and OutputShader.
- The imports are routed through the existing import map, so the normal rendering path does not fetch additional modules from a CDN.
- The post-processing path is optional and falls back to direct WebGL rendering if it cannot initialize or later encounters a rendering exception.

Source code is retained from the pinned upstream release. Review the upstream Three.js licence and include its applicable notices with redistributed code.

## Rights and release requirements

The images and brand assets remain subject to the rights of Anandtara and other relevant rights holders. Confirm permission for reproduction and external deployment. Do not redistribute the reference-image folder publicly unless the rights holder has approved it.
