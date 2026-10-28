import * as THREE from "three";
import { seededRandom } from "./utils.js";

function makeCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawTileTexture(options = {}) {
  const size = 512;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const random = seededRandom(options.seed ?? 501);
  const grout = options.grout ?? "#c8baa4";
  const base = options.base ?? "#e9e0d2";

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, options.light ?? "#f1e9dc");
  gradient.addColorStop(0.55, base);
  gradient.addColorStop(1, options.dark ?? "#ddd2c0");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 26; i += 1) {
    const startX = random() * size;
    const startY = random() * size;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(
      startX + (random() - 0.5) * 180,
      startY + (random() - 0.5) * 240,
      startX + (random() - 0.5) * 260,
      startY + (random() - 0.5) * 280,
      startX + (random() - 0.5) * 340,
      startY + (random() - 0.5) * 340,
    );
    ctx.strokeStyle = `rgba(255, 251, 242, ${0.05 + random() * 0.08})`;
    ctx.lineWidth = 0.6 + random() * 2.4;
    ctx.stroke();
  }

  for (let i = 0; i < 18; i += 1) {
    const startX = random() * size;
    const startY = random() * size;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(
      startX + (random() - 0.5) * 120,
      startY + random() * 130,
      startX + (random() - 0.5) * 220,
      startY + random() * 220,
    );
    ctx.strokeStyle = `rgba(150, 133, 111, ${0.04 + random() * 0.06})`;
    ctx.lineWidth = 0.5 + random() * 1.4;
    ctx.stroke();
  }

  const sheen = ctx.createLinearGradient(0, 0, size * 0.8, size);
  sheen.addColorStop(0, "rgba(255,255,255,0.13)");
  sheen.addColorStop(0.4, "rgba(255,255,255,0)");
  sheen.addColorStop(1, "rgba(255,255,255,0.04)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = grout;
  ctx.fillRect(0, 0, size, 4);
  ctx.fillRect(0, 0, 4, size);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(4, 4, size - 4, 1);
  ctx.fillRect(4, 4, 1, size - 4);

  return canvas;
}

function drawBalconyTileTexture() {
  const size = 512;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const random = seededRandom(1907);
  ctx.fillStyle = "#d9d4c8";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i += 1) {
    const tone = 190 + Math.floor(random() * 45);
    ctx.fillStyle = `rgba(${tone}, ${tone - 4}, ${tone - 13}, ${0.08 + random() * 0.14})`;
    ctx.fillRect(random() * size, random() * size, 1 + random() * 2, 1 + random() * 2);
  }
  ctx.strokeStyle = "rgba(125, 119, 107, 0.55)";
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(255,255,255,0.34)";
  ctx.lineWidth = 1;
  ctx.strokeRect(4, 4, size - 8, size - 8);
  return canvas;
}

function drawWoodTexture() {
  const size = 768;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const random = seededRandom(501501);

  const base = ctx.createLinearGradient(0, 0, size, 0);
  base.addColorStop(0, "#523522");
  base.addColorStop(0.3, "#69462c");
  base.addColorStop(0.62, "#5a3a24");
  base.addColorStop(1, "#4a2f1e");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 360; i += 1) {
    const x = random() * size;
    const width = 0.5 + random() * 3.4;
    const alpha = 0.03 + random() * 0.15;
    const light = random() > 0.47;
    ctx.strokeStyle = light
      ? `rgba(190, 144, 96, ${alpha})`
      : `rgba(32, 19, 10, ${alpha + 0.03})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, -20);
    const wobble = (random() - 0.5) * 42;
    ctx.bezierCurveTo(x + wobble, size * 0.3, x - wobble, size * 0.68, x + (random() - 0.5) * 22, size + 20);
    ctx.stroke();
  }

  for (let i = 0; i < 7; i += 1) {
    const x = random() * size;
    const y = random() * size;
    ctx.beginPath();
    ctx.ellipse(x, y, 8 + random() * 15, 22 + random() * 38, random() * 0.2 - 0.1, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(24, 13, 6, ${0.1 + random() * 0.12})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  const sheen = ctx.createLinearGradient(0, 0, size, size);
  sheen.addColorStop(0, "rgba(255, 224, 184, 0.09)");
  sheen.addColorStop(0.5, "rgba(255,255,255,0.01)");
  sheen.addColorStop(1, "rgba(30, 18, 10, 0.11)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function drawWallTexture() {
  const size = 384;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const random = seededRandom(1221);
  ctx.fillStyle = "#eee7da";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 4500; i += 1) {
    const light = random() > 0.52;
    ctx.fillStyle = light
      ? `rgba(255, 255, 250, ${0.02 + random() * 0.05})`
      : `rgba(148, 132, 112, ${0.015 + random() * 0.035})`;
    ctx.fillRect(random() * size, random() * size, 1 + random() * 2, 1 + random() * 2);
  }
  const glow = ctx.createRadialGradient(size * 0.35, size * 0.3, 10, size * 0.35, size * 0.3, size * 0.8);
  glow.addColorStop(0, "rgba(255,255,255,0.1)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function drawBlueFabricTexture() {
  const size = 384;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const random = seededRandom(91021);
  ctx.fillStyle = "#244766";
  ctx.fillRect(0, 0, size, size);
  for (let x = 0; x < size; x += 3) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.015 + random() * 0.035})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y < size; y += 3) {
    ctx.strokeStyle = `rgba(6, 18, 31, ${0.02 + random() * 0.035})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
  for (let i = 0; i < 900; i += 1) {
    ctx.fillStyle = `rgba(160, 190, 214, ${random() * 0.055})`;
    ctx.fillRect(random() * size, random() * size, 1, 1);
  }
  const light = ctx.createLinearGradient(0, 0, size, size);
  light.addColorStop(0, "rgba(255,255,255,0.07)");
  light.addColorStop(0.5, "rgba(255,255,255,0)");
  light.addColorStop(1, "rgba(0,0,0,0.08)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function drawCurtainTexture() {
  const size = 512;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const random = seededRandom(2234);
  ctx.fillStyle = "#a8a5a0";
  ctx.fillRect(0, 0, size, size);

  const columns = 6;
  const columnWidth = size / columns;
  for (let col = 0; col < columns; col += 1) {
    const x = col * columnWidth;
    ctx.fillStyle = col % 2 === 0 ? "rgba(228, 224, 216, 0.12)" : "rgba(92, 90, 86, 0.055)";
    ctx.fillRect(x, 0, columnWidth, size);

    ctx.strokeStyle = "rgba(238, 234, 225, 0.4)";
    ctx.lineWidth = 1.3;
    for (let row = 0; row < 10; row += 1) {
      const y = row * (size / 10) + 9;
      const inset = 9;
      roundedRect(ctx, x + inset, y, columnWidth - inset * 2, 18, 3);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(95, 91, 85, 0.18)";
    ctx.beginPath();
    ctx.moveTo(x + columnWidth - 1, 0);
    ctx.lineTo(x + columnWidth - 1, size);
    ctx.stroke();
  }

  for (let i = 0; i < 1800; i += 1) {
    const light = random() > 0.5;
    ctx.fillStyle = light
      ? `rgba(255, 255, 255, ${random() * 0.04})`
      : `rgba(64, 61, 58, ${random() * 0.035})`;
    ctx.fillRect(random() * size, random() * size, 1, 1);
  }
  return canvas;
}

function drawRugTexture() {
  const size = 512;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const random = seededRandom(7719);
  ctx.fillStyle = "#6b7f7f";
  ctx.fillRect(0, 0, size, size);

  const stripeWidth = 16;
  for (let x = -stripeWidth; x < size + stripeWidth; x += stripeWidth * 2) {
    ctx.fillStyle = "rgba(39, 61, 66, 0.27)";
    ctx.fillRect(x, 0, stripeWidth, size);
    ctx.fillStyle = "rgba(223, 219, 204, 0.13)";
    ctx.fillRect(x + stripeWidth + 9, 0, 3, size);
  }

  for (let y = 0; y < size; y += 6) {
    ctx.fillStyle = y % 12 === 0 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.035)";
    ctx.fillRect(0, y, size, 1);
  }
  for (let i = 0; i < 3800; i += 1) {
    ctx.fillStyle = `rgba(${random() > 0.5 ? "220,220,210" : "28,39,41"}, ${random() * 0.1})`;
    ctx.fillRect(random() * size, random() * size, 1, 1);
  }
  return canvas;
}

function drawClockTexture() {
  const size = 512;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.45;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#e6dfd2";
  ctx.fill();
  ctx.strokeStyle = "#34312c";
  ctx.lineWidth = 13;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, radius - 17, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(176, 138, 74, 0.8)";
  ctx.lineWidth = 3;
  ctx.stroke();

  for (let i = 0; i < 60; i += 1) {
    const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const major = i % 5 === 0;
    const inner = radius - (major ? 34 : 21);
    const outer = radius - 13;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.strokeStyle = major ? "#302d28" : "rgba(48,45,40,0.5)";
    ctx.lineWidth = major ? 5 : 2;
    ctx.stroke();
  }

  ctx.fillStyle = "#2d2a25";
  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.fill();

  const hour = (-55 / 60) * Math.PI * 2;
  const minute = (-6 / 60) * Math.PI * 2;
  ctx.strokeStyle = "#25221e";
  ctx.lineCap = "round";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(hour) * radius * 0.48, cy + Math.sin(hour) * radius * 0.48);
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(minute) * radius * 0.67, cy + Math.sin(minute) * radius * 0.67);
  ctx.stroke();
  ctx.strokeStyle = "#b08a4a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - Math.cos(minute) * radius * 0.17, cy - Math.sin(minute) * radius * 0.17);
  ctx.stroke();
  return canvas;
}

function drawScreenTexture() {
  const width = 768;
  const height = 448;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#101112");
  gradient.addColorStop(0.42, "#090a0b");
  gradient.addColorStop(1, "#020303");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const sheen = ctx.createLinearGradient(width * 0.1, 0, width * 0.7, height);
  sheen.addColorStop(0, "rgba(255, 246, 226, 0)");
  sheen.addColorStop(0.45, "rgba(255, 246, 226, 0.075)");
  sheen.addColorStop(0.58, "rgba(255, 246, 226, 0.015)");
  sheen.addColorStop(1, "rgba(255, 246, 226, 0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,255,255,0.025)";
  ctx.fillRect(30, 30, width - 60, height - 60);
  return canvas;
}

function drawPlaqueTexture() {
  const width = 512;
  const height = 256;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '600 142px Georgia, "Times New Roman", serif';
  ctx.fillStyle = "rgba(15, 10, 6, 0.28)";
  ctx.fillText("501", width / 2 + 4, height / 2 + 10);
  ctx.fillStyle = "#d8c8a7";
  ctx.fillText("501", width / 2, height / 2 + 2);
  ctx.strokeStyle = "rgba(245, 232, 208, 0.72)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 110, height / 2 + 74);
  ctx.lineTo(width / 2 + 110, height / 2 + 74);
  ctx.stroke();
  return canvas;
}

function drawSubwayTexture() {
  const size = 512;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const random = seededRandom(905);
  ctx.fillStyle = "#d8d0c2";
  ctx.fillRect(0, 0, size, size);
  const tileHeight = 86;
  const tileWidth = 172;
  for (let row = 0; row < 6; row += 1) {
    const offset = row % 2 === 0 ? 0 : -tileWidth / 2;
    for (let col = -1; col < 4; col += 1) {
      const x = offset + col * tileWidth;
      const y = row * tileHeight;
      ctx.fillStyle = "#eee8dc";
      ctx.fillRect(x + 3, y + 3, tileWidth - 6, tileHeight - 6);
      const highlight = ctx.createLinearGradient(x, y, x + tileWidth, y + tileHeight);
      highlight.addColorStop(0, "rgba(255,255,255,0.18)");
      highlight.addColorStop(1, "rgba(190,178,160,0.04)");
      ctx.fillStyle = highlight;
      ctx.fillRect(x + 3, y + 3, tileWidth - 6, tileHeight - 6);
      ctx.fillStyle = `rgba(144, 128, 109, ${0.02 + random() * 0.03})`;
      ctx.fillRect(x + 9, y + 9, tileWidth - 18, 1);
    }
  }
  return canvas;
}

function drawStoneTexture() {
  const size = 512;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const random = seededRandom(731);
  ctx.fillStyle = "#2c2925";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 42; i += 1) {
    ctx.beginPath();
    const x = random() * size;
    const y = random() * size;
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(
      x + random() * 130,
      y + random() * 60,
      x + random() * 170,
      y + random() * 60,
      x + random() * 220,
      y + random() * 100,
    );
    ctx.strokeStyle = `rgba(210, 199, 177, ${0.025 + random() * 0.055})`;
    ctx.lineWidth = 0.6 + random() * 1.3;
    ctx.stroke();
  }
  return canvas;
}

export function createMaterialLibrary(renderer) {
  const textures = [];
  const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  function makeTexture(canvas, options = {}) {
    const texture = new THREE.CanvasTexture(canvas);
    if (options.color !== false) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }
    const clamp = Boolean(options.clamp);
    texture.wrapS = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
    texture.wrapT = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
    if (options.repeat) {
      texture.repeat.set(options.repeat[0], options.repeat[1]);
    }
    texture.anisotropy = maxAnisotropy;
    if (options.flipY !== undefined) {
      texture.flipY = options.flipY;
    }
    texture.needsUpdate = true;
    textures.push(texture);
    return texture;
  }

  const tileTex = makeTexture(drawTileTexture(), { repeat: [1, 1] });
  const balconyTileTex = makeTexture(drawBalconyTileTexture(), { repeat: [1, 1] });
  const woodTex = makeTexture(drawWoodTexture(), { repeat: [1, 1] });
  const wallTex = makeTexture(drawWallTexture(), { repeat: [3, 2] });
  const blueFabricTex = makeTexture(drawBlueFabricTexture(), { repeat: [2, 2] });
  const curtainTex = makeTexture(drawCurtainTexture(), { repeat: [2, 2.4] });
  const rugTex = makeTexture(drawRugTexture(), { repeat: [1, 1] });
  const clockTex = makeTexture(drawClockTexture(), { clamp: true });
  const screenTex = makeTexture(drawScreenTexture(), { clamp: true });
  const plaqueTex = makeTexture(drawPlaqueTexture(), { clamp: true });
  const subwayTex = makeTexture(drawSubwayTexture(), { repeat: [2, 1] });
  const stoneTex = makeTexture(drawStoneTexture(), { repeat: [1, 1] });

  const wall = new THREE.MeshStandardMaterial({
    color: 0xf5eee2,
    map: wallTex,
    roughness: 0.94,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  const ceiling = new THREE.MeshStandardMaterial({
    color: 0xf3ece0,
    roughness: 0.96,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  const floorTile = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: tileTex,
    roughness: 0.28,
    metalness: 0.02,
    clearcoat: 0.5,
    clearcoatRoughness: 0.24,
    envMapIntensity: 0.55,
    side: THREE.DoubleSide,
  });

  const balconyTile = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: balconyTileTex,
    roughness: 0.87,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  const wood = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: woodTex,
    roughness: 0.54,
    metalness: 0.02,
    envMapIntensity: 0.3,
  });

  const woodLight = new THREE.MeshStandardMaterial({
    color: 0xb08a66,
    roughness: 0.58,
    metalness: 0,
  });

  const charcoal = new THREE.MeshStandardMaterial({
    color: 0x211d19,
    roughness: 0.53,
    metalness: 0.08,
  });

  const charcoalMatte = new THREE.MeshStandardMaterial({
    color: 0x2a2520,
    roughness: 0.8,
    metalness: 0.02,
  });

  const whiteDoor = new THREE.MeshStandardMaterial({
    color: 0xe9e2d5,
    roughness: 0.52,
    metalness: 0,
  });

  const trim = new THREE.MeshStandardMaterial({
    color: 0xeee7db,
    roughness: 0.75,
    metalness: 0,
  });

  const blackMetal = new THREE.MeshStandardMaterial({
    color: 0x171513,
    roughness: 0.34,
    metalness: 0.72,
  });

  const chrome = new THREE.MeshStandardMaterial({
    color: 0xc8c5bd,
    roughness: 0.19,
    metalness: 0.94,
    envMapIntensity: 1.1,
  });

  const brass = new THREE.MeshStandardMaterial({
    color: 0xb08a4a,
    roughness: 0.32,
    metalness: 0.84,
    envMapIntensity: 1.1,
  });

  const mirror = new THREE.MeshStandardMaterial({
    color: 0xd8d2c7,
    roughness: 0.035,
    metalness: 1,
    envMapIntensity: 1.5,
  });

  const ceramic = new THREE.MeshPhysicalMaterial({
    color: 0xf3f0e8,
    roughness: 0.18,
    clearcoat: 0.8,
    clearcoatRoughness: 0.12,
    envMapIntensity: 0.7,
  });

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xc6d6d7,
    transparent: true,
    opacity: 0.16,
    roughness: 0.05,
    metalness: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    envMapIntensity: 1.1,
  });

  const blueFabric = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: blueFabricTex,
    roughness: 0.92,
    sheen: 0.35,
    sheenRoughness: 0.85,
    sheenColor: new THREE.Color(0x7c9fbd),
  });

  const greyFabric = new THREE.MeshStandardMaterial({
    color: 0x777a76,
    roughness: 0.98,
  });

  const roseFabric = new THREE.MeshStandardMaterial({
    color: 0x9f6772,
    roughness: 0.98,
  });

  const greenFabric = new THREE.MeshStandardMaterial({
    color: 0x37695a,
    roughness: 0.98,
  });

  const creamFabric = new THREE.MeshStandardMaterial({
    color: 0xd8d0c1,
    roughness: 0.98,
  });

  const curtainGrey = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: curtainTex,
    roughness: 0.97,
    side: THREE.DoubleSide,
  });

  const curtainBlue = new THREE.MeshStandardMaterial({
    color: 0x233f5e,
    roughness: 0.96,
    side: THREE.DoubleSide,
  });

  const rug = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: rugTex,
    roughness: 0.96,
    side: THREE.DoubleSide,
  });

  const screen = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    map: screenTex,
  });

  const clockFace = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    map: clockTex,
    transparent: true,
  });

  const plaque = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    map: plaqueTex,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const subway = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: subwayTex,
    roughness: 0.3,
    metalness: 0,
  });

  const stone = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: stoneTex,
    roughness: 0.38,
    metalness: 0.04,
  });

  const plasticBlue = new THREE.MeshStandardMaterial({
    color: 0x2d7898,
    roughness: 0.5,
  });

  const whitePlastic = new THREE.MeshStandardMaterial({
    color: 0xe9e5dd,
    roughness: 0.42,
  });

  const orangePlastic = new THREE.MeshStandardMaterial({
    color: 0xbe5b29,
    roughness: 0.52,
  });

  const waterBlue = new THREE.MeshPhysicalMaterial({
    color: 0x3b8b98,
    transparent: true,
    opacity: 0.58,
    roughness: 0.12,
    metalness: 0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.15,
  });

  const plant = new THREE.MeshStandardMaterial({
    color: 0x426b48,
    roughness: 0.9,
  });

  const terracotta = new THREE.MeshStandardMaterial({
    color: 0x9a7358,
    roughness: 0.9,
  });

  const paper = new THREE.MeshStandardMaterial({
    color: 0xe6dfd2,
    roughness: 0.93,
  });

  const appliance = new THREE.MeshStandardMaterial({
    color: 0x4b3324,
    roughness: 0.43,
    metalness: 0.22,
    envMapIntensity: 0.4,
  });

  const darkBrown = new THREE.MeshStandardMaterial({
    color: 0x3a271b,
    roughness: 0.56,
  });

  const jarGlass = new THREE.MeshStandardMaterial({
    color: 0xcdd2c2,
    roughness: 0.22,
    metalness: 0.05,
  });

  const amber = new THREE.MeshStandardMaterial({
    color: 0xa16d2e,
    roughness: 0.45,
  });

  const ledDiffuser = new THREE.MeshBasicMaterial({
    color: 0xfff7e7,
  });

  const materials = {
    wall,
    ceiling,
    floorTile,
    balconyTile,
    wood,
    woodLight,
    charcoal,
    charcoalMatte,
    whiteDoor,
    trim,
    blackMetal,
    chrome,
    brass,
    mirror,
    ceramic,
    glass,
    blueFabric,
    greyFabric,
    roseFabric,
    greenFabric,
    creamFabric,
    curtainGrey,
    curtainBlue,
    rug,
    screen,
    clockFace,
    plaque,
    subway,
    stone,
    plasticBlue,
    whitePlastic,
    orangePlastic,
    waterBlue,
    plant,
    terracotta,
    paper,
    appliance,
    darkBrown,
    jarGlass,
    amber,
    ledDiffuser,
  };

  function dispose() {
    textures.forEach((texture) => texture.dispose());
    Object.values(materials).forEach((material) => material.dispose());
  }

  return { materials, textures, maxAnisotropy, dispose };
}
