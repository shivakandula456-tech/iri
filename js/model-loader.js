import * as THREE from 'three';
import { BUILDING, ENTRANCE, HALF_D } from './config.js';

// Pinned to the same Three.js release family as the locally bundled engine.
// This module is imported only when EXTERIOR_MODEL_URL is explicitly configured;
// the default procedural viewer makes no request to the CDN.
const GLTF_LOADER_URL = 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

/**
 * Load an approved glTF 2.0 / GLB asset. The supplied model is expected to use
 * the coordinate system and approximate scale documented in docs/inferred-geometry.md.
 * If this function fails, the caller's boot handler reports a fatal error; it
 * deliberately does not silently substitute a photograph or a different model.
 */
export async function loadExteriorModel(url, onProgress = () => {}) {
  if (typeof url !== 'string' || !url.trim()) {
    throw new TypeError('EXTERIOR_MODEL_URL must be a non-empty relative URL.');
  }

  let GLTFLoader;
  try {
    ({ GLTFLoader } = await import(GLTF_LOADER_URL));
  } catch (error) {
    throw new Error(`Could not load the pinned Three.js GLTFLoader. Check internet access for optional GLB mode. ${error?.message || error}`);
  }

  const loader = new GLTFLoader();
  const gltf = await new Promise((resolve, reject) => {
    loader.load(url, resolve, onProgress, reject);
  });
  const group = gltf.scene || gltf.scenes?.[0];
  if (!group) throw new Error(`No scene was found in the supplied glTF model: ${url}`);

  group.name = group.name || 'Iris Residences — supplied architectural model';
  group.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(group);
  if (bounds.isEmpty()) throw new Error(`The supplied glTF model has no measurable geometry: ${url}`);

  const size = bounds.getSize(new THREE.Vector3());
  if (size.x < 0.01 || size.y < 0.01 || size.z < 0.01) {
    throw new Error(`The supplied glTF model has a degenerate bounding box (${size.toArray().map((v) => v.toFixed(3)).join(' × ')}).`);
  }

  const counts = { meshes: 0, vertices: 0, triangles: 0 };
  group.traverse((object) => {
    if (!object.isMesh || !object.geometry) return;
    counts.meshes += 1;
    const position = object.geometry.getAttribute('position');
    if (position) counts.vertices += position.count;
    const index = object.geometry.getIndex();
    counts.triangles += index ? Math.floor(index.count / 3) : Math.floor((position?.count || 0) / 3);
  });
  if (!counts.meshes) throw new Error(`The supplied glTF model contains no meshes: ${url}`);

  group.userData.metadata = {
    description: 'Architect-supplied glTF 2.0 model loaded for the exterior study.',
    accuracy: 'Confirm dimensions, origin and orientation with the model supplier.',
    configuredEstimate: `${BUILDING.length} × ${BUILDING.depth} m`,
  };

  // A solid bounding-volume collider keeps navigation outside unmodelled
  // interior space. An architect-approved model may need a more detailed set.
  const collider = bounds.clone().expandByScalar(0.35);
  const entrance = new THREE.Vector3(ENTRANCE.x, Math.min(4.6, bounds.max.y), HALF_D + 8);

  return {
    group,
    colliders: [collider],
    focus: bounds.getCenter(new THREE.Vector3()),
    entrance,
    stats: { ...counts, bounds: { min: bounds.min.toArray(), max: bounds.max.toArray(), size: size.toArray() } }
  };
}
