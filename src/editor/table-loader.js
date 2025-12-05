import { state, elements } from './state.js';
import { VIEW_MODE_2D, VIEW_MODE_3D } from '../shared/constants.js';
import { render, fitToView } from './canvas-renderer.js';
import { is3DInitialized, clearScene, stopAnimation, get3DRenderer, resetCamera } from './canvas-renderer-3d.js';
import { clearPrimitiveMeshCache } from './objects/primitive.js';
import { updateItemsList, selectItem } from './items-panel.js';
import { updatePropertiesPanel } from './properties-panel.js';
import { updateLayersList, updateCollectionsList } from './layers-panel.js';

export async function loadTable() {
  if (is3DInitialized()) {
    clearScene();
  }
  clearPrimitiveMeshCache();
  state.backdropImage = null;
  state.viewMode = VIEW_MODE_2D;
  state.showMaterials = true;
  state.backglassView = false;
  document.getElementById('tool-3d').classList.remove('active');
  const toggleGrid = document.getElementById('toggle-grid');
  const toggleBackdrop = document.getElementById('toggle-backdrop');
  if (toggleGrid) toggleGrid.style.display = '';
  if (toggleBackdrop) toggleBackdrop.style.display = '';
  document.getElementById('toggle-backglass').classList.remove('active');
  document.getElementById('toggle-wireframe').style.display = 'none';
  document.getElementById('toggle-materials').style.display = 'none';
  if (is3DInitialized()) {
    stopAnimation();
    get3DRenderer().domElement.style.display = 'none';
  }
  elements.canvas.style.display = 'block';

  const gamedataResult = await window.vpxEditor.readFile(`${state.extractedDir}/gamedata.json`);
  if (!gamedataResult.success) {
    console.error('Failed to load gamedata.json:', gamedataResult.error);
    return;
  }
  state.gamedata = JSON.parse(gamedataResult.content);

  if (is3DInitialized()) {
    resetCamera();
  }

  const infoResult = await window.vpxEditor.readFile(`${state.extractedDir}/info.json`);
  if (infoResult.success) {
    state.info = JSON.parse(infoResult.content);
  } else {
    state.info = {};
  }

  const gameitemsResult = await window.vpxEditor.readFile(`${state.extractedDir}/gameitems.json`);
  if (!gameitemsResult.success) {
    console.error('Failed to load gameitems.json:', gameitemsResult.error);
    return;
  }
  state.gameitems = JSON.parse(gameitemsResult.content);

  const collectionsResult = await window.vpxEditor.readFile(`${state.extractedDir}/collections.json`);
  if (collectionsResult.success) {
    state.collections = JSON.parse(collectionsResult.content);
  } else {
    state.collections = [];
  }

  const materialsResult = await window.vpxEditor.readFile(`${state.extractedDir}/materials.json`);
  if (materialsResult.success) {
    const materialsArray = JSON.parse(materialsResult.content);
    state.materials = {};
    for (const material of materialsArray) {
      state.materials[material.name] = material;
    }
    state.materialNames = Object.keys(state.materials).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
    console.log(`Loaded ${state.materialNames.length} materials`);
  } else {
    state.materials = {};
    state.materialNames = [];
  }

  const imagesResult = await window.vpxEditor.readFile(`${state.extractedDir}/images.json`);
  if (imagesResult.success) {
    const imagesArray = JSON.parse(imagesResult.content);
    state.images = {};
    for (const image of imagesArray) {
      state.images[image.name] = image;
    }
    state.imageNames = Object.keys(state.images).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    console.log(`Loaded ${state.imageNames.length} images`);
  } else {
    state.images = {};
    state.imageNames = [];
  }

  const soundsResult = await window.vpxEditor.readFile(`${state.extractedDir}/sounds.json`);
  if (soundsResult.success) {
    state.sounds = JSON.parse(soundsResult.content);
    state.soundNames = state.sounds
      .map(s => s.name)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    console.log(`Loaded ${state.soundNames.length} sounds`);
  } else {
    state.sounds = [];
    state.soundNames = [];
  }

  const renderProbesResult = await window.vpxEditor.readFile(`${state.extractedDir}/renderprobes.json`);
  if (renderProbesResult.success) {
    const renderProbesArray = JSON.parse(renderProbesResult.content);
    state.renderProbes = {};
    for (const probe of renderProbesArray) {
      state.renderProbes[probe.name] = probe;
    }
    state.renderProbeNames = Object.keys(state.renderProbes).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
    console.log(`Loaded ${state.renderProbeNames.length} render probes`);
  } else {
    state.renderProbes = {};
    state.renderProbeNames = [];
  }

  state.textureCache.clear();

  state.items = {};
  state.partGroups = {};
  for (const itemInfo of state.gameitems) {
    const itemPath = `${state.extractedDir}/gameitems/${itemInfo.file_name}`;
    const itemResult = await window.vpxEditor.readFile(itemPath);
    if (itemResult.success) {
      const itemData = JSON.parse(itemResult.content);
      const type = Object.keys(itemData)[0];
      const item = itemData[type];
      item._type = type;
      item._fileName = `gameitems/${itemInfo.file_name}`;
      item._layer = itemInfo.editor_layer ?? 0;
      item._layerName = itemInfo.editor_layer_name || null;
      item.is_locked = itemInfo.is_locked ?? false;
      if (itemInfo.editor_layer_visibility !== undefined) {
        item.editor_layer_visibility = itemInfo.editor_layer_visibility;
      }
      state.items[item.name || itemInfo.file_name] = item;

      if (type === 'PartGroup' && item.name) {
        state.partGroups[item.name] = item;
      }
    } else {
      console.warn(`Failed to load item: ${itemPath}`, itemResult.error);
    }
  }
  console.log(`Loaded ${Object.keys(state.items).length} items`);
  console.log(`Loaded ${Object.keys(state.partGroups).length} part groups`);

  if (state.gamedata.image) {
    loadBackdropImage(state.gamedata.image);
  }

  selectItem(null, true);
  updateItemsList('', true);
  updateLayersList();
  updateCollectionsList();
  updatePropertiesPanel();
  updateVRButtonVisibility();
  fitToView();
  render();
}

export async function loadBackdropImage(imageName) {
  const extensions = ['.png', '.jpg', '.jpeg', '.webp', '.bmp'];
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
  };

  for (const ext of extensions) {
    const imagePath = `${state.extractedDir}/images/${imageName}${ext}`;
    try {
      const result = await window.vpxEditor.readBinaryFile(imagePath);
      if (result.success && result.data) {
        const data = result.data;
        const uint8Array =
          data instanceof Uint8Array
            ? data
            : Array.isArray(data)
              ? new Uint8Array(data)
              : new Uint8Array(Object.values(data));
        const blob = new Blob([uint8Array], { type: mimeTypes[ext] });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          state.backdropImage = img;
          render();
        };
        img.onerror = () => {
          console.warn(`Failed to decode image: ${imagePath}`);
        };
        img.src = url;
        return;
      }
    } catch (e) {
      continue;
    }
  }
  console.warn(`Backdrop image not found: ${imageName}`);
}

export async function saveItemToFile(itemName) {
  const item = state.items[itemName];
  if (!item || !item._fileName) return false;

  const type = item._type;
  const saveData = { [type]: {} };

  for (const [key, value] of Object.entries(item)) {
    if (key.startsWith('_') || key === 'is_locked') continue;
    saveData[type][key] = value;
  }

  const result = await window.vpxEditor.writeFile(
    `${state.extractedDir}/${item._fileName}`,
    JSON.stringify(saveData, null, 2)
  );

  if (result.success) {
    elements.statusBar.textContent = `Saved ${itemName}`;
  } else {
    elements.statusBar.textContent = `Failed to save ${itemName}`;
  }
  return result.success;
}

export async function updateGameitemsJson(itemName) {
  const item = state.items[itemName];
  if (!item) return;

  const gameitemEntry = state.gameitems.find(gi => gi.file_name === item._fileName.replace('gameitems/', ''));
  if (gameitemEntry) {
    gameitemEntry.is_locked = item.is_locked;
    gameitemEntry.editor_layer = item._layer;
    await window.vpxEditor.writeFile(`${state.extractedDir}/gameitems.json`, JSON.stringify(state.gameitems, null, 2));
  }
}

export function hasVRPartGroups() {
  if (!state.partGroups) return false;
  for (const group of Object.values(state.partGroups)) {
    const mask = group.player_mode_visibility_mask ?? 0xffff;
    if (mask & 0x0010 && !(mask & 0x0001)) {
      return true;
    }
  }
  return false;
}

export function updateVRButtonVisibility() {
  const vrModeToggle = document.getElementById('vr-mode-toggle');
  if (!vrModeToggle) return;

  const show = state.viewMode === VIEW_MODE_3D && hasVRPartGroups();
  vrModeToggle.style.display = show ? '' : 'none';
  if (!show) {
    vrModeToggle.classList.remove('active');
    state.previewViewMode = 'editor';
  }
}
