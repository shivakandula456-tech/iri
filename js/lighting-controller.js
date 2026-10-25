import * as THREE from 'three';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smoothstep = (edge0, edge1, value) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * Responsive time-of-day lighting for the concept scene.
 *
 * This is a presentation control, not a geographic sun-position simulation.
 * The slider updates the directional light, ambient fill, fog, exposure and
 * procedural sky. The reflection environment is regenerated only when the
 * slider is released, avoiding an expensive PMREM pass for each input event.
 */
export class LightingController {
  constructor({ renderer, scene, sky, sun, hemisphere, fill, onChange = () => {} }) {
    this.renderer = renderer;
    this.scene = scene;
    this.sky = sky;
    this.sun = sun;
    this.hemisphere = hemisphere;
    this.fill = fill;
    this.onChange = onChange;
    this.windowMaterials = null;
    this.hour = 18;
    this.setTimeOfDay(this.hour, { refreshEnvironment: false });
  }

  setTimeOfDay(hour, { refreshEnvironment = false } = {}) {
    const nextHour = clamp(Number(hour) || 18, 7, 20);
    this.hour = nextHour;

    const dayProgress = (nextHour - 7) / 13;
    const solarAltitude = Math.max(0.035, Math.sin(dayProgress * Math.PI) * 0.88);
    const sunDirection = new THREE.Vector3(
      Math.cos(dayProgress * Math.PI),
      solarAltitude,
      0.72
    ).normalize();

    const daylight = clamp(Math.sin(dayProgress * Math.PI), 0, 1);
    const warmWindow = 1 - clamp(Math.abs(nextHour - 18) / 3.7, 0, 1);
    const lateTwilight = smoothstep(18.4, 20, nextHour);
    const night = smoothstep(19.2, 20, nextHour);
    const eveningGlow = smoothstep(16.2, 19.6, nextHour);

    if (this.windowMaterials?.glassWarm) {
      this.windowMaterials.glassWarm.emissiveIntensity = 0.08 + eveningGlow * 1.12 + warmWindow * 0.12;
    }
    if (this.windowMaterials?.glassLobby) {
      this.windowMaterials.glassLobby.emissiveIntensity = 0.08 + eveningGlow * 1.0 + night * 0.22;
    }

    this.sun.position.copy(sunDirection).multiplyScalar(210);
    this.sun.intensity = 0.75 + daylight * 2.05 + warmWindow * 0.35;
    this.sun.color
      .set(0xffe5c4)
      .lerp(new THREE.Color(0xffad72), warmWindow * 0.82)
      .lerp(new THREE.Color(0x9eb6dc), lateTwilight * 0.38);

    this.hemisphere.intensity = 0.32 + daylight * 0.78 + warmWindow * 0.08;
    this.hemisphere.color
      .set(0x8eb8dc)
      .lerp(new THREE.Color(0xffd1a2), warmWindow * 0.55)
      .lerp(new THREE.Color(0x42516f), night * 0.72);
    this.hemisphere.groundColor
      .set(0x304436)
      .lerp(new THREE.Color(0x57433d), warmWindow * 0.55)
      .lerp(new THREE.Color(0x111d2b), night * 0.75);

    this.fill.intensity = 0.22 + daylight * 0.38 + lateTwilight * 0.16;
    this.fill.color
      .set(0xb3d3e5)
      .lerp(new THREE.Color(0xffc08c), warmWindow * 0.32)
      .lerp(new THREE.Color(0x627da8), night * 0.62);

    if (this.scene.fog?.color) {
      this.scene.fog.color
        .set(0xb7c8d0)
        .lerp(new THREE.Color(0xc9a78e), warmWindow * 0.72)
        .lerp(new THREE.Color(0x243247), night * 0.82);
      this.scene.fog.density = 0.00072 + warmWindow * 0.00045 + night * 0.00038;
    }

    this.renderer.toneMappingExposure = 0.98 + daylight * 0.14 + warmWindow * 0.08 - night * 0.04;
    if (this.renderer.shadowMap) this.renderer.shadowMap.needsUpdate = true;

    this.sky?.setTimeOfDay?.(nextHour, { refreshEnvironment });
    this.onChange(nextHour, { daylight, warmWindow, lateTwilight });
    return this.hour;
  }

  setWindowMaterials(materials = {}) {
    this.windowMaterials = {
      glassWarm: materials.glassWarm || null,
      glassLobby: materials.glassLobby || null
    };
    this.setTimeOfDay(this.hour, { refreshEnvironment: false });
  }

  getState() {
    return { hour: this.hour };
  }
}
