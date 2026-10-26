# Inferred geometry and coordinate system

**Model status:** Conceptual procedural reconstruction. No architect-issued BIM/GLB model, approved drawing set or surveyed site plan was supplied with the archives.

## Coordinate system

- World `+Y`: vertical up.
- Ground plane: `y = 0`.
- Origin: centre of the conceptual site beneath the tower.
- World `+Z`: main entrance/front elevation.
- World `+X`: the right-hand end when looking toward the entrance/front.
- Camera focus targets and site boundaries are approximate.

## Current configuration estimates

| Parameter | Configured value | Status |
|---|---:|---|
| Overall tower length | 64 m | Visual estimate |
| Overall tower depth | 20 m | Visual estimate |
| Ground/lobby zone | 4.35 m | Visual estimate |
| Typical level increment | 3.03 m | Visual estimate |
| Visible residential levels | 14 | Visual interpretation, not a verified floor-count record |
| Roof terrace elevation | ~46.77 m | Derived from the above configured estimates |
| Open crown above terrace | ~7.9 m | Visual estimate |
| Crown top elevation | ~54.67 m | Derived estimate |
| Site/plot and road arrangement | Conceptual | Not a survey or approved site plan |

These values are sourced from `js/config.js`. They are not suitable for construction, approval, structural design, sales statements or regulatory disclosures.

## Features supported by visual references

The exterior references show an elongated multi-wing white/off-white slab, prominent vertical facade blades/channels, repeated horizontal floor/balcony bands, glazed balcony/window zones, warm-toned vertical screens, a podium/entrance composition and an open rooftop crown. The aerial-style image supports an approximate elongated footprint and visible roof arrangement.

## Inferred / uncertain elements

- Exact dimensions, storey count, floor-to-floor heights, bay spacing, window sizes, balcony projections and facade material specifications.
- Rear-elevation pattern, because the full official finished rear elevation was not supplied.
- Side-elevation opening counts and hidden corner transitions.
- Exact roof slab/perimeter dimensions and the identity of rooftop structures.
- Gate, driveway, drop-off, path and landscape arrangement; no surveyed site plan was supplied.
- Tree species, planting density, distant land forms and contextual surroundings.

The procedural model deliberately uses coherent repeated facade logic to fill the hidden elevations but does not imply that the exact rear rhythm, opening count or rooftop layout has been verified. Roof structures and planted zones are kept conservative and are visual interpretations of the references, not claims about approved amenities. Eligible long upright facade boxes have now been split into estimated storey-height segments for IRIS Inside selection/cutaway behavior; this improves interactivity but remains based on estimated level heights.

## How to update the model later

Most scale and layout assumptions are centralized in `js/config.js`; facade generation, roof details and entrance geometry live in `js/building.js`; site context lives in `js/site.js`. If an architect-approved model/drawing set becomes available, validate scale and orientation first, then replace or refine components without changing camera code unnecessarily. Update this file with the source and confidence for each material correction.


## IRIS Inside: floor and interior assumptions

The interactive floor rail is generated from `BUILDING.levels` in `js/config.js` and currently numbers the conceptual levels from 1 through 14. This number is a modelling convenience that follows the current visual estimate; it is not a verified official storey schedule.

The procedural tower generator now groups eligible facade and inner-core instance batches by estimated floor. Elements that span multiple levels (for example some tall fins and roof elements) remain in shared/static groups and may not separate as a complete architectural BIM floor.

The furnished sample apartment and the room selector in `js/building-explorer.js` are an illustrative interaction prototype. The living room, dining area, kitchen, bedroom, bathroom and balcony positions, partitions, furniture and schematic 2D plan are invented to demonstrate the interface. They are not inferred as factual floor-plan data and must not be presented as the actual Iris Residences layout. No approved apartment drawing or interior model was supplied.

For an approved interior asset, place a licensed `.glb` under the static site, add its relative path to `INTERIOR_ASSETS` by floor number and verify its scale, origin, orientation, visible room tags and unit-plan alignment. The current map is empty. Imported interior assets still require visual review and appropriate room metadata before production use.
