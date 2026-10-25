import * as THREE from 'three';
import { SUN_DIRECTION } from './config.js';
import { createCanvasTexture, mulberry32, randRange } from './utils.js';

const _sun = new THREE.Vector3(...SUN_DIRECTION).normalize();

/**
 * Paints an equirectangular sunset. Using a background map rather than a
 * screen-space sky shader keeps the sun's position consistent with the
 * directional light and gives us a free image-based lighting source.
 */
function paintSky(ctx, width, height) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0.0, '#102a43');
  sky.addColorStop(0.16, '#1b3a56');
  sky.addColorStop(0.31, '#3f5f78');
  sky.addColorStop(0.42, '#8e8d83');
  sky.addColorStop(0.475, '#d7a47d');
  sky.addColorStop(0.5, '#efb783');
  sky.addColorStop(0.535, '#a98469');
  sky.addColorStop(0.64, '#5b584a');
  sky.addColorStop(1.0, '#262b28');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Sun position in equirectangular coordinates.
  const u = Math.atan2(_sun.z, _sun.x) / (Math.PI * 2) + 0.5;
  const v = Math.asin(THREE.MathUtils.clamp(_sun.y, -1, 1)) / Math.PI + 0.5;
  const sunX = u * width;
  const sunY = (1 - v) * height;

  // Broad warm atmospheric band around the sun's altitude.
  const band = ctx.createLinearGradient(0, sunY - height * 0.17, 0, sunY + height * 0.12);
  band.addColorStop(0, 'rgba(255,190,128,0)');
  band.addColorStop(0.58, 'rgba(255,198,140,0.2)');
  band.addColorStop(0.78, 'rgba(255,226,178,0.3)');
  band.addColorStop(1, 'rgba(255,190,128,0)');
  ctx.fillStyle = band;
  ctx.fillRect(0, 0, width, height);

  // Soft clouds, drawn before the sun so the disc reads through the haze.
  const random = mulberry32(0x5e7157);
  const cloudClusters = [
    [0.08, 0.36, 0.19, 0.028],
    [0.2, 0.42, 0.24, 0.024],
    [0.35, 0.3, 0.16, 0.018],
    [0.52, 0.38, 0.3, 0.022],
    [0.66, 0.33, 0.2, 0.02],
    [0.8, 0.4, 0.22, 0.026],
    [0.93, 0.34, 0.17, 0.02]
  ];
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const [cx, cy, span, thick] of cloudClusters) {
    for (let i = 0; i < 13; i += 1) {
      const t = i / 12;
      const x = (cx + (t - 0.5) * span) * width;
      const y = (cy + Math.sin(t * Math.PI * 2.3 + random() * 2) * 0.014) * height;
      const rx = randRange(random, 0.025, 0.075) * width;
      const ry = thick * height * randRange(random, 0.5, 1.3);
      const warm = 1 - Math.min(1, Math.abs(cy - 0.4) * 4);
      const color = warm > 0.55 ? '255,205,160' : '178,194,205';
      const alpha = randRange(random, 0.035, 0.1);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, ry / rx);
      const blob = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      blob.addColorStop(0, `rgba(${color},${alpha})`);
      blob.addColorStop(0.55, `rgba(${color},${alpha * 0.55})`);
      blob.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = blob;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();

  // Sun halo and disc.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const halos = [
    [330, 'rgba(255,163,88,0.24)'],
    [150, 'rgba(255,198,128,0.34)'],
    [68, 'rgba(255,229,184,0.55)']
  ];
  for (const [radius, color] of halos) {
    const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, radius);
    glow.addColorStop(0, color);
    glow.addColorStop(0.35, color.replace(/[\d.]+\)$/, '0.12)'));
    glow.addColorStop(1, 'rgba(255,190,120,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sunX - radius, sunY - radius, radius * 2, radius * 2);
  }
  const disc = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 20);
  disc.addColorStop(0, '#fff9e8');
  disc.addColorStop(0.62, '#ffe9b7');
  disc.addColorStop(1, 'rgba(255,220,155,0)');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 21, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // A whisper of high-altitude haze.
  const haze = ctx.createLinearGradient(0, height * 0.2, 0, height * 0.48);
  haze.addColorStop(0, 'rgba(197,209,215,0)');
  haze.addColorStop(0.7, 'rgba(225,212,195,0.05)');
  haze.addColorStop(1, 'rgba(255,224,185,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, width, height);
}

export function createSky(scene, renderer) {
  const texture = createCanvasTexture(2048, 1024, paintSky, {
    wrap: false,
    anisotropy: Math.min(8, renderer.capabilities.getMaxAnisotropy())
  });
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture;
  scene.backgroundIntensity = 1;
  scene.backgroundBlurriness = 0;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envTarget = pmrem.fromEquirectangular(texture);
  pmrem.dispose();
  scene.environment = envTarget.texture;
  scene.environmentIntensity = 0.85;

  const disposables = [texture, envTarget.texture];
  return {
    texture,
    environment: envTarget.texture,
    sunDirection: _sun.clone(),
    dispose() {
      if (scene.background === texture) scene.background = null;
      if (scene.environment === envTarget.texture) scene.environment = null;
      disposables.forEach((item) => item.dispose());
    }
  };
}

function addRidge(scene, {
  radius,
  height,
  color,
  seed,
  segments = 220,
  baseY = -10
}) {
  const positions = [];
  const indices = [];
  const offsetA = seed * 0.7;
  const offsetB = seed * 1.9;
  const offsetC = seed * 3.1;

  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    const profile =
      0.48 +
      0.24 * Math.sin(angle * 3 + offsetA) +
      0.16 * Math.sin(angle * 7 + offsetB) +
      0.1 * Math.sin(angle * 13 + offsetC) +
      0.06 * Math.sin(angle * 23 + seed);
    const y = Math.max(3, height * Math.max(0.16, profile));
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    positions.push(x, baseY, z, x, y, z);
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshBasicMaterial({
    color,
    side: THREE.DoubleSide,
    fog: true
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'Distant ridge';
  mesh.renderOrder = -2;
  return mesh;
}

/**
 * Layered ridge silhouettes close the horizon behind the conceptual site.
 * They are atmospheric set dressing, not a survey of the real skyline.
 */
export function addHorizonRidges(scene) {
  const group = new THREE.Group();
  group.name = 'Conceptual horizon';
  const ridges = [
    { radius: 510, height: 54, color: 0x4d5150, seed: 1.7 },
    { radius: 690, height: 82, color: 0x696862, seed: 4.2 },
    { radius: 900, height: 118, color: 0x89837a, seed: 7.9 }
  ];
  for (const config of ridges) {
    const mesh = addRidge(scene, config);
    group.add(mesh);
  }
  scene.add(group);
  return {
    group,
    dispose() {
      group.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) object.material.dispose();
      });
      scene.remove(group);
    }
  };
}
