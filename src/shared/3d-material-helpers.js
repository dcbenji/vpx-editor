import * as THREE from 'three';
import { state } from '../editor/state.js';
import { createMaterialFromVPX, loadBuiltinTexture } from '../editor/texture-loader.js';
import { DEFAULT_MATERIAL_COLOR } from './constants.js';

function getDefaultMaterialColor() {
  return state.editorColors?.defaultMaterial || DEFAULT_MATERIAL_COLOR;
}

export function createMaterial(materialName, imageName, fallbackColor) {
  const color = fallbackColor ?? getDefaultMaterialColor();
  if (state.showMaterials) {
    return createMaterialFromVPX(materialName, imageName, color);
  }
  return new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
  });
}

export function createMaterialWithTexture(materialName, imageName, builtinTexture, fallbackColor) {
  const color = fallbackColor ?? getDefaultMaterialColor();
  if (state.showMaterials) {
    const mat = createMaterialFromVPX(materialName, imageName, color);
    if (builtinTexture && !imageName) {
      mat.map = loadBuiltinTexture(builtinTexture);
      mat.needsUpdate = true;
    }
    return mat;
  }
  return new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
  });
}

export function addMesh(group, geometry, material) {
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);
  return mesh;
}

export function createMeshWithMaterial(geometry, materialName, imageName, fallbackColor) {
  const material = createMaterial(materialName, imageName, fallbackColor);
  return new THREE.Mesh(geometry, material);
}
