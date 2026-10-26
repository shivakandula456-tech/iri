import { BUILDING, ROOF_Y } from './config.js';

/**
 * Conceptual placeholders for the lift-placement visual study.
 * Replace positions, dimensions, doors and stops using approved drawings.
 * These visual estimates are not surveyed data and must not be used for construction.
 */
const conceptualStops = Object.freeze(Array.from({ length: BUILDING.levels + 1 }, (_, level) => level));
export const LIFT_DATA_NOTICE =
  'Conceptual placeholders only. Confirm the actual lift count, coordinates, shaft dimensions, door positions and stops against approved drawings.';

export const LIFT_PLACEMENTS = Object.freeze([
  Object.freeze({
    id: 'LIFT-A', label: 'Lift A', x: -2.55, z: 0.15,
    shaftWidth: 2.25, shaftDepth: 2.2, bottomY: 0.25, topY: ROOF_Y - 0.35,
    bottomLevel: 0, topLevel: BUILDING.levels, servedFloors: conceptualStops,
    doorSide: 'front (+Z)', type: 'Passenger lift — conceptual classification',
    color: '#D7B47A', sourceStatus: 'conceptual'
  }),
  Object.freeze({
    id: 'LIFT-B', label: 'Lift B', x: 2.55, z: 0.15,
    shaftWidth: 2.25, shaftDepth: 2.2, bottomY: 0.25, topY: ROOF_Y - 0.35,
    bottomLevel: 0, topLevel: BUILDING.levels, servedFloors: conceptualStops,
    doorSide: 'front (+Z)', type: 'Passenger lift — conceptual classification',
    color: '#70C1C6', sourceStatus: 'conceptual'
  })
]);
