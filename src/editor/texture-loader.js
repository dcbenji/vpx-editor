import * as THREE from 'three';
import { state } from './state.js';
import { VIEW_MODE_3D } from '../shared/constants.js';

let maxTextureSize = 2048;
const builtinTextureCache = new Map();
const LOAD_BATCH_SIZE = 2;

const loadQueue = [];
let isProcessingQueue = false;

export function setMaxTextureSize(size) {
  maxTextureSize = size;
}

export function getMaxTextureSize() {
  return maxTextureSize;
}

export async function loadTexture(imageName) {
  if (!imageName || !state.extractedDir) return null;

  if (state.textureCache.has(imageName)) {
    return state.textureCache.get(imageName);
  }

  if (state.viewMode !== VIEW_MODE_3D) {
    return null;
  }

  return new Promise(resolve => {
    loadQueue.push({ imageName, resolve });
    scheduleProcessQueue();
  });
}

function scheduleProcessQueue() {
  if (isProcessingQueue || loadQueue.length === 0) return;

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => processQueue(), { timeout: 100 });
  } else {
    setTimeout(() => processQueue(), 16);
  }
}

async function processQueue() {
  if (isProcessingQueue || loadQueue.length === 0) return;
  if (state.viewMode !== VIEW_MODE_3D) {
    return;
  }

  isProcessingQueue = true;

  const batch = loadQueue.splice(0, LOAD_BATCH_SIZE);
  await Promise.all(batch.map(({ imageName, resolve }) => loadTextureInternal(imageName).then(resolve)));

  isProcessingQueue = false;

  if (loadQueue.length > 0 && state.viewMode === VIEW_MODE_3D) {
    scheduleProcessQueue();
  }
}

async function loadTextureInternal(imageName) {
  if (state.textureCache.has(imageName)) {
    return state.textureCache.get(imageName);
  }

  const extensions = ['.png', '.jpg', '.jpeg', '.webp', '.bmp'];

  for (const ext of extensions) {
    const imagePath = `${state.extractedDir}/images/${imageName}${ext}`;
    try {
      const result = await window.vpxEditor.readBinaryFile(imagePath);
      if (result.success && result.data) {
        const uint8Array =
          result.data instanceof Uint8Array
            ? result.data
            : Array.isArray(result.data)
              ? new Uint8Array(result.data)
              : new Uint8Array(Object.values(result.data));

        const mimeTypes = {
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.webp': 'image/webp',
          '.bmp': 'image/bmp',
        };

        const blob = new Blob([uint8Array], { type: mimeTypes[ext] });
        const url = URL.createObjectURL(blob);

        try {
          const img = await loadImage(url);
          URL.revokeObjectURL(url);

          const resizedCanvas = resizeImage(img, maxTextureSize);

          const texture = new THREE.CanvasTexture(resizedCanvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.flipY = false;
          texture.generateMipmaps = true;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;

          state.textureCache.set(imageName, texture);
          return texture;
        } catch (e) {
          URL.revokeObjectURL(url);
          continue;
        }
      }
    } catch (e) {
      continue;
    }
  }

  return null;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export function loadBuiltinTexture(textureName) {
  if (builtinTextureCache.has(textureName)) {
    return builtinTextureCache.get(textureName);
  }

  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(`textures/${textureName}`);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.flipY = false;

  builtinTextureCache.set(textureName, texture);
  return texture;
}

function resizeImage(img, maxSize) {
  let { width, height } = img;

  if (maxSize === 0 || (width <= maxSize && height <= maxSize)) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas;
  }

  const scale = maxSize / Math.max(width, height);
  const newWidth = Math.floor(width * scale);
  const newHeight = Math.floor(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, newWidth, newHeight);

  return canvas;
}

export function createMaterialFromVPX(materialName, imageName, defaultColor = 0x888888) {
  const vpxMaterial = state.materials[materialName];

  const matOptions = {
    side: THREE.DoubleSide,
  };

  if (vpxMaterial) {
    if (vpxMaterial.base_color) {
      matOptions.color = vpxMaterial.base_color;
    }

    if (vpxMaterial.roughness !== undefined) {
      matOptions.roughness = vpxMaterial.roughness;
    }

    if (vpxMaterial.opacity_active && vpxMaterial.opacity !== undefined && vpxMaterial.opacity < 1.0) {
      matOptions.transparent = true;
      matOptions.opacity = vpxMaterial.opacity;
    }

    if (vpxMaterial.type_?.toLowerCase() === 'metal') {
      matOptions.metalness = 0.8;
    } else {
      matOptions.metalness = 0.0;
    }
  } else {
    matOptions.color = defaultColor;
    matOptions.roughness = 0.5;
    matOptions.metalness = 0.0;
  }

  const material = new THREE.MeshStandardMaterial(matOptions);

  if (imageName && state.showMaterials) {
    loadTexture(imageName).then(texture => {
      if (texture) {
        material.map = texture;
        material.needsUpdate = true;
      }
    });
  }

  return material;
}
