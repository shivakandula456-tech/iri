
/* Unified IRIS Experience Menu. Vanilla JS; no dependencies or backend. */
const ROOT = document.getElementById('app') || document.body;
const canvas = document.getElementById('scene');
const byId = (id) => document.getElementById(id);
const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

const FEATURES = [
  { id: 'cutaway', number: '01', title: 'Vertical Building Cutaway', detail: 'Select a floor, reveal the cutaway, and adjust the cut plane.' },
  { id: 'blueprint', number: '02', title: 'Blueprint-to-Apartment Morph', detail: 'Switch between the building surfaces and architectural edge view.' },
  { id: 'sunlight', number: '03', title: 'Sunlight & Shadow Explorer', detail: 'Adjust the time-of-day control and compare lighting.' },
  { id: 'portal', number: '04', title: 'Seamless Building Portal', detail: 'Move from the exterior into the selected illustrative apartment.' },
  { id: 'layers', number: '05', title: 'Architectural Layer Explorer', detail: 'Inspect facade, floor isolation, cutaway and exploded views.' },
  { id: 'journey', number: '06', title: 'Room-to-Room Journey', detail: 'Navigate the sample apartment and choose rooms from its plan.' },
  { id: 'compare', number: '07', title: 'Live Visual Comparison', detail: 'Save two scene views and compare them with a movable split line.' },
  { id: 'postcard', number: '08', title: 'Architectural Postcard Studio', detail: 'Frame the current view, add a title, and export a PNG image.' }
];

const style = document.createElement('style');
style.textContent = `
.iris-experience-trigger { border-color: rgba(211,176,124,.45) !important; color: var(--ivory) !important; }
.iris-experience-trigger svg { fill:none; stroke:currentColor; stroke-width:1.55; stroke-linecap:round; stroke-linejoin:round; }
.iris-experience-trigger[disabled] { opacity:.48; cursor:wait; }
.iris-experience-scrim { position:fixed; inset:0; z-index:78; background:rgba(3,8,11,.32); backdrop-filter:blur(2px); }
.iris-experience-menu { position:fixed; z-index:79; top:calc(78px + var(--safe-top)); right:18px; width:min(510px,calc(100vw - 32px)); max-height:calc(100dvh - 102px - var(--safe-top)); overflow:auto; border:1px solid rgba(244,238,224,.16); border-radius:20px; background:rgba(12,21,26,.965); box-shadow:0 28px 90px rgba(0,0,0,.52); backdrop-filter:blur(22px); color:var(--ivory); padding:19px; transform:translateY(-7px); opacity:0; transition:opacity 180ms ease,transform 180ms ease; }
.iris-experience-menu.is-open { transform:translateY(0); opacity:1; }
.iris-experience-menu-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding-bottom:15px; border-bottom:1px solid var(--line); }
.iris-experience-kicker { margin:0 0 7px; color:var(--gold); font-size:9px; letter-spacing:.19em; text-transform:uppercase; }
.iris-experience-menu h2,.iris-tool-panel h2 { margin:0; font-family:var(--font-display); font-size:27px; font-weight:400; line-height:1.1; }
.iris-experience-intro { margin:13px 0 15px; color:var(--muted); font-size:11px; line-height:1.65; }
.iris-experience-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; }
.iris-experience-card { min-width:0; min-height:112px; display:flex; flex-direction:column; align-items:flex-start; gap:7px; padding:12px; border:1px solid rgba(244,238,224,.12); border-radius:13px; background:rgba(255,255,255,.025); color:var(--ivory); text-align:left; cursor:pointer; transition:background 160ms ease,border-color 160ms ease,transform 160ms ease; }
.iris-experience-card:hover,.iris-experience-card:focus-visible { background:rgba(211,176,124,.09); border-color:rgba(211,176,124,.5); transform:translateY(-1px); }
.iris-experience-card-top { display:flex; align-items:center; justify-content:space-between; width:100%; color:var(--gold); font-size:9px; letter-spacing:.12em; }
.iris-experience-card-title { font-size:12px; font-weight:600; line-height:1.35; }
.iris-experience-card-detail { color:var(--muted); font-size:10px; line-height:1.5; }
.iris-experience-status { min-height:16px; margin:12px 0 0; color:#c8b99d; font-size:10px; line-height:1.5; }
.iris-experience-footer { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:14px; padding-top:13px; border-top:1px solid var(--line); }
.iris-experience-footer-note { color:var(--muted-2); font-size:9px; line-height:1.5; }
.iris-tool-panel { position:fixed; z-index:81; top:calc(83px + var(--safe-top)); right:18px; width:min(380px,calc(100vw - 28px)); max-height:calc(100dvh - 105px - var(--safe-top)); overflow:auto; padding:17px; border:1px solid rgba(244,238,224,.18); border-radius:17px; background:rgba(12,21,26,.96); box-shadow:0 20px 70px rgba(0,0,0,.5); color:var(--ivory); backdrop-filter:blur(18px); }
.iris-tool-panel header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:13px; }
.iris-tool-panel h2 { font-size:23px; }
.iris-tool-panel p { margin:10px 0; color:var(--muted); font-size:11px; line-height:1.6; }
.iris-tool-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:13px; }
.iris-tool-button { min-height:37px; padding:8px 11px; border:1px solid rgba(244,238,224,.16); border-radius:9px; background:rgba(255,255,255,.045); color:var(--ivory); font:inherit; font-size:10px; text-decoration:none; cursor:pointer; }
.iris-tool-button.primary { border-color:rgba(211,176,124,.48); background:rgba(211,176,124,.13); }
.iris-tool-button:disabled { opacity:.45; cursor:not-allowed; }
.iris-tool-close { width:30px; height:30px; flex:none; border:1px solid var(--line); border-radius:50%; background:transparent; color:var(--ivory); font-size:19px; cursor:pointer; }
.iris-compare-stage { position:relative; width:100%; aspect-ratio:4/3; overflow:hidden; border:1px solid var(--line); border-radius:11px; background:#0b1318; }
.iris-compare-stage img { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; }
.iris-compare-stage .iris-compare-b { clip-path:inset(0 50% 0 0); }
.iris-compare-divider { position:absolute; top:0; bottom:0; left:50%; width:2px; background:#f2eee3; box-shadow:0 0 0 1px rgba(0,0,0,.28); pointer-events:none; }
.iris-compare-labels { display:flex; justify-content:space-between; gap:10px; color:var(--muted); font-size:9px; margin-top:7px; }
.iris-compare-range { width:100%; accent-color:var(--gold); }
.iris-postcard-preview { display:block; width:100%; max-height:260px; object-fit:contain; border-radius:10px; border:1px solid var(--line); background:#0b1318; margin-top:12px; }
.iris-postcard-field { display:block; width:100%; min-height:38px; margin:8px 0; padding:9px 10px; border:1px solid var(--line); border-radius:8px; background:rgba(255,255,255,.04); color:var(--ivory); font:inherit; font-size:11px; }
.iris-transition-sweep { position:fixed; inset:0; z-index:77; pointer-events:none; opacity:0; background:linear-gradient(115deg,transparent 0%,rgba(211,176,124,.08) 35%,rgba(241,235,220,.3) 50%,rgba(211,176,124,.08) 65%,transparent 100%); transform:translateX(-105%); }
.iris-transition-sweep.is-active { animation:irisSweep 850ms cubic-bezier(.22,.65,.25,1) both; }
@keyframes irisSweep { 0%{opacity:0;transform:translateX(-105%)} 18%{opacity:1} 82%{opacity:.8} 100%{opacity:0;transform:translateX(105%)} }
@media(max-width:560px) {
 .iris-experience-trigger { width:auto !important; min-width:38px; padding:0 10px !important; border-radius:999px !important; }
 .iris-experience-trigger span { display:inline !important; font-size:9px; }
 .iris-experience-menu { inset:calc(64px + var(--safe-top)) 8px calc(10px + var(--safe-bottom)); width:auto; max-height:none; padding:14px; border-radius:16px; }
 .iris-experience-menu h2 { font-size:23px; }
 .iris-experience-grid { grid-template-columns:1fr; gap:7px; }
 .iris-experience-card { min-height:80px; padding:10px 11px; }
 .iris-experience-card-detail { max-width:42ch; }
 .iris-experience-footer { padding-bottom:var(--safe-bottom); }
 .iris-tool-panel { top:auto; right:8px; bottom:calc(92px + var(--safe-bottom)); width:calc(100vw - 16px); max-height:68dvh; }
 #replayIntro,#projectSiteLink,#guidedTourButton,#facadeInspectButton,#blueprintToggle,#exploreFloorsButton,#arPreviewButton { display:none !important; }
}
@media(max-width:380px) {
 .iris-experience-trigger { width:38px !important; min-width:38px; padding:0 !important; }
 .iris-experience-trigger span { display:none !important; }
}
@media(prefers-reduced-motion:reduce) { .iris-experience-menu,.iris-experience-card { transition:none; } .iris-transition-sweep.is-active { animation-duration:1ms; } }
`;
document.head.appendChild(style);

const trigger = document.createElement('button');
trigger.type = 'button';
trigger.id = 'irisExperienceMenuButton';
trigger.className = 'top-button iris-experience-trigger';
trigger.setAttribute('aria-haspopup', 'dialog');
trigger.setAttribute('aria-expanded', 'false');
trigger.setAttribute('aria-controls', 'irisExperienceMenu');
trigger.title = 'Open all eight immersive experiences';
trigger.disabled = true;
trigger.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"></path></svg><span>Explore IRIS</span>';
const fullscreen = byId('fullscreenButton');
if (fullscreen?.parentElement) fullscreen.parentElement.insertBefore(trigger, fullscreen);

const wrap = document.createElement('div');
wrap.innerHTML = `
<div id="irisExperienceScrim" class="iris-experience-scrim" hidden></div>
<aside id="irisExperienceMenu" class="iris-experience-menu" role="dialog" aria-modal="true" aria-labelledby="irisExperienceTitle" hidden>
  <header class="iris-experience-menu-head"><div><p class="iris-experience-kicker">IRIS RESIDENCES · DIGITAL TWIN</p><h2 id="irisExperienceTitle">Explore the building</h2></div><button id="irisExperienceMenuClose" class="iris-tool-close" type="button" aria-label="Close Explore IRIS menu">×</button></header>
  <p class="iris-experience-intro">Choose a tool or follow the exterior-to-interior journey. Reopen this menu at any time. Interior rooms are illustrative until approved drawings or 3D assets are supplied.</p>
  <div id="irisExperienceGrid" class="iris-experience-grid"></div>
  <p id="irisExperienceStatus" class="iris-experience-status" role="status" aria-live="polite">Ready when the 3D viewer finishes loading.</p>
  <footer class="iris-experience-footer"><span class="iris-experience-footer-note">EXTERIOR → FLOOR → APARTMENT → VIEW</span><button id="irisReturnExterior" class="iris-tool-button" type="button">Return to exterior</button></footer>
</aside>
<aside id="irisComparePanel" class="iris-tool-panel" role="dialog" aria-modal="false" aria-labelledby="irisCompareTitle" hidden>
  <header><div><p class="iris-experience-kicker">EXPERIENCE 07</p><h2 id="irisCompareTitle">Compare views</h2></div><button class="iris-tool-close" data-close-tool="compare" type="button" aria-label="Close comparison panel">×</button></header>
  <p>Save view A, change the camera or lighting, then save view B. Move the slider to compare both captured scene views.</p>
  <div id="irisCompareStage" class="iris-compare-stage"><img id="irisCompareImageA" alt="Saved comparison view A"><img id="irisCompareImageB" class="iris-compare-b" alt="Saved comparison view B"><span id="irisCompareDivider" class="iris-compare-divider"></span></div>
  <div class="iris-compare-labels"><span>VIEW B</span><span>VIEW A</span></div>
  <label class="visually-hidden" for="irisCompareRange">Comparison divider position</label><input id="irisCompareRange" class="iris-compare-range" type="range" min="0" max="100" value="50">
  <div class="iris-tool-actions"><button id="irisCaptureA" class="iris-tool-button primary" type="button">Save View A</button><button id="irisCaptureB" class="iris-tool-button primary" type="button">Save View B</button><button id="irisCompareClear" class="iris-tool-button" type="button">Clear views</button></div>
  <p id="irisCompareStatus" role="status" aria-live="polite">Capture two views to begin comparing.</p>
</aside>
<aside id="irisPostcardPanel" class="iris-tool-panel" role="dialog" aria-modal="false" aria-labelledby="irisPostcardTitle" hidden>
  <header><div><p class="iris-experience-kicker">EXPERIENCE 08</p><h2 id="irisPostcardTitle">Postcard studio</h2></div><button class="iris-tool-close" data-close-tool="postcard" type="button" aria-label="Close postcard panel">×</button></header>
  <p>Capture the current 3D view, add a title, and export a shareable PNG. The image includes the rendered scene, not the surrounding interface.</p>
  <label class="visually-hidden" for="irisPostcardHeading">Postcard title</label><input id="irisPostcardHeading" class="iris-postcard-field" maxlength="70" value="IRIS RESIDENCES" aria-label="Postcard title">
  <label class="visually-hidden" for="irisPostcardCaption">Postcard subtitle</label><input id="irisPostcardCaption" class="iris-postcard-field" maxlength="100" value="Anandtara · Mundhwa, Pune" aria-label="Postcard subtitle">
  <div class="iris-tool-actions"><button id="irisCreatePostcard" class="iris-tool-button primary" type="button">Capture postcard</button><a id="irisDownloadPostcard" class="iris-tool-button" href="#" download="iris-residences-postcard.png" hidden>Download PNG</a></div>
  <img id="irisPostcardPreview" class="iris-postcard-preview" alt="Preview of generated Iris Residences postcard" hidden>
  <p id="irisPostcardStatus" role="status" aria-live="polite">Choose a camera angle before capturing.</p>
</aside>
<div id="irisTransitionSweep" class="iris-transition-sweep" aria-hidden="true"></div>
`;
while (wrap.firstChild) ROOT.appendChild(wrap.firstChild);

const grid = byId('irisExperienceGrid');
for (const feature of FEATURES) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'iris-experience-card';
  button.dataset.feature = feature.id;
  button.innerHTML =
    '<span class="iris-experience-card-top"><span>EXPERIENCE ' + feature.number + '</span><span aria-hidden="true">↗</span></span>' +
    '<span class="iris-experience-card-title">' + feature.title + '</span>' +
    '<span class="iris-experience-card-detail">' + feature.detail + '</span>';
  grid.appendChild(button);
}

const menu = byId('irisExperienceMenu');
const scrim = byId('irisExperienceScrim');
const statusLine = byId('irisExperienceStatus');
const comparePanel = byId('irisComparePanel');
const postcardPanel = byId('irisPostcardPanel');
const sweep = byId('irisTransitionSweep');
let compareA = '';
let compareB = '';
let postcardObjectUrl = '';

function toast(message) {
  const element = byId('toast');
  if (element) {
    element.textContent = message;
    element.classList.add('is-visible');
    window.setTimeout(() => element.classList.remove('is-visible'), 3500);
  }
}
function setMenuStatus(message) { if (statusLine) statusLine.textContent = message; }
function showMenu() {
  closeToolPanels();
  menu.hidden = false;
  scrim.hidden = false;
  requestAnimationFrame(() => menu.classList.add('is-open'));
  trigger.setAttribute('aria-expanded', 'true');
  byId('irisExperienceMenuClose')?.focus();
}
function hideMenu() {
  menu.classList.remove('is-open');
  scrim.hidden = true;
  menu.hidden = true;
  trigger.setAttribute('aria-expanded', 'false');
}
function closeToolPanels() {
  comparePanel.hidden = true;
  postcardPanel.hidden = true;
  if (postcardObjectUrl) {
    URL.revokeObjectURL(postcardObjectUrl);
    postcardObjectUrl = '';
  }
  const preview = byId('irisPostcardPreview');
  if (preview) {
    preview.hidden = true;
    preview.removeAttribute('src');
  }
  const download = byId('irisDownloadPostcard');
  if (download) {
    download.hidden = true;
    download.removeAttribute('href');
  }
}
function showToolPanel(name) {
  hideMenu();
  closeToolPanels();
  if (name === 'compare') {
    comparePanel.hidden = false;
    updateComparison();
    byId('irisCaptureA')?.focus();
  } else {
    postcardPanel.hidden = false;
    byId('irisPostcardHeading')?.focus();
  }
}
async function waitFor(predicate, timeoutMs = 5000) {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    try { if (predicate()) return true; } catch { /* app may still be booting */ }
    await delay(50);
  }
  try { return Boolean(predicate()); } catch { return false; }
}
async function readyApp() {
  const ok = await waitFor(() => Boolean(window.__IRIS_APP__?.ready), 12000);
  if (!ok) throw new Error('The 3D viewer is not ready yet. Check the loading message before retrying.');
  return window.__IRIS_APP__;
}
function clickExisting(id) {
  const element = byId(id);
  if (!element) throw new Error('Required control #' + id + ' is missing.');
  element.click();
  return element;
}
async function ensureExplorer() {
  const app = await readyApp();
  if (!app.buildingExplorer?.active) clickExisting('exploreFloorsButton');
  const opened = await waitFor(() => Boolean(app.buildingExplorer?.active), 3000);
  if (!opened) throw new Error('The floor explorer did not open. Please reload and retry.');
  return app;
}
async function waitForFlight(app) {
  await waitFor(() => !app.buildingExplorer?.flight, 6500);
}
async function enterSampleApartment() {
  const app = await ensureExplorer();
  if (app.buildingExplorer?.walking && app.buildingExplorer?.mode === 'interior') return app;
  await waitForFlight(app);
  clickExisting('explorerEnterApartment');
  const entered = await waitFor(() => Boolean(app.buildingExplorer?.walking) && app.buildingExplorer?.mode === 'interior', 5000);
  if (!entered) throw new Error('The apartment view did not open. Use the existing Enter apartment control to retry.');
  await waitFor(() => !app.buildingExplorer?.flight, 4000);
  return app;
}
async function captureSceneDataUrl() {
  if (!canvas) throw new Error('The 3D canvas was not found.');
  await nextFrame();
  await nextFrame();
  if (!canvas.width || !canvas.height) throw new Error('The 3D scene has no rendered image yet.');
  const data = canvas.toDataURL('image/png');
  if (!data || data === 'data:,') throw new Error('The scene could not be captured. Please retry after the view renders.');
  return data;
}
function setComparisonPosition(value) {
  const clipped = 100 - Number(value);
  const imageB = byId('irisCompareImageB');
  const divider = byId('irisCompareDivider');
  if (imageB) imageB.style.clipPath = 'inset(0 ' + clipped + '% 0 0)';
  if (divider) divider.style.left = value + '%';
}
function updateComparison() {
  const imageA = byId('irisCompareImageA');
  const imageB = byId('irisCompareImageB');
  imageA.hidden = !compareA;
  imageB.hidden = !compareB;
  if (compareA) imageA.src = compareA; else imageA.removeAttribute('src');
  if (compareB) imageB.src = compareB; else imageB.removeAttribute('src');
  setComparisonPosition(byId('irisCompareRange').value);
  byId('irisCompareStatus').textContent = compareA && compareB
    ? 'Both views are ready. Move the divider to compare them.'
    : compareA ? 'View A saved. Change the camera or lighting, then save View B.'
      : compareB ? 'View B saved. Save View A to complete the comparison.'
        : 'Capture two views to begin comparing.';
}
async function captureCompare(which) {
  const button = byId(which === 'A' ? 'irisCaptureA' : 'irisCaptureB');
  button.disabled = true;
  try {
    const image = await captureSceneDataUrl();
    if (which === 'A') compareA = image; else compareB = image;
    updateComparison();
  } catch (error) {
    byId('irisCompareStatus').textContent = error.message || 'Could not capture this view.';
  } finally {
    button.disabled = false;
  }
}
async function createPostcard() {
  const button = byId('irisCreatePostcard');
  const status = byId('irisPostcardStatus');
  button.disabled = true;
  status.textContent = 'Capturing the rendered view…';
  try {
    const dataUrl = await captureSceneDataUrl();
    const source = new Image();
    source.src = dataUrl;
    if (source.decode) await source.decode();
    else await new Promise((resolve, reject) => {
      source.onload = resolve;
      source.onerror = () => reject(new Error('The captured scene image could not be decoded.'));
    });
    const output = document.createElement('canvas');
    output.width = source.naturalWidth || source.width;
    output.height = source.naturalHeight || source.height;
    const context = output.getContext('2d');
    if (!context) throw new Error('The browser could not create the postcard canvas.');
    context.drawImage(source, 0, 0, output.width, output.height);
    const h = output.height;
    const w = output.width;
    const shade = context.createLinearGradient(0, h * 0.61, 0, h);
    shade.addColorStop(0, 'rgba(4,9,12,0)');
    shade.addColorStop(0.48, 'rgba(4,9,12,.55)');
    shade.addColorStop(1, 'rgba(4,9,12,.9)');
    context.fillStyle = shade;
    context.fillRect(0, h * 0.58, w, h * 0.42);
    const margin = Math.max(24, Math.round(w * 0.045));
    const title = (byId('irisPostcardHeading').value || 'IRIS RESIDENCES').trim().slice(0, 70);
    const caption = (byId('irisPostcardCaption').value || 'Anandtara · Mundhwa, Pune').trim().slice(0, 100);
    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';
    context.fillStyle = '#d3b07c';
    context.font = '600 ' + Math.max(12, Math.round(w * 0.012)) + 'px Arial, sans-serif';
    context.fillText('ARCHITECTURAL VISUAL STUDY', margin, h - margin - Math.max(82, Math.round(h * 0.12)));
    context.fillStyle = '#f2eee3';
    context.font = '400 ' + Math.max(24, Math.round(w * 0.038)) + 'px Georgia, serif';
    context.fillText(title || 'IRIS RESIDENCES', margin, h - margin - Math.max(27, Math.round(h * 0.055)));
    context.fillStyle = 'rgba(242,238,227,.82)';
    context.font = '400 ' + Math.max(12, Math.round(w * 0.014)) + 'px Arial, sans-serif';
    context.fillText(caption || 'Anandtara · Mundhwa, Pune', margin, h - Math.max(10, Math.round(margin * 0.55)));
    const blob = await new Promise((resolve) => output.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('The browser could not encode the postcard as PNG.');
    if (postcardObjectUrl) URL.revokeObjectURL(postcardObjectUrl);
    postcardObjectUrl = URL.createObjectURL(blob);
    const preview = byId('irisPostcardPreview');
    preview.src = postcardObjectUrl;
    preview.hidden = false;
    const download = byId('irisDownloadPostcard');
    download.href = postcardObjectUrl;
    const slug = (title || 'iris-residences').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'iris-residences';
    download.download = slug + '-postcard.png';
    download.hidden = false;
    status.textContent = 'Postcard ready. Preview it here or use Download PNG.';
    // Keep the download behind an explicit user click for browser compatibility.
  } catch (error) {
    status.textContent = error.message || 'Postcard export failed. Please retry.';
  } finally {
    button.disabled = false;
  }
}
function sweepTransition() {
  sweep.classList.remove('is-active');
  void sweep.offsetWidth;
  sweep.classList.add('is-active');
}
async function runFeature(id) {
  hideMenu();
  closeToolPanels();
  try {
    if (id === 'compare') {
      showToolPanel('compare');
      byId('irisCompareStatus').textContent = 'Save View A, change the camera or lighting, then save View B.';
      return;
    }
    if (id === 'postcard') {
      showToolPanel('postcard');
      return;
    }
    if (id === 'sunlight') {
      await readyApp();
      byId('lightTool').open = true;
      byId('timeOfDay')?.focus();
      toast('Move the time-of-day slider to change the conceptual lighting.');
      return;
    }
    if (id === 'blueprint') {
      const app = await readyApp();
      if (app.buildingExplorer?.active) {
        clickExisting('explorerReturnExterior');
        await waitFor(() => !app.buildingExplorer?.active, 2500);
      }
      const blueprintButton = byId('blueprintToggle');
      if (blueprintButton.getAttribute('aria-pressed') !== 'true') {
        sweepTransition();
        await delay(120);
        blueprintButton.click();
        await delay(650);
      }
      sweepTransition();
      await delay(120);
      await enterSampleApartment();
      toast('Blueprint transition complete. You are now inside the illustrative apartment.');
      return;
    }
    if (id === 'cutaway') {
      await ensureExplorer();
      clickExisting('explorerVerticalCutawayMode');
      toast('Vertical tower cutaway active. Adjust the cut-plane slider to inspect the building section.');
      return;
    }
    if (id === 'layers') {
      await ensureExplorer();
      clickExisting('explorerXrayMode');
      toast('Layer controls are open: use X-ray, Isolate floor, Cutaway and Explode tower.');
      return;
    }
    if (id === 'portal') {
      await enterSampleApartment();
      toast('You are inside the illustrative apartment. Use the room list to explore.');
      return;
    }
    if (id === 'journey') {
      await enterSampleApartment();
      const section = byId('explorerRoomSection');
      section.hidden = false;
      section.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      byId('explorerRoomList')?.querySelector('button')?.focus({ preventScroll: true });
      toast('Choose a destination from the room list or floor plan. Drag to look and use WASD or arrows to walk.');
      return;
    }
    throw new Error('This experience is not recognised.');
  } catch (error) {
    toast(error.message || 'The selected experience could not open.');
    setMenuStatus(error.message || 'The selected experience could not open.');
  }
}

trigger.addEventListener('click', showMenu);
byId('irisExperienceMenuClose').addEventListener('click', hideMenu);
scrim.addEventListener('click', hideMenu);
menu.addEventListener('click', (event) => {
  const button = event.target.closest('[data-feature]');
  if (button) runFeature(button.dataset.feature);
});
byId('irisReturnExterior').addEventListener('click', async () => {
  try {
    const app = await readyApp();
    if (app.buildingExplorer?.active) {
      clickExisting('explorerReturnExterior');
      await waitFor(() => !app.buildingExplorer?.active, 3000);
    }
    const blueprint = byId('blueprintToggle');
    if (blueprint?.getAttribute('aria-pressed') === 'true') blueprint.click();
    if (byId('modeOrbit')?.getAttribute('aria-pressed') !== 'true') clickExisting('modeOrbit');
    byId('lightTool').open = false;
    hideMenu();
    toast('Exterior view restored.');
  } catch (error) { toast(error.message || 'Could not restore the exterior view.'); }
});
document.querySelectorAll('[data-close-tool]').forEach((button) => {
  button.addEventListener('click', closeToolPanels);
});
byId('irisCaptureA').addEventListener('click', () => captureCompare('A'));
byId('irisCaptureB').addEventListener('click', () => captureCompare('B'));
byId('irisCompareRange').addEventListener('input', (event) => setComparisonPosition(event.target.value));
byId('irisCompareClear').addEventListener('click', () => {
  compareA = '';
  compareB = '';
  updateComparison();
});
byId('irisCreatePostcard').addEventListener('click', createPostcard);

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (!menu.hidden) {
    event.preventDefault();
    event.stopPropagation();
    hideMenu();
    trigger.focus();
  } else if (!comparePanel.hidden || !postcardPanel.hidden) {
    event.preventDefault();
    event.stopPropagation();
    closeToolPanels();
    trigger.focus();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) sweep.classList.remove('is-active');
});

(async function enableWhenReady() {
  const ok = await waitFor(() => Boolean(window.__IRIS_APP__?.ready), 14000);
  trigger.disabled = !ok;
  if (ok) setMenuStatus('All eight options are available. Choose a feature to begin.');
  else {
    setMenuStatus('The viewer has not finished loading. Check the viewer error message before retrying.');
    trigger.title = 'The 3D viewer is not ready';
  }
})();
