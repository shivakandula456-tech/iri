import { BUILDING, HALF_D, HALF_L, ROOF_Y } from './config.js';
import { LIFT_DATA_NOTICE, LIFT_PLACEMENTS } from './lift-data.js';

if (new URLSearchParams(location.search).get('view') === 'lift-placement') void startViewer();

function floorName(n) { return n === 0 ? 'Ground / Lobby' : 'Level ' + String(n).padStart(2,'0'); }
function floorY(n) { return n === 0 ? BUILDING.groundHeight * 0.5 : BUILDING.groundHeight + (n - 1) * BUILDING.floorHeight + BUILDING.floorHeight * 0.5; }
function waitFor(fn, ms) {
  const start = performance.now();
  return new Promise((resolve,reject) => {
    const tick = () => {
      let v = false;
      try { v = Boolean(fn()); } catch {}
      if (v) return resolve(v);
      if (performance.now() - start > ms) return reject(new Error('The shared IRIS 3D model did not become ready. Reload this tab and check the model loading error.'));
      setTimeout(tick,100);
    };
    tick();
  });
}
function styles() {
  const s = document.createElement('style');
  s.textContent = [
    'html.lift-view-mode,html.lift-view-mode body{background:#0b1419;color:#f1ede3}',
    'html.lift-view-mode #app>:not(#scene):not(.scene-vignette):not(.scene-grain):not(#irisLiftViewer){display:none!important}',
    'html.lift-view-mode .scene-vignette,html.lift-view-mode .scene-grain{display:none!important}',
    'html.lift-view-mode.lift-plan-mode #scene{opacity:0!important;pointer-events:none!important}',
    '.lift-viewer{position:fixed;inset:0;z-index:50;color:#f1ede3;font:12px Arial,sans-serif;pointer-events:none}.lift-viewer *{box-sizing:border-box}',
    '.lift-viewer button,.lift-viewer a,.lift-viewer input,.lift-viewer select{pointer-events:auto}',
    '.lift-header{position:absolute;top:14px;left:20px;right:20px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 14px;border:1px solid #ffffff22;border-radius:15px;background:#0a1217ed;backdrop-filter:blur(18px);pointer-events:auto}',
    '.lift-brand{display:flex;align-items:center;gap:10px}.lift-mark{width:32px;height:32px;display:grid;place-items:center;border:1px solid #d7b47a99;border-radius:50%;color:#d7b47a;font:18px Georgia,serif}',
    '.lift-title{margin:0;font:20px Georgia,serif;letter-spacing:.04em}.lift-sub{display:block;margin-top:3px;color:#9ca9ac;font-size:8px;letter-spacing:.18em;text-transform:uppercase}',
    '.lift-actions{display:flex;align-items:center;gap:8px}.lift-badge{padding:7px 9px;border:1px solid #d7b47a55;border-radius:999px;color:#e1c89f;font-size:9px;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap}',
    '.lift-button,.lift-select{min-height:34px;padding:8px 11px;border:1px solid #ffffff2b;border-radius:9px;background:#ffffff0c;color:#f1ede3;font:10px Arial,sans-serif;text-decoration:none;cursor:pointer}.lift-button[aria-pressed=true]{border-color:#d7b47a99;background:#d7b47a24;color:#f5dcb2}.lift-button.primary{border-color:#d7b47a77;background:#d7b47a24}',
    '.lift-toolbar{position:absolute;top:81px;left:20px;right:20px;display:flex;align-items:center;justify-content:space-between;gap:10px;pointer-events:none}.lift-toolbar-group{display:flex;gap:5px;padding:5px;border:1px solid #ffffff1e;border-radius:12px;background:#0a1217dd;pointer-events:auto}',
    '.lift-floor-control{display:flex;align-items:center;gap:8px;padding:5px 8px;border:1px solid #ffffff1e;border-radius:10px;background:#0a1217dd;color:#b5c0c0;font-size:9px;text-transform:uppercase;pointer-events:auto}.lift-select{min-width:130px;background:#132128}',
    '.lift-workspace{position:absolute;top:128px;left:20px;right:20px;bottom:76px;display:grid;grid-template-columns:minmax(0,1fr) minmax(310px,380px);gap:14px;pointer-events:none}',
    '.lift-meta{align-self:start;max-width:min(360px,100%);padding:13px 14px;border-left:2px solid #d7b47a;background:linear-gradient(90deg,#080f19d9,#080f1920);text-shadow:0 2px 12px #000}',
    '.lift-kicker{margin:0 0 8px;color:#d7b47a;font-size:9px;letter-spacing:.18em;text-transform:uppercase}.lift-headline{margin:0 0 8px;font:clamp(22px,2.3vw,32px) Georgia,serif;line-height:1.1}.lift-copy{margin:0;color:#c1c9c7;font-size:10px;line-height:1.6}',
    '.lift-key{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px;color:#d1d9d5;font-size:9px}.lift-key span{display:inline-flex;align-items:center;gap:6px}.lift-swatch{width:8px;height:8px;border-radius:2px}',
    '.lift-panel{height:100%;min-height:0;overflow:auto;border:1px solid #ffffff26;border-radius:16px;background:#0a1217ed;backdrop-filter:blur(20px);pointer-events:auto;scrollbar-width:thin;scrollbar-color:#526068 transparent}.lift-section{padding:14px;border-bottom:1px solid #ffffff17}',
    '.lift-k2{margin:0 0 7px;color:#c9a774;font-size:8px;letter-spacing:.18em;text-transform:uppercase}.lift-section h2{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 11px;font:20px Georgia,serif}.lift-chip{padding:5px 7px;border:1px solid #ffffff24;border-radius:7px;color:#cbd4d2;font:9px Arial,sans-serif}',
    '.lift-plan-frame{padding:7px;border:1px solid #ffffff1b;border-radius:10px;background:#ffffff06}.lift-plan-frame svg{display:block;width:100%;height:auto}.lift-plan-item{cursor:pointer;outline:none}.lift-plan-item:focus-visible rect:first-of-type{stroke:#fff;stroke-width:2.5}.lift-plan-item.is-selected .lift-plan-shaft{stroke:#fff0d3;stroke-width:2.3}',
    '.lift-caption{margin:8px 0 0;color:#9ca9ac;font-size:9px;line-height:1.5}.lift-list{display:grid;grid-template-columns:1fr 1fr;gap:7px}.lift-option{display:flex;align-items:center;gap:9px;width:100%;padding:10px;border:1px solid #ffffff20;border-radius:9px;background:#ffffff06;color:#f1ede3;text-align:left;cursor:pointer}.lift-option[aria-pressed=true]{border-color:#d7b47a88;background:#d7b47a1c}.lift-option-swatch{width:9px;height:22px;flex:none;border-radius:3px;background:var(--lift-color)}.lift-option-label{display:block;font-size:10px;font-weight:bold}.lift-option-status{display:block;margin-top:3px;color:#9ca9ac;font-size:8px}',
    '.lift-detail-name{margin:0 0 5px;font-size:13px;font-weight:bold}.lift-detail-copy{margin:0;color:#a9b5b5;font-size:10px;line-height:1.6}.lift-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:11px}.lift-cell{padding:9px;border:1px solid #ffffff18;border-radius:8px;background:#ffffff06}.lift-cell-label{display:block;margin-bottom:4px;color:#94a4a6;font-size:8px;letter-spacing:.08em;text-transform:uppercase}.lift-cell-value{display:block;color:#e8e2d4;font-size:10px;line-height:1.45;overflow-wrap:anywhere}',
    '.lift-controls{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:13px}.lift-check{display:flex;align-items:center;gap:7px;color:#b7c2c0;font-size:9px;line-height:1.4}.lift-check input,.lift-opacity input{accent-color:#d7b47a}.lift-opacity{grid-column:1/-1;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:9px;color:#a6b2b1;font-size:9px}.lift-opacity input{width:100%}.lift-note{margin:0;color:#a8b4b3;font-size:9px;line-height:1.6}.lift-note strong{color:#dfc18f}',
    '.lift-footer{position:absolute;left:20px;right:420px;bottom:12px;display:flex;justify-content:space-between;gap:12px;color:#a9b5b5;font-size:9px;line-height:1.5;text-shadow:0 2px 12px #000}.lift-footer strong{color:#dfc18f;font-weight:normal}.lift-error{color:#f4b5a8!important}',
    '.lift-viewer.lift-layout-3d .lift-panel{display:none}.lift-viewer.lift-layout-3d .lift-workspace{grid-template-columns:minmax(0,1fr)}.lift-viewer.lift-layout-3d .lift-footer{right:20px}',
    '.lift-viewer.lift-layout-plan .lift-meta{display:none}.lift-viewer.lift-layout-plan .lift-workspace{display:block}.lift-viewer.lift-layout-plan .lift-panel{width:min(980px,100%);height:100%;margin:0 auto}.lift-viewer.lift-layout-plan .lift-footer{right:20px}',
    '@media(max-width:760px){.lift-header{top:8px;left:9px;right:9px;padding:8px 9px;gap:8px;border-radius:12px}.lift-mark{width:28px;height:28px;font-size:14px}.lift-title{font-size:17px}.lift-sub{font-size:7px}.lift-badge{padding:6px 7px;font-size:7px}.lift-actions{gap:5px}.lift-actions .lift-button{padding:7px 8px;font-size:9px}.lift-toolbar{top:67px;left:9px;right:9px;align-items:flex-start;flex-direction:column;gap:6px}.lift-toolbar-group{padding:4px}.lift-button{min-height:31px;padding:7px 8px;font-size:9px}.lift-select{min-height:30px;min-width:116px;font-size:9px;padding:6px}.lift-workspace{top:119px;left:9px;right:9px;bottom:60px;display:block}.lift-meta{padding:9px 10px}.lift-headline{font-size:22px}.lift-copy{font-size:9px;max-width:34ch}.lift-panel{position:absolute;left:0;right:0;bottom:0;height:auto;max-height:44%;border-radius:14px}.lift-section{padding:11px}.lift-section h2{font-size:17px;margin-bottom:9px}.lift-plan-frame{padding:5px}.lift-caption{font-size:8px}.lift-option{padding:7px;gap:6px}.lift-cell{padding:7px}.lift-footer{left:10px;right:10px;bottom:6px;font-size:8px}.lift-footer span:last-child{display:none}.lift-viewer.lift-layout-3d .lift-workspace{display:block}.lift-viewer.lift-layout-3d .lift-footer{right:10px}.lift-viewer.lift-layout-plan .lift-workspace{top:119px;bottom:60px}.lift-viewer.lift-layout-plan .lift-panel{max-height:100%}}',
    '@media(prefers-reduced-motion:reduce){.lift-header,.lift-panel,#scene{transition:none!important}}'
  ].join('');
  document.head.appendChild(s);
}
function createShell() {
  const root = document.createElement('section');
  root.id = 'irisLiftViewer';
  root.className = 'lift-viewer lift-layout-split';
  root.dataset.state = 'loading';
  const options = ['<option value="0">Ground / Lobby</option>'];
  for (let n=1;n<=BUILDING.levels;n++) options.push('<option value="'+n+'">Level '+String(n).padStart(2,'0')+'</option>');
  root.innerHTML =
    '<header class="lift-header"><div class="lift-brand"><span class="lift-mark">I</span><div><h1 class="lift-title">IRIS Residences</h1><span class="lift-sub">Lift placement viewer</span></div></div><div class="lift-actions"><span class="lift-badge">Conceptual model</span><a class="lift-button primary" href="./index.html">Back to exterior ↗</a></div></header>' +
    '<div class="lift-toolbar"><div class="lift-toolbar-group"><button class="lift-button" data-lift-layout="split" aria-pressed="true" type="button">Split view</button><button class="lift-button" data-lift-layout="3d" aria-pressed="false" type="button">3D only</button><button class="lift-button" data-lift-layout="plan" aria-pressed="false" type="button">2D plan</button></div><label class="lift-floor-control" for="irisLiftFloorSelect">Level <select class="lift-select" id="irisLiftFloorSelect">'+options.join('')+'</select></label></div>' +
    '<div class="lift-workspace"><section class="lift-meta"><p class="lift-kicker">Architectural inspection · 01</p><h2 class="lift-headline">Vertical lift core</h2><p class="lift-copy">Inspect conceptual shaft locations through the tower cutaway. Select a lift or level to synchronise the plan and 3D markers.</p><div class="lift-key"><span><i class="lift-swatch" style="background:#D7B47A"></i> Lift A</span><span><i class="lift-swatch" style="background:#70C1C6"></i> Lift B</span></div></section>' +
    '<aside class="lift-panel"><section class="lift-section"><p class="lift-k2">02 · Horizontal placement</p><h2><span>Floor plan</span><span class="lift-chip" id="irisLiftPlanLevel">L08</span></h2><div class="lift-plan-frame" id="irisLiftPlan"></div><p class="lift-caption">Schematic footprint and lift-core positions only. Apartment walls, corridors and actual approaches are not represented.</p></section>' +
    '<section class="lift-section"><p class="lift-k2">03 · Shaft selection</p><h2><span>Lift locations</span><button class="lift-button" id="irisLiftShowAll" type="button" aria-pressed="true">Show all</button></h2><div class="lift-list" id="irisLiftList"></div></section>' +
    '<section class="lift-section"><p class="lift-k2">04 · Selected element</p><h2><span id="irisLiftDetailHeading">All lift locations</span><span class="lift-chip" id="irisLiftDetailState">PROVISIONAL</span></h2><div id="irisLiftDetails"></div><div class="lift-controls"><label class="lift-check"><input id="irisLiftShowStops" type="checkbox" checked> Stop markers</label><label class="lift-check"><input id="irisLiftShowDoors" type="checkbox" checked> Door markers</label><label class="lift-check"><input id="irisLiftShowCars" type="checkbox" checked> Illustrative cars</label><label class="lift-opacity"><span>Shaft opacity</span><input id="irisLiftOpacity" type="range" min="8" max="55" value="28" aria-label="Shaft opacity"><output id="irisLiftOpacityValue">28%</output></label></div></section>' +
    '<section class="lift-section"><p class="lift-note"><strong>Conceptual / unverified.</strong> '+LIFT_DATA_NOTICE+'</p></section></aside></div>' +
    '<footer class="lift-footer"><span><strong>IRIS RESIDENCES · CONCEPT STUDY</strong> · Not surveyed or for construction.</span><span id="irisLiftStatus">Preparing shared model…</span></footer>';
  document.getElementById('app').appendChild(root);
  return root;
}
function planPoint(lift) { return {x:42+((lift.x+HALF_L)/BUILDING.length)*356,y:36+((HALF_D-lift.z)/BUILDING.depth)*119,w:lift.shaftWidth/BUILDING.length*356,h:lift.shaftDepth/BUILDING.depth*119}; }
function makePlan(level, selectedId) {
  let svg='<svg viewBox="0 0 440 190" role="img" aria-label="Conceptual lift plan for '+floorName(level)+'"><defs><pattern id="liftGrid" width="17" height="17" patternUnits="userSpaceOnUse"><path d="M17 0H0V17" fill="none" stroke="#7d9298" stroke-opacity=".13"/></pattern></defs><rect x="10" y="8" width="420" height="174" rx="7" fill="url(#liftGrid)"/><text x="220" y="22" text-anchor="middle" fill="#c8b28e" font-size="8">FRONT / ENTRANCE · +Z</text><rect x="42" y="36" width="356" height="119" fill="#f0ebdf" fill-opacity=".035" stroke="#bac7c1" stroke-opacity=".66"/>';
  for(let i=1;i<8;i++){const x=42+i*356/8;svg+='<line x1="'+x+'" y1="36" x2="'+x+'" y2="155" stroke="#91a3a6" stroke-opacity=".14"/>';}
  svg+='<text x="47" y="169" fill="#91a3a6" font-size="7">CONCEPTUAL FOOTPRINT · NOT FOR CONSTRUCTION</text>';
  for(const lift of LIFT_PLACEMENTS){
    const p=planPoint(lift),sel=selectedId===lift.id,x=p.x-p.w/2,y=p.y-p.h/2;
    svg+='<g class="lift-plan-item'+(sel?' is-selected':'')+'" data-lift-plan="'+lift.id+'" role="button" tabindex="0" aria-label="Select '+lift.label+'"><rect x="'+(x-3)+'" y="'+(y-3)+'" width="'+(p.w+6)+'" height="'+(p.h+6)+'" rx="2" fill="'+lift.color+'" fill-opacity="'+(sel?'.24':'.1')+'" stroke="'+lift.color+'"/><rect class="lift-plan-shaft" x="'+x+'" y="'+y+'" width="'+p.w+'" height="'+p.h+'" fill="'+lift.color+'" fill-opacity="'+(sel?'.68':'.36')+'" stroke="'+lift.color+'"/><line x1="'+(x+1)+'" y1="'+(y-1)+'" x2="'+(x+p.w-1)+'" y2="'+(y-1)+'" stroke="#f1e5ce" stroke-width="2"/><text x="'+p.x+'" y="'+(y+p.h+13)+'" text-anchor="middle" fill="#f0eade" font-size="8">'+lift.label+'</text></g>';
  }
  return svg+'</svg>';
}
function addLiftMeshes(app) {
  const T=app.THREE,layer=new T.Group(),groups=new Map();
  const floorMat=new T.MeshBasicMaterial({color:0xd7b47a,transparent:true,opacity:.08,depthWrite:false,side:T.DoubleSide});
  const floorMesh=new T.Mesh(new T.BoxGeometry(BUILDING.length-8,.06,BUILDING.depth-4),floorMat);
  layer.add(floorMesh);
  for(const lift of LIFT_PLACEMENTS){
    const g=new T.Group();g.name=lift.id+' conceptual shaft';g.position.set(lift.x,0,lift.z);
    const h=lift.topY-lift.bottomY,cy=(lift.topY+lift.bottomY)/2,geom=new T.BoxGeometry(lift.shaftWidth,h,lift.shaftDepth);
    const bodyMat=new T.MeshStandardMaterial({color:lift.color,roughness:.38,metalness:.12,transparent:true,opacity:.28,depthWrite:false});
    const body=new T.Mesh(geom,bodyMat);body.position.y=cy;g.add(body);
    const edgeMat=new T.LineBasicMaterial({color:lift.color,transparent:true,opacity:.95}),edges=new T.LineSegments(new T.EdgesGeometry(geom),edgeMat);edges.position.y=cy;g.add(edges);
    const stops=[],doors=[];
    for(const level of lift.servedFloors){
      const stop=new T.Mesh(new T.BoxGeometry(lift.shaftWidth*.88,.075,lift.shaftDepth*.88),new T.MeshBasicMaterial({color:lift.color,transparent:true,opacity:.72,depthWrite:false}));
      stop.position.y=floorY(level);g.add(stop);stops.push(stop);
      const door=new T.Mesh(new T.BoxGeometry(lift.shaftWidth*.68,Math.min(2,BUILDING.floorHeight*.72),.07),new T.MeshBasicMaterial({color:0xf1e4ce,transparent:true,opacity:.56,depthWrite:false,side:T.DoubleSide}));
      door.position.set(0,floorY(level),lift.shaftDepth/2+.045);g.add(door);doors.push(door);
    }
    const car=new T.Mesh(new T.BoxGeometry(Math.min(1.55,lift.shaftWidth*.7),1.55,Math.min(1.45,lift.shaftDepth*.7)),new T.MeshStandardMaterial({color:0xf4ecd8,emissive:lift.color,emissiveIntensity:.3,roughness:.25,metalness:.25}));
    car.position.y=floorY(Math.min(8,BUILDING.levels));g.add(car);
    const marker=new T.Mesh(new T.SphereGeometry(.16,12,8),new T.MeshBasicMaterial({color:0xffffff}));marker.position.set(0,car.position.y+.94,lift.shaftDepth/2+.12);g.add(marker);
    layer.add(g);groups.set(lift.id,{g,bodyMat,edgeMat,stops,doors,car,marker});
  }
  app.scene.add(layer);
  return {layer,groups,floorMesh,floorMat};
}
async function startViewer() {
  document.documentElement.classList.add('lift-view-mode');
  document.title='IRIS Residences · Lift Placement Viewer';
  styles();
  const root=createShell();
  try {
    const app=await waitFor(()=>window.__IRIS_APP__?.ready?window.__IRIS_APP__:null,60000);
    if(app.director?.isIntroPlaying)app.skipIntro?.();
    if(app.director?.isTransitioning)app.director.interrupt();
    if(!app.buildingExplorer?.active)app.openBuildingExplorer?.();
    app.setBuildingExplorerMode?.('vertical');
    await waitFor(()=>app.buildingExplorer?.getState?.().flightActive===false,15000);
    const target=new app.THREE.Vector3(5.5,ROOF_Y*.51,0);
    app.camera.position.set(76,Math.max(ROOF_Y+17,64),116);app.camera.lookAt(target);
    app.controls.target.copy(target);app.controls.enabled=true;app.controls.update();
    const geom=addLiftMeshes(app);
    let selectedFloor=Math.min(8,BUILDING.levels),selectedLiftId=null,showStops=true,showDoors=true,showCars=true,opacity=.28;
    const renderList=()=>{root.querySelector('#irisLiftList').innerHTML=LIFT_PLACEMENTS.map(l=>'<button class="lift-option" type="button" data-lift-choice="'+l.id+'" aria-pressed="'+(selectedLiftId===l.id)+'" style="--lift-color:'+l.color+'"><i class="lift-option-swatch"></i><span><span class="lift-option-label">'+l.label+'</span><span class="lift-option-status">Conceptual position</span></span></button>').join('');};
    const apply=()=>{
      for(const l of LIFT_PLACEMENTS){const p=geom.groups.get(l.id),on=selectedLiftId===null||selectedLiftId===l.id;p.bodyMat.opacity=opacity*(on?.95:.2);p.edgeMat.opacity=on?.95:.2;p.stops.forEach(m=>m.visible=showStops);p.doors.forEach(m=>m.visible=showDoors);p.car.visible=showCars&&l.servedFloors.includes(selectedFloor);p.car.position.y=floorY(selectedFloor);p.marker.visible=p.car.visible;p.marker.position.y=p.car.position.y+.94;}
      geom.floorMesh.visible=true;geom.floorMesh.position.y=floorY(selectedFloor);geom.floorMat.opacity=.075;
    };
    const details=()=>{
      const l=LIFT_PLACEMENTS.find(x=>x.id===selectedLiftId);
      root.querySelector('#irisLiftPlanLevel').textContent=selectedFloor===0?'GROUND':'L'+String(selectedFloor).padStart(2,'0');
      root.querySelector('#irisLiftPlan').innerHTML=makePlan(selectedFloor,selectedLiftId);
      root.querySelector('#irisLiftShowAll').setAttribute('aria-pressed',String(!l));
      root.querySelector('#irisLiftDetailHeading').textContent=l?l.label:'All lift locations';
      root.querySelector('#irisLiftDetailState').textContent=l?'TO VERIFY':'PROVISIONAL';
      root.querySelector('#irisLiftDetails').innerHTML=l?
        '<p class="lift-detail-name">'+l.id+' · '+l.type+'</p><p class="lift-detail-copy">The values below are editable placeholders in <code>js/lift-data.js</code>, not approved lift specifications.</p><div class="lift-detail-grid">'+
        '<div class="lift-cell"><span class="lift-cell-label">Model X</span><span class="lift-cell-value">'+l.x.toFixed(2)+' m</span></div><div class="lift-cell"><span class="lift-cell-label">Model Z</span><span class="lift-cell-value">'+l.z.toFixed(2)+' m</span></div><div class="lift-cell"><span class="lift-cell-label">Shaft width × depth</span><span class="lift-cell-value">'+l.shaftWidth.toFixed(2)+' × '+l.shaftDepth.toFixed(2)+' m</span></div><div class="lift-cell"><span class="lift-cell-label">Illustrative stops</span><span class="lift-cell-value">Ground + '+BUILDING.levels+' levels</span></div><div class="lift-cell"><span class="lift-cell-label">Door orientation</span><span class="lift-cell-value">'+l.doorSide+'</span></div><div class="lift-cell"><span class="lift-cell-label">Data source</span><span class="lift-cell-value">Conceptual / unverified</span></div></div>':
        '<p class="lift-detail-name">Two conceptual placeholders</p><p class="lift-detail-copy">Both shafts are shown together. Select a lift to highlight its shaft and inspect the provisional coordinates.</p><div class="lift-detail-grid"><div class="lift-cell"><span class="lift-cell-label">Placeholder count</span><span class="lift-cell-value">'+LIFT_PLACEMENTS.length+' lifts</span></div><div class="lift-cell"><span class="lift-cell-label">Illustrative range</span><span class="lift-cell-value">Ground to Level '+BUILDING.levels+'</span></div></div>';
      root.querySelectorAll('[data-lift-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.liftChoice===selectedLiftId)));
    };
    const setLayout=l=>{root.classList.remove('lift-layout-split','lift-layout-3d','lift-layout-plan');document.documentElement.classList.toggle('lift-plan-mode',l==='plan');root.classList.add('lift-layout-'+l);root.querySelectorAll('[data-lift-layout]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.liftLayout===l)));};
    renderList();details();apply();
    root.addEventListener('click',e=>{
      const layout=e.target.closest('[data-lift-layout']);if(layout){setLayout(layout.dataset.liftLayout);return;}
      const choice=e.target.closest('[data-lift-choice]'),plan=e.target.closest('[data-lift-plan]');
      if(choice||plan){const id=choice?choice.dataset.liftChoice:plan.dataset.liftPlan;selectedLiftId=selectedLiftId===id?null:id;apply();details();}
    });
    root.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const p=e.target.closest('[data-lift-plan]');if(!p)return;e.preventDefault();selectedLiftId=selectedLiftId===p.dataset.liftPlan?null:p.dataset.liftPlan;apply();details();});
    root.querySelector('#irisLiftFloorSelect').value=String(selectedFloor);
    root.querySelector('#irisLiftFloorSelect').addEventListener('change',e=>{selectedFloor=Number(e.target.value);apply();details();});
    root.querySelector('#irisLiftShowAll').addEventListener('click',()=>{selectedLiftId=null;apply();details();});
    root.querySelector('#irisLiftShowStops').addEventListener('change',e=>{showStops=e.target.checked;apply();});
    root.querySelector('#irisLiftShowDoors').addEventListener('change',e=>{showDoors=e.target.checked;apply();});
    root.querySelector('#irisLiftShowCars').addEventListener('change',e=>{showCars=e.target.checked;apply();});
    root.querySelector('#irisLiftOpacity').addEventListener('input',e=>{opacity=Number(e.target.value)/100;root.querySelector('#irisLiftOpacityValue').textContent=e.target.value+'%';apply();});
    root.dataset.state='ready';
    root.querySelector('#irisLiftStatus').textContent=LIFT_PLACEMENTS.length+' conceptual placeholders · positions unverified';
    window.__IRIS_LIFT_VIEWER__={ready:true,app,placements:LIFT_PLACEMENTS,get selectedFloor(){return selectedFloor;},get selectedLiftId(){return selectedLiftId;},get layout(){return root.classList.contains('lift-layout-plan')?'plan':root.classList.contains('lift-layout-3d')?'3d':'split';},selectFloor(n){selectedFloor=Math.max(0,Math.min(BUILDING.levels,Number(n)||0));root.querySelector('#irisLiftFloorSelect').value=String(selectedFloor);apply();details();},selectLift(id){selectedLiftId=LIFT_PLACEMENTS.some(l=>l.id===id)?id:null;apply();details();}};
  } catch(error) {
    root.dataset.state='error';root.querySelector('#irisLiftStatus').textContent='Viewer failed to initialise';root.querySelector('#irisLiftStatus').classList.add('lift-error');
    const p=document.createElement('p');p.className='lift-detail-copy lift-error';p.textContent=String(error.message||error);root.querySelector('#irisLiftDetails').replaceChildren(p);console.error('IRIS lift viewer failed:',error);
  }
}
