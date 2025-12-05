import { state, undoManager } from './state.js';
import { objectTypes, getObjectDefaults, hasObjectDragPoints } from './object-types.js';

const BACKGLASS_PROPERTY = {
  Light: 'is_backglass',
  Decal: 'backglass',
  Flasher: 'backglass',
  Timer: 'backglass',
  LightSequencer: 'backglass',
  PartGroup: 'backglass',
};

const NAME_PREFIX = {
  HitTarget: 'Target',
};

export function generateUniqueName(baseName) {
  let counter = 1;
  let name;
  do {
    const suffix = counter < 10 ? `00${counter}` : counter < 100 ? `0${counter}` : `${counter}`;
    name = `${baseName}${suffix}`;
    counter++;
  } while (state.items[name] && counter < 1000);
  return name;
}

export function createObject(type, position) {
  const defaults = getObjectDefaults(type);
  if (!defaults) {
    console.error(`Unknown object type: ${type}`);
    return null;
  }

  const namePrefix = NAME_PREFIX[type] || type;
  const name = generateUniqueName(namePrefix);
  const obj = { ...defaults, name };

  if (obj.center) {
    obj.center.x = position.x;
    obj.center.y = position.y;
  } else if (obj.pos) {
    obj.pos.x = position.x;
    obj.pos.y = position.y;
  } else if (obj.pos_x !== undefined && obj.pos_y !== undefined) {
    obj.pos_x = position.x;
    obj.pos_y = position.y;
  } else if (obj.position) {
    obj.position.x = position.x;
    obj.position.y = position.y;
  } else if (obj.ver1 && obj.ver2) {
    const width = obj.ver2.x - obj.ver1.x;
    const height = obj.ver2.y - obj.ver1.y;
    obj.ver1.x = position.x - width / 2;
    obj.ver1.y = position.y - height / 2;
    obj.ver2.x = position.x + width / 2;
    obj.ver2.y = position.y + height / 2;
  }

  const typeConfig = objectTypes[type];
  if (typeConfig?.createDragPoints) {
    obj.drag_points = typeConfig.createDragPoints(position, defaults);
  } else if (hasObjectDragPoints(type) && obj.drag_points) {
    for (const pt of obj.drag_points) {
      pt.x += position.x;
      pt.y += position.y;
    }
  }

  if (obj.drag_points) {
    for (const pt of obj.drag_points) {
      if (pt.is_locked === undefined) pt.is_locked = false;
      if (pt.editor_layer === undefined) pt.editor_layer = 0;
      if (pt.editor_layer_name === undefined) pt.editor_layer_name = '';
      if (pt.editor_layer_visibility === undefined) pt.editor_layer_visibility = true;
    }
  }

  obj._type = type;
  obj._fileName = `gameitems/${type}.${name}.json`;
  obj._layer = 0;
  obj.is_locked = false;

  if (state.backglassView && BACKGLASS_PROPERTY[type]) {
    obj[BACKGLASS_PROPERTY[type]] = true;
  }

  return obj;
}

async function saveNewObjectInternal(obj) {
  const type = obj._type;
  const saveData = { [type]: {} };

  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('_')) continue;
    saveData[type][key] = value;
  }

  const filePath = `${state.extractedDir}/${obj._fileName}`;
  const result = await window.vpxEditor.writeFile(filePath, JSON.stringify(saveData, null, 2));

  if (!result.success) {
    console.error(`Failed to save object: ${result.error}`);
    return false;
  }

  const gameitemsPath = `${state.extractedDir}/gameitems.json`;
  const gameitemsResult = await window.vpxEditor.readFile(gameitemsPath);

  if (gameitemsResult.success) {
    try {
      const gameitems = JSON.parse(gameitemsResult.content);
      gameitems.push({
        file_name: `${type}.${obj.name}.json`,
        is_locked: false,
        editor_layer: obj._layer || 0,
      });
      await window.vpxEditor.writeFile(gameitemsPath, JSON.stringify(gameitems, null, 2));
      state.gameitems = gameitems;
    } catch (parseError) {
      console.error('Failed to parse gameitems.json:', parseError);
      console.error('Using in-memory gameitems instead');
      state.gameitems.push({
        file_name: `${type}.${obj.name}.json`,
        is_locked: false,
        editor_layer: obj._layer || 0,
      });
      await window.vpxEditor.writeFile(gameitemsPath, JSON.stringify(state.gameitems, null, 2));
    }
  }

  state.items[obj.name] = obj;
  return true;
}

export async function saveNewObject(obj, skipUndo = false) {
  if (skipUndo) {
    undoManager.markForCreate(obj.name);
    return saveNewObjectInternal(obj);
  }
  undoManager.beginUndo(`Create ${obj._type}`);
  undoManager.markForCreate(obj.name);
  const success = await saveNewObjectInternal(obj);
  if (!success) {
    undoManager.cancelUndo();
    return false;
  }
  undoManager.endUndo();
  return true;
}

async function deleteObjectInternal(name) {
  const item = state.items[name];
  if (!item) return false;

  const filename = `${item._type}.${name}.json`;
  const filePath = `${state.extractedDir}/gameitems/${filename}`;
  const gameitemsPath = `${state.extractedDir}/gameitems.json`;

  await window.vpxEditor.deleteFile(filePath);

  const gameitemsResult = await window.vpxEditor.readFile(gameitemsPath);

  if (gameitemsResult.success) {
    try {
      const gameitems = JSON.parse(gameitemsResult.content);
      const index = gameitems.findIndex(i => i.file_name === filename);
      if (index >= 0) {
        gameitems.splice(index, 1);
        await window.vpxEditor.writeFile(gameitemsPath, JSON.stringify(gameitems, null, 2));
        state.gameitems = gameitems;
      }
    } catch (parseError) {
      console.error('Failed to parse gameitems.json:', parseError);
      const index = state.gameitems.findIndex(i => i.file_name === filename);
      if (index >= 0) {
        state.gameitems.splice(index, 1);
        await window.vpxEditor.writeFile(gameitemsPath, JSON.stringify(state.gameitems, null, 2));
      }
    }
  }

  delete state.items[name];
  return true;
}

export async function deleteObject(name, skipUndo = false) {
  const item = state.items[name];
  if (!item) return false;

  if (skipUndo) {
    undoManager.markForDelete(name);
    return deleteObjectInternal(name);
  }

  undoManager.beginUndo(`Delete ${name}`);
  undoManager.markForDelete(name);
  const success = await deleteObjectInternal(name);
  undoManager.endUndo();
  return success;
}
