import * as THREE from 'three';

export const CMTOVPU = cm => cm * (50 / (2.54 * 1.0625));
export const GROUND_TO_LOCKBAR_HEIGHT = CMTOVPU(91);

export function getSpaceReferenceOffset(gamedata, spaceReference) {
  if (!spaceReference || spaceReference === 'playfield' || spaceReference === 'inherit') {
    return 0;
  }
  const glassBottomHeight = gamedata?.glass_bottom_height ?? 117.65;
  return -(GROUND_TO_LOCKBAR_HEIGHT - glassBottomHeight);
}

export const VISIBILITY_MASK = {
  desktop: 0x0001,
  fullSingleScreen: 0x0002,
  cabinet: 0x0004,
  mixedReality: 0x0008,
  virtualReality: 0x0010,
};

export const VIEW_MODE_MASKS = {
  editor: 0xffff,
  vr: VISIBILITY_MASK.virtualReality,
};

const VIEW_DEFAULTS = {
  desktop: {
    mode: 'camera',
    fov: 50.0,
    inclination: 25.0,
    layback: 0.0,
    offsetX: 0,
    offsetY: 370.5,
    offsetZ: 1296.9,
    scaleX: 1.0,
    scaleY: 1.0,
    scaleZ: 1.0,
    hOfs: 0.0,
    vOfs: 14.0,
  },
  cabinet: {
    mode: 'camera',
    fov: 77.0,
    inclination: 50.0,
    layback: 15.0,
    offsetX: 0,
    offsetY: 370.5,
    offsetZ: 1296.9,
    scaleX: 1.0,
    scaleY: 1.0,
    scaleZ: 1.0,
    hOfs: 0.0,
    vOfs: 22.0,
  },
  vr: {
    fov: 60.0,
    eyeHeight: 2970,
    standBack: 926,
  },
};

export function getViewSetup(gamedata, viewMode) {
  const defaults = VIEW_DEFAULTS[viewMode] || VIEW_DEFAULTS.desktop;

  if (!gamedata) return { ...defaults };

  const suffix =
    {
      desktop: '_desktop',
      cabinet: '_full_single_screen',
      vr: '_desktop',
    }[viewMode] || '_desktop';

  if (viewMode === 'vr') {
    return { ...defaults };
  }

  return {
    mode: gamedata[`bg_view_mode${suffix}`] || defaults.mode,
    fov: gamedata[`bg_fov${suffix}`] ?? defaults.fov,
    inclination: gamedata[`bg_inclination${suffix}`] ?? defaults.inclination,
    layback: gamedata[`bg_layback${suffix}`] ?? defaults.layback,
    offsetX: gamedata[`bg_offset_x${suffix}`] ?? defaults.offsetX,
    offsetY: gamedata[`bg_offset_y${suffix}`] ?? defaults.offsetY,
    offsetZ: gamedata[`bg_offset_z${suffix}`] ?? defaults.offsetZ,
    scaleX: gamedata[`bg_scale_x${suffix}`] ?? defaults.scaleX,
    scaleY: gamedata[`bg_scale_y${suffix}`] ?? defaults.scaleY,
    scaleZ: gamedata[`bg_scale_z${suffix}`] ?? defaults.scaleZ,
    hOfs: gamedata[`bg_view_horizontal_offset${suffix}`] ?? defaults.hOfs,
    vOfs: gamedata[`bg_view_vertical_offset${suffix}`] ?? defaults.vOfs,
  };
}

export function computeCameraParams(gamedata, viewMode) {
  const tableWidth = gamedata?.right || 952;
  const tableHeight = gamedata?.bottom || 2162;
  const viewSetup = getViewSetup(gamedata, viewMode);

  switch (viewMode) {
    case 'desktop':
      return computeDesktopCamera(viewSetup, tableWidth, tableHeight);
    case 'cabinet':
      return computeCabinetCamera(viewSetup, tableWidth, tableHeight);
    case 'vr':
      return computeVRCamera(viewSetup, tableWidth, tableHeight);
    default:
      return computeDesktopCamera(viewSetup, tableWidth, tableHeight);
  }
}

function computeDesktopCamera(setup, tableW, tableH) {
  const centerX = tableW / 2;
  const lookAtY = tableH * (setup.inclination / 100);

  const camX = centerX + setup.offsetX;
  const camY = tableH + setup.offsetY;
  const camZ = setup.offsetZ;

  return {
    position: new THREE.Vector3(camX, -camY, camZ),
    target: new THREE.Vector3(centerX, -lookAtY, 0),
    fov: setup.fov,
  };
}

function computeCabinetCamera(setup, tableW, tableH) {
  const centerX = tableW / 2;
  const lookAtY = tableH * (setup.inclination / 100);

  const camZ = Math.max(tableH * 0.7, setup.offsetZ);

  return {
    position: new THREE.Vector3(centerX, -tableH - 200, camZ),
    target: new THREE.Vector3(centerX, -lookAtY, 0),
    fov: setup.fov,
  };
}

function computeVRCamera(setup, tableW, tableH) {
  const centerX = tableW / 2;
  const eyeHeight = setup.eyeHeight;
  const standBack = setup.standBack;

  return {
    position: new THREE.Vector3(centerX, -(tableH + standBack), eyeHeight),
    target: new THREE.Vector3(centerX, -tableH * 0.4, 0),
    fov: setup.fov,
  };
}
