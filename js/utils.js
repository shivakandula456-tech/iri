import * as THREE from 'three';

/** Small dependency-free helpers used by the reconstruction modules. */

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const lerp = (a, b, t) => a + (b - a) * t;

export const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Frame-rate independent exponential smoothing. */
export const damp = (current, target, lambda, dt) =>
  current + (target - current) * (1 - Math.exp(-lambda * Math.max(0, dt)));

/** Deterministic PRNG so the architecture and planting never change between loads. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const randRange = (random, min, max) => min + (max - min) * random();

export function createCanvasTexture(width, height, painter, {
  repeat = [1, 1],
  anisotropy = 4,
  colorSpace = 'srgb',
  wrap = true
} = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  painter(ctx, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  if (wrap) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  }
  texture.repeat.set(repeat[0], repeat[1]);
  texture.anisotropy = anisotropy;
  if (colorSpace === 'srgb') texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/** Simple faux noise used in procedural surface maps. */
export function paintSoftPatches(ctx, width, height, random, count, colors, maxRadius) {
  for (let i = 0; i < count; i += 1) {
    const x = random() * width;
    const y = random() * height;
    const r = (0.2 + random() * 0.8) * maxRadius;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    const color = colors[Math.floor(random() * colors.length)];
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

/**
 * Draws an outlined typographic sign. This intentionally reproduces the
 * project's *name*, not the official Anandtara/Iris logo artwork.
 */
export function makeWordmarkTexture({
  width = 1024,
  height = 280,
  background = 'rgba(0,0,0,0)',
  ink = '#6f5436',
  sub = 'MUNDHWA · PUNE'
} = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  if (background !== 'rgba(0,0,0,0)') {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = ink;

  // Restrained geometric iris mark, drawn from simple strokes.
  ctx.save();
  ctx.translate(width / 2, 48);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(0, 0, 24, 11, Math.PI / 2, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 3; i += 1) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  ctx.font = '500 92px Georgia, "Times New Roman", serif';
  ctx.letterSpacing = '12px';
  ctx.fillText('I R I S', width / 2, 160);

  ctx.font = '500 26px "Segoe UI", Arial, sans-serif';
  ctx.letterSpacing = '10px';
  ctx.fillText('R E S I D E N C E S', width / 2, 218);

  ctx.font = '400 18px "Segoe UI", Arial, sans-serif';
  ctx.letterSpacing = '5px';
  ctx.globalAlpha = 0.78;
  ctx.fillText(sub, width / 2, 254);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/** Release all GPU resources inside a subtree. Used on page unload. */
export function disposeSceneResources(root) {
  const materials = new Set();
  const textures = new Set();
  const geometries = new Set();
  root.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    const list = Array.isArray(object.material) ? object.material : [object.material];
    list.filter(Boolean).forEach((material) => {
      materials.add(material);
      Object.values(material).forEach((value) => {
        if (value && value.isTexture) textures.add(value);
      });
    });
  });
  geometries.forEach((geometry) => geometry.dispose());
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
}

/**
 * Keeps a viewpoint out of the solid volumes we model (tower, canopy, gate
 * piers). The resolve is intentionally simple and horizontal-first: an orbit
 * camera that strays into the mass is pushed to the nearest free side, while a
 * free-look visitor walking near the roof is lifted clear instead of being
 * trapped inside the geometry.
 */
export function resolveCameraCollision(position, colliders, radius = 0.8) {
  for (const box of colliders) {
    const minX = box.min.x - radius;
    const maxX = box.max.x + radius;
    const minY = box.min.y - radius;
    const maxY = box.max.y + radius;
    const minZ = box.min.z - radius;
    const maxZ = box.max.z + radius;

    if (
      position.x <= minX || position.x >= maxX ||
      position.y <= minY || position.y >= maxY ||
      position.z <= minZ || position.z >= maxZ
    ) continue;

    if (position.y > box.max.y - 1.1) {
      position.y = maxY;
      continue;
    }

    const exits = [
      { axis: 'x', value: minX, distance: position.x - minX },
      { axis: 'x', value: maxX, distance: maxX - position.x },
      { axis: 'z', value: minZ, distance: position.z - minZ },
      { axis: 'z', value: maxZ, distance: maxZ - position.z }
    ].sort((a, b) => a.distance - b.distance);

    const exit = exits[0];
    position[exit.axis] = exit.value;
  }
  return position;
}
