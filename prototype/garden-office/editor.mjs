import {applySceneEdits, createDefaultScene, importApproach, listAssets, validateScene} from './scene-model.mjs';

const stock = new Map(createDefaultScene().instances.map(instance => [instance.id, instance]));
const placeNearTerrace = {
  stair: {from:[619,56,225], to:[659,56,245], count:4, width:23},
  landing: {anchor:[612,83,225], width:32, depth:16, slab:8, trim:true},
  arch: {anchor:[675,59,225], span:32, height:37},
  wall: {anchor:[675,59,225], width:36, depth:5, height:30},
  lamp: {anchor:[713,125,225], scale:.75},
  'light-cue': {anchor:[206,235,44], width:90, depth:36},
  'joseon-roof': {anchor:[256,300,44], scale:1},
  table: {anchor:[206,235,44], scale:1},
  chair: {anchor:[206,235,44], scale:1},
  tree: {anchor:[206,235,44], scale:1},
  pond: {anchor:[206,235,44], width:100, depth:70},
  boardwalk: {anchor:[206,235,44], width:90, depth:22},
  'stone-paving': {anchor:[206,235,44], width:90, depth:22},
  'pavilion-roof': {anchor:[206,235,44], span:96, depth:72, height:36},
};

function translate(placement, delta) {
  const result = {};
  for (const name of ['anchor','from','to']) {
    if (placement[name]) result[name] = placement[name].map((value, axis) => value + delta[axis]);
  }
  return result;
}

export function attachLayoutEditor(initialScene, render, setEditing) {
  const toggle = document.querySelector('#edit-layout');
  const panel = document.querySelector('#layout-editor');
  const palette = document.querySelector('#asset-choice');
  const components = document.querySelector('#component-choice');
  const remove = document.querySelector('#remove-component');
  const place = document.querySelector('#place-component');
  const status = document.querySelector('#editor-status');
  const titleInput = document.querySelector('#scene-title-editor');
  const routeInput = document.querySelector('#route-stops-editor');
  const geometryInput = document.querySelector('#geometry-editor');
  const transitionRow = document.createElement('div');
  transitionRow.className = 'editor-row';
  transitionRow.innerHTML = '<label for="transition-choice">Transition</label> <select id="transition-choice"></select> ' +
    '<label for="transition-finish">Finish</label> <select id="transition-finish">' +
    '<option value="default">Default</option><option value="stone">Stone</option></select>';
  geometryInput.parentElement.after(transitionRow);
  const transitionChoice = transitionRow.querySelector('#transition-choice');
  const transitionFinish = transitionRow.querySelector('#transition-finish');
  const lightingRow = document.createElement('div');
  lightingRow.className = 'editor-row';
  lightingRow.setAttribute('role', 'group');
  lightingRow.setAttribute('aria-label', 'Directional lighting');
  lightingRow.innerHTML = ['x', 'y', 'z', 'ambient'].map(name => {
    const ambient = name === 'ambient';
    const label = ambient ? 'Ambient light' : `Light ${name.toUpperCase()}`;
    return `<label for="light-${name}">${label}</label> <input id="light-${name}" type="number" ` +
      `min="${ambient ? 0 : -1}" max="1" step="any" style="width:5rem">`;
  }).join(' ') + ' <label><input id="light-deck-treatment" type="checkbox"> Soft deck shadows</label> ' +
    '<button id="apply-lighting" type="button">Apply lighting</button> ' +
    '<button id="clear-lighting" type="button">Clear lighting</button>';
  transitionRow.after(lightingRow);
  const lightingInputs = [...lightingRow.querySelectorAll('input[type="number"]')];
  const lightDeckTreatment = lightingRow.querySelector('#light-deck-treatment');
  const clearLighting = lightingRow.querySelector('#clear-lighting');
  const assets = new Map(listAssets().map(asset => [asset.id, asset.label]));
  let scene = initialScene;
  let floor = null;

  for (const [id, label] of assets) palette.add(new Option(label, id));
  palette.add(new Option('Garden', 'garden'));
  if (assets.has('lamp')) palette.value = 'lamp';

  function selected() {
    return scene.instances.find(instance => instance.id === components.value);
  }

  function preview() {
    const instance = selected();
    remove.disabled = !instance || (!scene.geometry && stock.has(instance.id));
    place.disabled = !floor;
    render(scene, panel.hidden ? null : instance?.placement, panel.hidden ? null : floor?.point);
  }

  function showTransitionFinish() {
    const transition = scene.geometry?.stairs.find(item => item.id === transitionChoice.value);
    transitionFinish.value = transition?.finish ?? 'default';
  }

  function showLighting() {
    const {direction, ambient} = scene.lighting ?? {direction:[0.65,-0.4,0.65], ambient:.62};
    const values = [...direction, ambient];
    lightingInputs.forEach((input, index) => { input.value = values[index]; });
    lightDeckTreatment.checked = scene.lighting?.deckTreatment === 'soft-shadows';
    clearLighting.disabled = !scene.lighting;
  }

  function showScene(nextScene, preferredId, updateFields = false) {
    scene = nextScene;
    if (updateFields) {
      titleInput.value = scene.title ?? '';
      routeInput.value = scene.route ? JSON.stringify(scene.route, null, 2) : '';
      geometryInput.value = scene.geometry ? JSON.stringify(scene.geometry, null, 2) : '';
      showLighting();
    }
    components.replaceChildren();
    for (const {id, asset, placement} of scene.instances) {
      const label = placement.finish === 'garden' ? 'Garden' : assets.get(asset);
      components.add(new Option(`${label} (${id})`, id));
    }
    if (preferredId && scene.instances.some(instance => instance.id === preferredId)) {
      components.value = preferredId;
    }
    const transitions = scene.geometry?.stairs ?? [];
    const transitionId = transitionChoice.value;
    transitionRow.hidden = transitions.length === 0;
    transitionChoice.replaceChildren(...transitions.map(({id}) => new Option(id, id)));
    if (transitions.some(({id}) => id === transitionId)) transitionChoice.value = transitionId;
    showTransitionFinish();
    preview();
  }

  function edit(change, message, selection = change.id) {
    try {
      showScene(applySceneEdits(scene, {version:1, edits:[change]}), selection);
      status.value = message;
    } catch (error) {
      status.value = error.message;
    }
  }

  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    floor = null;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
    toggle.textContent = panel.hidden ? 'Edit layout' : 'Finish editing';
    setEditing(!panel.hidden);
    preview();
  });
  components.addEventListener('change', preview);
  function editLighting(lighting, message) {
    try {
      showScene(applySceneEdits(scene, {version:1, edits:[], lighting}), components.value);
      showLighting();
      status.value = message;
    } catch (error) {
      status.value = `Could not apply lighting. ${error.message}`;
    }
  }
  lightingRow.querySelector('#apply-lighting').addEventListener('click', () => {
    const [x, y, z, ambient] = lightingInputs.map(input => input.valueAsNumber);
    const lighting = {direction:[x,y,z], ambient};
    if (lightDeckTreatment.checked) lighting.deckTreatment = 'soft-shadows';
    editLighting(lighting, 'Lighting applied.');
  });
  clearLighting.addEventListener('click', () => editLighting(null, 'Lighting cleared.'));
  transitionChoice.addEventListener('change', showTransitionFinish);
  transitionFinish.addEventListener('change', () => {
    try {
      const geometry = structuredClone(scene.geometry);
      const transition = geometry.stairs.find(item => item.id === transitionChoice.value);
      if (!transition) return;
      if (transitionFinish.value === 'default') delete transition.finish;
      else transition.finish = transitionFinish.value;
      const updateGeometry = geometryInput.value === JSON.stringify(scene.geometry, null, 2);
      showScene(applySceneEdits(scene, {version:1, edits:[], geometry}), components.value);
      if (updateGeometry) geometryInput.value = JSON.stringify(scene.geometry, null, 2);
      status.value = 'Transition finish applied.';
    } catch (error) {
      showTransitionFinish();
      status.value = `Could not apply the transition finish. ${error.message}`;
    }
  });
  place.addEventListener('click', () => {
    if (!floor) return;
    const garden = palette.value === 'garden';
    const asset = garden ? 'stone-paving' : palette.value;
    let index = 1;
    while (scene.instances.some(instance => instance.id === `${asset}-${index}`)) index += 1;
    const id = `${asset}-${index}`;
    const template = placeNearTerrace[asset];
    const origin = template.anchor ?? template.from;
    const positions = template.anchor ? {anchor:floor.point} : translate(template, floor.point.map((value, axis) => value - origin[axis]));
    const placement = {...template, ...positions};
    if (garden) placement.finish = 'garden';
    const target = floor;
    floor = null;
    edit({id, asset, placement}, `Placed ${id} on the ${target.name}.`);
    preview();
  });
  remove.addEventListener('click', () => {
    const instance = selected();
    if (instance && (scene.geometry || !stock.has(instance.id))) {
      edit({id:instance.id, remove:true}, `Removed ${instance.id}.`);
    }
  });

  const directions = {
    'move-left':[-8,0,0], 'move-right':[8,0,0],
    'move-up':[0,-8,0], 'move-down':[0,8,0],
    'raise-component':[0,0,8], 'lower-component':[0,0,-8],
  };
  for (const [id, delta] of Object.entries(directions)) {
    document.querySelector(`#${id}`).addEventListener('click', () => {
      const instance = selected();
      if (!instance) return;
      const placement = translate(instance.placement, delta);
      const point = placement.anchor ?? placement.from;
      edit({id:instance.id, placement}, `Moved ${instance.id} to ${point.join(', ')}.`);
    });
  }

  document.querySelector('#apply-title').addEventListener('click', () => {
    try {
      const title = titleInput.value.trim() ? titleInput.value : null;
      showScene(applySceneEdits(scene, {version:1, edits:[], title}), components.value);
      titleInput.value = scene.title ?? '';
      status.value = 'Title applied.';
    } catch (error) {
      status.value = `Could not apply title. ${error.message}`;
    }
  });
  document.querySelector('#apply-route').addEventListener('click', () => {
    try {
      const {route, ...layout} = scene;
      const input = routeInput.value.trim();
      const nextScene = validateScene(input ? {...layout, route:JSON.parse(input)} : layout);
      showScene(nextScene, components.value);
      routeInput.value = nextScene.route ? JSON.stringify(nextScene.route, null, 2) : '';
      status.value = 'Route applied.';
    } catch (error) {
      status.value = `Could not apply route. ${error.message}`;
    }
  });
  document.querySelector('#apply-structure').addEventListener('click', () => {
    try {
      const geometry = JSON.parse(geometryInput.value);
      const route = JSON.parse(routeInput.value);
      const nextScene = applySceneEdits(scene, {version:1, edits:[], geometry, route});
      const authoredScene = scene.geometry ? nextScene : validateScene({
        ...nextScene,
        instances: nextScene.instances.filter(instance => !stock.has(instance.id)),
      });
      floor = null;
      showScene(authoredScene, components.value, true);
      status.value = 'Structure applied.';
    } catch (error) {
      status.value = `Could not apply structure. ${error.message}`;
    }
  });
  document.querySelector('#save-layout').addEventListener('click', () => {
    const contents = JSON.stringify(validateScene(scene), null, 2) + '\n';
    const url = URL.createObjectURL(new Blob([contents], {type:'application/json'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = scene.geometry ? 'seowon-approach-layout.json' : 'garden-office-layout.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.value = 'Layout download started.';
  });
  document.querySelector('#load-layout').addEventListener('change', async event => {
    const input = event.currentTarget;
    const file = input.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const loaded = data?.study === 'JOS-002' ? importApproach(data) : validateScene(data);
      floor = null;
      showScene(loaded, components.value, true);
      status.value = 'Layout loaded.';
    } catch (error) {
      status.value = `Could not load layout. ${error.message}`;
    } finally {
      input.value = '';
    }
  });

  document.querySelector('#restore-garden-office').addEventListener('click', () => {
    floor = null;
    showScene(initialScene, 'terrace-lamp', true);
    status.value = 'Garden Office loaded.';
  });

  showScene(initialScene, 'terrace-lamp', true);
  return ({id, target}) => {
    if (id) {
      components.value = id;
      status.value = `Selected ${id}.`;
    } else {
      floor = target;
      status.value = target ? `Selected floor: ${target.name}.` : 'Select an open floor in the scene.';
    }
    preview();
  };
}
