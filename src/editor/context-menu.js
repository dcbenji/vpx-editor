import { state } from './state.js';
import { hasClipboard } from './clipboard.js';
import { toggleItemInCollection, isItemInCollection } from './collections.js';

let activeMenu = null;

export function hideContextMenu() {
  if (activeMenu) {
    activeMenu.remove();
    activeMenu = null;
  }
}

function createMenuItem(text, onClick, disabled = false, checked = null, icon = null) {
  const item = document.createElement('div');
  item.className = 'context-menu-item' + (disabled ? ' disabled' : '');

  if (icon) {
    const img = document.createElement('img');
    img.src = icon;
    img.className = 'context-menu-icon';
    item.appendChild(img);
  } else if (checked !== null) {
    const checkmark = document.createElement('span');
    checkmark.className = 'context-menu-check';
    checkmark.textContent = checked ? '✓' : '';
    item.appendChild(checkmark);
  }

  const label = document.createElement('span');
  label.textContent = text;
  item.appendChild(label);

  if (!disabled && onClick) {
    item.addEventListener('click', () => {
      hideContextMenu();
      onClick();
    });
  }
  return item;
}

function createSeparator() {
  const sep = document.createElement('div');
  sep.className = 'context-menu-separator';
  return sep;
}

function createSubmenuItem(text, items) {
  const item = document.createElement('div');
  item.className = 'context-menu-item has-submenu';

  const label = document.createElement('span');
  label.textContent = text;
  item.appendChild(label);

  const arrow = document.createElement('span');
  arrow.className = 'context-menu-arrow';
  arrow.textContent = '▶';
  item.appendChild(arrow);

  const submenu = document.createElement('div');
  submenu.className = 'context-menu context-submenu';

  for (const subItem of items) {
    if (subItem.separator) {
      submenu.appendChild(createSeparator());
    } else {
      submenu.appendChild(createMenuItem(subItem.label, subItem.onClick, subItem.disabled, subItem.checked));
    }
  }

  item.appendChild(submenu);

  item.addEventListener('mouseenter', () => {
    const itemRect = item.getBoundingClientRect();
    const submenuWidth = submenu.offsetWidth || 160;
    const submenuHeight = submenu.scrollHeight || 200;
    const padding = 10;

    if (itemRect.right + submenuWidth > window.innerWidth) {
      submenu.classList.add('flip-left');
    } else {
      submenu.classList.remove('flip-left');
    }

    const spaceBelow = window.innerHeight - itemRect.top - padding;
    const spaceAbove = itemRect.bottom - padding;

    submenu.classList.remove('flip-up');
    submenu.style.maxHeight = '';

    if (submenuHeight <= spaceBelow) {
      submenu.style.maxHeight = '';
    } else if (submenuHeight <= spaceAbove) {
      submenu.classList.add('flip-up');
      submenu.style.maxHeight = '';
    } else if (spaceBelow >= spaceAbove) {
      submenu.style.maxHeight = spaceBelow + 'px';
    } else {
      submenu.classList.add('flip-up');
      submenu.style.maxHeight = spaceAbove + 'px';
    }
  });

  return item;
}

function positionMenu(menu, screenX, screenY) {
  document.body.appendChild(menu);
  activeMenu = menu;

  const menuRect = menu.getBoundingClientRect();
  let left = screenX;
  let top = screenY;

  if (left + menuRect.width > window.innerWidth) {
    left = window.innerWidth - menuRect.width - 10;
  }
  if (top + menuRect.height > window.innerHeight) {
    top = window.innerHeight - menuRect.height - 10;
  }

  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
}

const EDITABLE_DRAG_POINT_TYPES = ['Wall', 'Surface', 'Ramp', 'Rubber', 'Light', 'Trigger', 'Flasher'];

export function showNodeContextMenu(screenX, screenY, itemName, nodeIndex, callbacks) {
  hideContextMenu();

  const item = state.items[itemName];
  if (!item || !item.drag_points) return;
  if (!EDITABLE_DRAG_POINT_TYPES.includes(item._type)) return;

  const pt = item.drag_points[nodeIndex];
  const isSmooth = pt.smooth === true;
  const isSlingshot = pt.is_slingshot === true;
  const canDelete = item.drag_points.length > 3;
  const isWall = item._type === 'Wall' || item._type === 'Surface';
  const isLocked = item.is_locked === true;
  const isTableLocked = state.isTableLocked === true;
  const isEditDisabled = isLocked || isTableLocked;

  const menu = document.createElement('div');
  menu.className = 'context-menu';

  menu.appendChild(
    createMenuItem('Smooth', () => callbacks.onToggleSmooth?.(itemName, nodeIndex), isEditDisabled, isSmooth)
  );

  if (isWall) {
    menu.appendChild(
      createMenuItem(
        'Slingshot',
        () => callbacks.onToggleSlingshot?.(itemName, nodeIndex),
        isEditDisabled || isSmooth,
        isSlingshot && !isSmooth
      )
    );
  }

  menu.appendChild(createSeparator());

  menu.appendChild(
    createMenuItem('Delete Point', () => callbacks.onDeleteNode?.(itemName, nodeIndex), isEditDisabled || !canDelete)
  );

  positionMenu(menu, screenX, screenY);
}

export async function showObjectContextMenu(
  screenX,
  screenY,
  itemName,
  worldX,
  worldY,
  callbacks,
  allItemsAtPoint = []
) {
  hideContextMenu();

  const item = state.items[itemName];
  if (!item) return;

  const canEditPoints = item.drag_points && EDITABLE_DRAG_POINT_TYPES.includes(item._type);
  const isLocked = item.is_locked === true;
  const isTableLocked = state.isTableLocked === true;
  const isEditDisabled = isLocked || isTableLocked;
  const hasClipboardData = await hasClipboard();

  let allSelectedLocked = true;
  for (const name of state.selectedItems) {
    const selectedItem = state.items[name];
    if (selectedItem && !selectedItem.is_locked) {
      allSelectedLocked = false;
      break;
    }
  }
  const canDeleteAny = !isTableLocked && !allSelectedLocked;

  const menu = document.createElement('div');
  menu.className = 'context-menu';

  if (canEditPoints) {
    menu.appendChild(
      createMenuItem('Add Point', () => callbacks.onAddPoint?.(itemName, worldX, worldY), isEditDisabled)
    );

    menu.appendChild(createMenuItem('Flip X', () => callbacks.onFlipX?.(itemName), isEditDisabled));

    menu.appendChild(createMenuItem('Flip Y', () => callbacks.onFlipY?.(itemName), isEditDisabled));

    menu.appendChild(createMenuItem('Rotate', () => callbacks.onRotate?.(itemName, worldX, worldY), isEditDisabled));

    menu.appendChild(createMenuItem('Scale', () => callbacks.onScale?.(itemName, worldX, worldY), isEditDisabled));

    menu.appendChild(createMenuItem('Translate', () => callbacks.onTranslate?.(itemName), isEditDisabled));

    menu.appendChild(createSeparator());
  }

  menu.appendChild(createMenuItem('Copy', () => callbacks.onCopy?.(itemName), isTableLocked));

  menu.appendChild(
    createMenuItem('Paste', () => callbacks.onPaste?.(worldX, worldY), !hasClipboardData || isTableLocked)
  );

  menu.appendChild(
    createMenuItem('Paste At', () => callbacks.onPasteAtOriginal?.(), !hasClipboardData || isTableLocked)
  );

  menu.appendChild(createSeparator());

  menu.appendChild(createMenuItem('Drawing Order (Hit)', () => callbacks.onDrawingOrderHit?.(), isTableLocked));

  menu.appendChild(createMenuItem('Drawing Order (Select)', () => callbacks.onDrawingOrderSelect?.(), isTableLocked));

  menu.appendChild(createMenuItem('Draw In Front', () => callbacks.onDrawInFront?.(itemName), isEditDisabled));

  menu.appendChild(createMenuItem('Draw In Back', () => callbacks.onDrawInBack?.(itemName), isEditDisabled));

  menu.appendChild(createSeparator());

  if (!isTableLocked && callbacks.onAssignToLayer && Object.keys(state.partGroups).length > 0) {
    const currentGroup = item.part_group_name || null;
    const layerItems = Object.keys(state.partGroups)
      .sort()
      .map(groupName => ({
        label: groupName,
        onClick: () => callbacks.onAssignToLayer?.(itemName, groupName),
        checked: groupName === currentGroup,
      }));

    layerItems.push({ separator: true });
    layerItems.push({
      label: '(Unassigned)',
      onClick: () => callbacks.onAssignToLayer?.(itemName, null),
      checked: currentGroup === null,
    });

    menu.appendChild(createSubmenuItem('Assign to layer', layerItems));
  }

  menu.appendChild(
    createMenuItem('Assign to selected layer', () => callbacks.onAssignToSelectedLayer?.(itemName), isTableLocked)
  );

  if (!isTableLocked && state.collections && state.collections.length > 0) {
    const collectionItems = state.collections.map(collection => ({
      label: collection.name,
      onClick: () => toggleItemInCollection(itemName, collection.name),
      checked: isItemInCollection(itemName, collection.name),
    }));

    menu.appendChild(createSubmenuItem('Add/Remove Collection', collectionItems));
  }

  menu.appendChild(
    createMenuItem(isLocked ? 'Unlock' : 'Lock', () => callbacks.onToggleLock?.(itemName), isTableLocked)
  );

  menu.appendChild(createSeparator());

  menu.appendChild(createMenuItem('Delete', () => callbacks.onDelete?.(itemName), !canDeleteAny));

  if (allItemsAtPoint.length > 1) {
    menu.appendChild(createSeparator());
    menu.appendChild(createSeparator());

    for (const elementName of allItemsAtPoint) {
      menu.appendChild(createMenuItem(elementName, () => callbacks.onSelectElement?.(elementName), false));
    }
  }

  positionMenu(menu, screenX, screenY);
}

const ELEMENT_TYPES = [
  'Wall',
  'Gate',
  'Ramp',
  'Flipper',
  'Plunger',
  'Bumper',
  'Spinner',
  'Timer',
  'Trigger',
  'Light',
  'Kicker',
  'HitTarget',
  'Decal',
  'TextBox',
  'Reel',
  'LightSequencer',
  'Primitive',
  'Flasher',
  'Rubber',
];

const BACKGLASS_ONLY_TYPES = ['TextBox', 'Reel'];
const PLAYFIELD_ONLY_TYPES = [
  'Wall',
  'Gate',
  'Ramp',
  'Flipper',
  'Plunger',
  'Bumper',
  'Spinner',
  'Trigger',
  'HitTarget',
  'Kicker',
  'Primitive',
  'Rubber',
];

export async function showCanvasContextMenu(screenX, screenY, worldX, worldY, callbacks) {
  hideContextMenu();

  const isTableLocked = state.isTableLocked === true;
  const hasClipboardData = await hasClipboard();

  const menu = document.createElement('div');
  menu.className = 'context-menu';

  if (callbacks.onCreateElement && !isTableLocked) {
    const filteredTypes = ELEMENT_TYPES.filter(type => {
      if (state.backglassView) {
        return !PLAYFIELD_ONLY_TYPES.includes(type);
      } else {
        return !BACKGLASS_ONLY_TYPES.includes(type);
      }
    });

    const elementItems = filteredTypes.map(type => ({
      label: type,
      onClick: () => callbacks.onCreateElement?.(type, worldX, worldY),
    }));

    menu.appendChild(createSubmenuItem('Insert', elementItems));
    menu.appendChild(createSeparator());
  }

  menu.appendChild(
    createMenuItem('Paste', () => callbacks.onPaste?.(worldX, worldY), !hasClipboardData || isTableLocked)
  );

  menu.appendChild(
    createMenuItem('Paste At', () => callbacks.onPasteAtOriginal?.(), !hasClipboardData || isTableLocked)
  );

  positionMenu(menu, screenX, screenY);
}

export async function showItemsPanelContextMenu(screenX, screenY, itemName, callbacks) {
  hideContextMenu();

  const item = state.items[itemName];
  if (!item) return;

  const canEditPoints = item.drag_points && EDITABLE_DRAG_POINT_TYPES.includes(item._type);
  const isLocked = item.is_locked === true;
  const isTableLocked = state.isTableLocked === true;
  const isEditDisabled = isLocked || isTableLocked;
  const hasClipboardData = await hasClipboard();

  const menu = document.createElement('div');
  menu.className = 'context-menu';

  if (canEditPoints) {
    menu.appendChild(createMenuItem('Flip X', () => callbacks.onFlipX?.(itemName), isEditDisabled));

    menu.appendChild(createMenuItem('Flip Y', () => callbacks.onFlipY?.(itemName), isEditDisabled));

    menu.appendChild(createMenuItem('Rotate', () => callbacks.onRotate?.(itemName), isEditDisabled));

    menu.appendChild(createMenuItem('Scale', () => callbacks.onScale?.(itemName), isEditDisabled));

    menu.appendChild(createMenuItem('Translate', () => callbacks.onTranslate?.(itemName), isEditDisabled));

    menu.appendChild(createSeparator());
  }

  menu.appendChild(createMenuItem('Copy', () => callbacks.onCopy?.(itemName), isTableLocked));

  menu.appendChild(createMenuItem('Paste', () => callbacks.onPaste?.(), !hasClipboardData || isTableLocked));

  menu.appendChild(
    createMenuItem('Paste At', () => callbacks.onPasteAtOriginal?.(), !hasClipboardData || isTableLocked)
  );

  menu.appendChild(createSeparator());

  menu.appendChild(createMenuItem('Drawing Order (Hit)', () => callbacks.onDrawingOrderHit?.(), isTableLocked));

  menu.appendChild(createMenuItem('Drawing Order (Select)', () => callbacks.onDrawingOrderSelect?.(), isTableLocked));

  menu.appendChild(createMenuItem('Draw In Front', () => callbacks.onDrawInFront?.(itemName), isEditDisabled));

  menu.appendChild(createMenuItem('Draw In Back', () => callbacks.onDrawInBack?.(itemName), isEditDisabled));

  menu.appendChild(createSeparator());

  if (!isTableLocked && callbacks.onAssignToLayer && Object.keys(state.partGroups).length > 0) {
    const currentGroup = item.part_group_name || null;
    const layerItems = Object.keys(state.partGroups)
      .sort()
      .map(groupName => ({
        label: groupName,
        onClick: () => callbacks.onAssignToLayer?.(itemName, groupName),
        checked: groupName === currentGroup,
      }));

    layerItems.push({ separator: true });
    layerItems.push({
      label: '(Unassigned)',
      onClick: () => callbacks.onAssignToLayer?.(itemName, null),
      checked: currentGroup === null,
    });

    menu.appendChild(createSubmenuItem('Assign to layer', layerItems));
  }

  menu.appendChild(
    createMenuItem('Assign to selected layer', () => callbacks.onAssignToSelectedLayer?.(itemName), isTableLocked)
  );

  if (!isTableLocked && state.collections && state.collections.length > 0) {
    const collectionItems = state.collections.map(collection => ({
      label: collection.name,
      onClick: () => toggleItemInCollection(itemName, collection.name),
      checked: isItemInCollection(itemName, collection.name),
    }));

    menu.appendChild(createSubmenuItem('Add/Remove Collection', collectionItems));
  }

  menu.appendChild(
    createMenuItem(isLocked ? 'Unlock' : 'Lock', () => callbacks.onToggleLock?.(itemName), isTableLocked)
  );

  positionMenu(menu, screenX, screenY);
}

export function showLayerContextMenu(screenX, screenY, layerNum, layerName, callbacks) {
  hideContextMenu();

  const isTableLocked = state.isTableLocked === true;

  const menu = document.createElement('div');
  menu.className = 'context-menu';

  menu.appendChild(createMenuItem('Rename...', () => callbacks.onRename?.(layerNum, layerName), isTableLocked));

  menu.appendChild(createSeparator());

  menu.appendChild(createMenuItem('Delete Layer...', () => callbacks.onDelete?.(layerNum, layerName), isTableLocked));

  positionMenu(menu, screenX, screenY);
}

export function showPartGroupContextMenu(screenX, screenY, groupName, callbacks) {
  hideContextMenu();

  const isTableLocked = state.isTableLocked === true;

  const menu = document.createElement('div');
  menu.className = 'context-menu';

  menu.appendChild(createMenuItem('Rename...', () => callbacks.onRename?.(groupName), isTableLocked));

  menu.appendChild(createSeparator());

  menu.appendChild(createMenuItem('Delete Group...', () => callbacks.onDelete?.(groupName), isTableLocked));

  positionMenu(menu, screenX, screenY);
}

export function showCollectionContextMenu(screenX, screenY, collectionName, callbacks) {
  hideContextMenu();

  const isTableLocked = state.isTableLocked === true;

  const menu = document.createElement('div');
  menu.className = 'context-menu';

  menu.appendChild(createMenuItem('Edit...', () => callbacks.onEdit?.(collectionName), isTableLocked));

  menu.appendChild(createMenuItem('Rename...', () => callbacks.onRename?.(collectionName), isTableLocked));

  menu.appendChild(createSeparator());

  menu.appendChild(createMenuItem('Delete', () => callbacks.onDelete?.(collectionName), isTableLocked));

  menu.appendChild(createSeparator());

  menu.appendChild(createMenuItem('Move Up', () => callbacks.onMoveUp?.(collectionName), isTableLocked));

  menu.appendChild(createMenuItem('Move Down', () => callbacks.onMoveDown?.(collectionName), isTableLocked));

  positionMenu(menu, screenX, screenY);
}

export function showConsoleContextMenu(screenX, screenY, callbacks) {
  hideContextMenu();

  const hasSelection = !!window.getSelection().toString();

  const menu = document.createElement('div');
  menu.className = 'context-menu';

  menu.appendChild(createMenuItem('Copy', () => callbacks.onCopy?.(), !hasSelection));

  menu.appendChild(createMenuItem('Select All', () => callbacks.onSelectAll?.(), false));

  menu.appendChild(createSeparator());

  menu.appendChild(createMenuItem('Clear', () => callbacks.onClear?.(), false));

  positionMenu(menu, screenX, screenY);
}

document.addEventListener('click', e => {
  if (activeMenu && !activeMenu.contains(e.target)) {
    hideContextMenu();
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    hideContextMenu();
  }
});
