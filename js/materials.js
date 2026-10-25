import * as THREE from 'three';
import { createCanvasTexture, mulberry32, paintSoftPatches, randRange } from './utils.js';

function cloneTexture(texture, repeat, anisotropy) {
  const clone = texture.clone();
  clone.wrapS = THREE.RepeatWrapping;
  clone.wrapT = THREE.RepeatWrapping;
  clone.repeat.set(repeat[0], repeat[1]);
  clone.anisotropy = anisotropy;
  clone.needsUpdate = true;
  return clone;
}

function makeGrassTexture(anisotropy) {
  const random = mulberry32(1847);
  return createCanvasTexture(512, 512, (ctx, width, height) => {
    ctx.fillStyle = '#526746';
    ctx.fillRect(0, 0, width, height);
    paintSoftPatches(ctx, width, height, random, 34, [
      'rgba(91,111,74,0.55)',
      'rgba(59,83,54,0.52)',
      'rgba(112,121,79,0.22)',
      'rgba(66,84,54,0.45)'
    ], 130);

    for (let i = 0; i < 26000; i += 1) {
      const x = random() * width;
      const y = random() * height;
      const light = random();
      ctx.fillStyle = light > 0.82
        ? 'rgba(148,151,101,0.34)'
        : light > 0.5
          ? 'rgba(84,107,64,0.5)'
          : 'rgba(43,64,42,0.45)';
      ctx.fillRect(x, y, randRange(random, 0.6, 2.2), randRange(random, 0.6, 2.4));
    }

    // Very subtle mowing bands keep the big lawn from looking like flat felt.
    for (let i = 0; i < 8; i += 1) {
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.018)' : 'rgba(0,0,0,0.018)';
      ctx.fillRect(0, i * 64, width, 64);
    }
  }, { repeat: [58, 58], anisotropy });
}

function makePavingTexture(anisotropy) {
  const random = mulberry32(9921);
  return createCanvasTexture(512, 512, (ctx, width, height) => {
    ctx.fillStyle = '#777369';
    ctx.fillRect(0, 0, width, height);
    const tileW = 128;
    const tileH = 64;
    for (let row = -1; row < height / tileH + 1; row += 1) {
      const offset = row % 2 ? tileW / 2 : 0;
      for (let col = -1; col < width / tileW + 1; col += 1) {
        const x = col * tileW + offset;
        const y = row * tileH;
        const shade = Math.floor(randRange(random, 168, 194));
        ctx.fillStyle = `rgb(${shade},${shade - 3},${shade - 10})`;
        ctx.fillRect(x + 2, y + 2, tileW - 4, tileH - 4);
        ctx.fillStyle = `rgba(255,255,255,${randRange(random, 0.015, 0.05)})`;
        ctx.fillRect(x + 5, y + 5, tileW - 10, 3);
        for (let i = 0; i < 12; i += 1) {
          ctx.fillStyle = `rgba(70,68,61,${randRange(random, 0.02, 0.09)})`;
          ctx.fillRect(x + random() * tileW, y + random() * tileH, randRange(random, 1, 4), 1);
        }
      }
    }
    paintSoftPatches(ctx, width, height, random, 10, ['rgba(57,54,47,0.09)', 'rgba(220,215,199,0.08)'], 160);
  }, { repeat: [1, 1], anisotropy });
}

function makeAsphaltTexture(anisotropy) {
  const random = mulberry32(5521);
  return createCanvasTexture(512, 512, (ctx, width, height) => {
    ctx.fillStyle = '#3e4140';
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 22000; i += 1) {
      const v = Math.floor(randRange(random, 45, 105));
      ctx.fillStyle = `rgba(${v},${v},${v - 2},${randRange(random, 0.06, 0.25)})`;
      ctx.fillRect(random() * width, random() * height, randRange(random, 0.5, 2.1), randRange(random, 0.5, 2.1));
    }
    for (let i = 0; i < 8; i += 1) {
      ctx.strokeStyle = `rgba(24,25,24,${randRange(random, 0.08, 0.2)})`;
      ctx.lineWidth = randRange(random, 0.7, 1.8);
      ctx.beginPath();
      let x = random() * width;
      let y = random() * height;
      ctx.moveTo(x, y);
      for (let j = 0; j < 5; j += 1) {
        x += randRange(random, -25, 30);
        y += randRange(random, -32, 34);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    paintSoftPatches(ctx, width, height, random, 8, ['rgba(23,24,23,0.16)', 'rgba(121,120,115,0.06)'], 190);
  }, { repeat: [1, 1], anisotropy });
}

function makeDeckTexture(anisotropy) {
  const random = mulberry32(2251);
  return createCanvasTexture(512, 512, (ctx, width, height) => {
    ctx.fillStyle = '#7c614a';
    ctx.fillRect(0, 0, width, height);
    const plank = 64;
    for (let x = 0; x < width; x += plank) {
      const base = Math.floor(randRange(random, 118, 148));
      ctx.fillStyle = `rgb(${base},${Math.floor(base * 0.78)},${Math.floor(base * 0.59)})`;
      ctx.fillRect(x + 1, 0, plank - 2, height);
      for (let i = 0; i < 28; i += 1) {
        ctx.strokeStyle = `rgba(45,31,22,${randRange(random, 0.06, 0.2)})`;
        ctx.lineWidth = randRange(random, 0.5, 1.4);
        ctx.beginPath();
        const gx = x + randRange(random, 5, plank - 5);
        ctx.moveTo(gx, 0);
        ctx.bezierCurveTo(gx + randRange(random, -6, 6), height * 0.33, gx + randRange(random, -8, 8), height * 0.66, gx + randRange(random, -4, 4), height);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(30,21,15,0.4)';
      ctx.fillRect(x, 0, 1, height);
    }
  }, { repeat: [1, 1], anisotropy });
}

export function createMaterials(renderer) {
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const grassTexture = makeGrassTexture(anisotropy);
  const pavingTexture = makePavingTexture(anisotropy);
  const asphaltTexture = makeAsphaltTexture(anisotropy);
  const deckTexture = makeDeckTexture(anisotropy);

  const materials = {
    white: new THREE.MeshStandardMaterial({
      name: 'Facade white',
      color: 0xeeeae1,
      roughness: 0.57,
      metalness: 0.025,
      envMapIntensity: 0.58
    }),
    whiteSoft: new THREE.MeshStandardMaterial({
      name: 'Soft white',
      color: 0xddd8cc,
      roughness: 0.67,
      metalness: 0.02,
      envMapIntensity: 0.48
    }),
    ivory: new THREE.MeshStandardMaterial({
      name: 'Ivory soffit',
      color: 0xcac4b8,
      roughness: 0.72,
      metalness: 0.01,
      envMapIntensity: 0.42
    }),
    stone: new THREE.MeshStandardMaterial({
      name: 'Stone plinth',
      color: 0xa7a39a,
      roughness: 0.87,
      metalness: 0.015,
      envMapIntensity: 0.32
    }),
    concrete: new THREE.MeshStandardMaterial({
      name: 'Concrete',
      color: 0x8f8d86,
      roughness: 0.93,
      metalness: 0.01,
      envMapIntensity: 0.25
    }),
    darkMetal: new THREE.MeshStandardMaterial({
      name: 'Dark aluminium',
      color: 0x2c3336,
      roughness: 0.34,
      metalness: 0.68,
      envMapIntensity: 0.85
    }),
    slotDark: new THREE.MeshStandardMaterial({
      name: 'Recessed channel',
      color: 0x24292a,
      roughness: 0.58,
      metalness: 0.28,
      envMapIntensity: 0.4
    }),
    gold: new THREE.MeshStandardMaterial({
      name: 'Bronze louvre',
      color: 0x9c7449,
      roughness: 0.42,
      metalness: 0.52,
      envMapIntensity: 0.85
    }),
    goldDeep: new THREE.MeshStandardMaterial({
      name: 'Deep bronze',
      color: 0x6f4f31,
      roughness: 0.53,
      metalness: 0.38,
      envMapIntensity: 0.6
    }),
    glass: new THREE.MeshPhysicalMaterial({
      name: 'Glass cool',
      color: 0x526b74,
      roughness: 0.14,
      metalness: 0.52,
      envMapIntensity: 1.3,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      side: THREE.FrontSide
    }),
    glassDeep: new THREE.MeshPhysicalMaterial({
      name: 'Glass shaded',
      color: 0x34474e,
      roughness: 0.18,
      metalness: 0.44,
      envMapIntensity: 1.05,
      clearcoat: 0.55,
      clearcoatRoughness: 0.16
    }),
    glassWarm: new THREE.MeshStandardMaterial({
      name: 'Glass warm',
      color: 0x7d5d43,
      emissive: 0xffa85f,
      emissiveIntensity: 0.72,
      roughness: 0.23,
      metalness: 0.28,
      envMapIntensity: 0.9
    }),
    glassLobby: new THREE.MeshPhysicalMaterial({
      name: 'Lobby glass',
      color: 0x40565b,
      roughness: 0.12,
      metalness: 0.4,
      transparent: true,
      opacity: 0.72,
      emissive: 0x241108,
      emissiveIntensity: 0.85,
      envMapIntensity: 1.2,
      side: THREE.DoubleSide
    }),
    railGlass: new THREE.MeshPhysicalMaterial({
      name: 'Balustrade glass',
      color: 0xc3d5d8,
      roughness: 0.12,
      metalness: 0.06,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
      side: THREE.DoubleSide,
      envMapIntensity: 1.2
    }),
    railMetal: new THREE.MeshStandardMaterial({
      name: 'Balustrade rail',
      color: 0x737b7d,
      roughness: 0.3,
      metalness: 0.7,
      envMapIntensity: 0.9
    }),
    lawn: new THREE.MeshStandardMaterial({
      name: 'Lawn',
      map: grassTexture,
      color: 0xe8e6d8,
      roughness: 1,
      metalness: 0,
      envMapIntensity: 0.2
    }),
    lawnInset: new THREE.MeshStandardMaterial({
      name: 'Garden lawn',
      map: cloneTexture(grassTexture, [9, 9], anisotropy),
      color: 0xd6d8c2,
      roughness: 1,
      metalness: 0,
      envMapIntensity: 0.18
    }),
    lawnFar: new THREE.MeshStandardMaterial({
      name: 'Outer grass',
      map: cloneTexture(grassTexture, [260, 260], anisotropy),
      color: 0xbfc7aa,
      roughness: 1,
      metalness: 0,
      envMapIntensity: 0.15
    }),
    soil: new THREE.MeshStandardMaterial({
      name: 'Planting soil',
      color: 0x433a2d,
      roughness: 1
    }),
    paving: new THREE.MeshStandardMaterial({
      name: 'Paving',
      map: pavingTexture,
      color: 0xcfc9bc,
      roughness: 0.9,
      metalness: 0.01,
      envMapIntensity: 0.25
    }),
    pavingCourt: new THREE.MeshStandardMaterial({
      name: 'Entrance paving',
      map: cloneTexture(pavingTexture, [12, 8], anisotropy),
      color: 0xd5cfc2,
      roughness: 0.82,
      metalness: 0.015,
      envMapIntensity: 0.3
    }),
    pavingWalk: new THREE.MeshStandardMaterial({
      name: 'Walkway paving',
      map: cloneTexture(pavingTexture, [34, 2.5], anisotropy),
      color: 0xc7c1b4,
      roughness: 0.88,
      envMapIntensity: 0.25
    }),
    roofPaving: new THREE.MeshStandardMaterial({
      name: 'Roof terrace paving',
      map: cloneTexture(pavingTexture, [16, 4], anisotropy),
      color: 0xd0c9ba,
      roughness: 0.9,
      metalness: 0.01,
      envMapIntensity: 0.24
    }),
    asphalt: new THREE.MeshStandardMaterial({
      name: 'Asphalt',
      map: asphaltTexture,
      color: 0x858582,
      roughness: 0.98,
      metalness: 0.01,
      envMapIntensity: 0.16
    }),
    asphaltDrive: new THREE.MeshStandardMaterial({
      name: 'Drive asphalt',
      map: cloneTexture(asphaltTexture, [5, 13], anisotropy),
      color: 0x7a7a77,
      roughness: 0.96,
      envMapIntensity: 0.18
    }),
    asphaltLoop: new THREE.MeshStandardMaterial({
      name: 'Drop-off asphalt',
      map: cloneTexture(asphaltTexture, [12, 6], anisotropy),
      color: 0x797974,
      roughness: 0.95,
      envMapIntensity: 0.18
    }),
    timber: new THREE.MeshStandardMaterial({
      name: 'Gate timber',
      map: cloneTexture(deckTexture, [7, 1], anisotropy),
      color: 0xd8ba94,
      roughness: 0.6,
      metalness: 0.02,
      envMapIntensity: 0.4
    }),
    gateSlat: new THREE.MeshStandardMaterial({
      name: 'Gate bronze slat',
      color: 0x3d3c37,
      roughness: 0.55,
      metalness: 0.45,
      envMapIntensity: 0.5
    }),
    hedge: new THREE.MeshStandardMaterial({
      name: 'Hedge',
      color: 0x3d5b3f,
      roughness: 0.98,
      metalness: 0,
      envMapIntensity: 0.18
    }),
    mulch: new THREE.MeshStandardMaterial({
      name: 'Mulch',
      color: 0x4c3d2c,
      roughness: 1,
      metalness: 0
    }),
    courtRed: new THREE.MeshStandardMaterial({
      name: 'Sports court',
      color: 0x9b5d50,
      roughness: 0.92,
      metalness: 0.01,
      envMapIntensity: 0.15
    }),
    courtGreen: new THREE.MeshStandardMaterial({
      name: 'Court surround',
      color: 0x55745b,
      roughness: 0.95,
      metalness: 0
    }),
    playWood: new THREE.MeshStandardMaterial({
      name: 'Play timber',
      map: cloneTexture(deckTexture, [2, 2], anisotropy),
      color: 0xe2cbaa,
      roughness: 0.78,
      envMapIntensity: 0.25
    }),
    climbingWall: new THREE.MeshStandardMaterial({
      name: 'Climbing wall',
      color: 0x9a7957,
      roughness: 0.9,
      metalness: 0.02
    }),
    carPaint: new THREE.MeshStandardMaterial({
      name: 'Car paint',
      color: 0xffffff,
      roughness: 0.28,
      metalness: 0.66,
      envMapIntensity: 1.1
    }),
    carGlass: new THREE.MeshStandardMaterial({
      name: 'Car glass',
      color: 0x1a2429,
      roughness: 0.12,
      metalness: 0.55,
      envMapIntensity: 1.2
    }),
    tyre: new THREE.MeshStandardMaterial({
      name: 'Tyre',
      color: 0x151617,
      roughness: 0.92,
      metalness: 0.05
    }),
    pole: new THREE.MeshStandardMaterial({
      name: 'Light pole',
      color: 0x30383a,
      roughness: 0.38,
      metalness: 0.64,
      envMapIntensity: 0.7
    }),
    deck: new THREE.MeshStandardMaterial({
      name: 'Teak deck',
      map: cloneTexture(deckTexture, [8, 5], anisotropy),
      color: 0xdac2a4,
      roughness: 0.8,
      metalness: 0,
      envMapIntensity: 0.28
    }),
    deckWarm: new THREE.MeshStandardMaterial({
      name: 'Warm timber',
      map: cloneTexture(deckTexture, [3, 1.2], anisotropy),
      color: 0xd9c1a4,
      roughness: 0.74,
      envMapIntensity: 0.3
    }),
    foliage: new THREE.MeshStandardMaterial({
      name: 'Foliage',
      color: 0x5e7b58,
      roughness: 0.94,
      metalness: 0,
      flatShading: true,
      envMapIntensity: 0.2
    }),
    foliageDeep: new THREE.MeshStandardMaterial({
      name: 'Foliage deep',
      color: 0x304b3a,
      roughness: 1,
      metalness: 0,
      flatShading: true,
      envMapIntensity: 0.15
    }),
    foliageLight: new THREE.MeshStandardMaterial({
      name: 'Foliage light',
      color: 0x79906a,
      roughness: 0.92,
      flatShading: true,
      envMapIntensity: 0.2
    }),
    palmLeaf: new THREE.MeshStandardMaterial({
      name: 'Palm leaf',
      color: 0x426644,
      roughness: 0.82,
      metalness: 0,
      side: THREE.DoubleSide,
      flatShading: true,
      envMapIntensity: 0.2
    }),
    trunk: new THREE.MeshStandardMaterial({
      name: 'Tree bark',
      color: 0x574537,
      roughness: 0.96,
      metalness: 0,
      envMapIntensity: 0.12
    }),
    flowerPink: new THREE.MeshStandardMaterial({
      name: 'Bougainvillea',
      color: 0xa3576f,
      roughness: 0.9,
      flatShading: true,
      envMapIntensity: 0.2
    }),
    flowerCream: new THREE.MeshStandardMaterial({
      name: 'Cream flower',
      color: 0xd7c7a3,
      roughness: 0.9,
      flatShading: true,
      envMapIntensity: 0.2
    }),
    playPurple: new THREE.MeshStandardMaterial({
      name: 'Play surface',
      color: 0x5c5288,
      roughness: 0.98,
      envMapIntensity: 0.12
    }),
    playCream: new THREE.MeshStandardMaterial({
      name: 'Play rubber',
      color: 0xcfc4ac,
      roughness: 1
    }),
    playPastel: new THREE.MeshStandardMaterial({
      name: 'Play canopy',
      color: 0xbeadbb,
      roughness: 0.82
    }),
    whiteLine: new THREE.MeshStandardMaterial({
      name: 'Road marking',
      color: 0xd9d7cf,
      roughness: 0.82
    }),
    water: new THREE.MeshStandardMaterial({
      name: 'Water',
      color: 0x2f4c54,
      roughness: 0.16,
      metalness: 0.2,
      envMapIntensity: 1.2
    }),
    lightWarm: new THREE.MeshBasicMaterial({
      name: 'Warm light',
      color: 0xffd3a0,
      toneMapped: false
    }),
    lightLens: new THREE.MeshBasicMaterial({
      name: 'Warm lens',
      color: 0xffe6c1,
      toneMapped: false
    }),
    signWhite: new THREE.MeshStandardMaterial({
      name: 'Sign wall',
      color: 0xded9cf,
      roughness: 0.85
    })
  };

  materials._textures = [grassTexture, pavingTexture, asphaltTexture, deckTexture];
  return materials;
}
