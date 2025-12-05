import { setupThemeListener, setupKeyboardShortcuts } from '../../shared/window-utils.js';

let transformType = null;
let storedData = null;

setupThemeListener();

const rotatePanel = document.getElementById('rotate-panel');
const scalePanel = document.getElementById('scale-panel');
const translatePanel = document.getElementById('translate-panel');

const rotateAngle = document.getElementById('rotate-angle');
const rotateUseOrigin = document.getElementById('rotate-use-origin');
const rotateCenterX = document.getElementById('rotate-center-x');
const rotateCenterY = document.getElementById('rotate-center-y');

const scaleX = document.getElementById('scale-x');
const scaleY = document.getElementById('scale-y');
const scaleSquare = document.getElementById('scale-square');
const scaleUseOrigin = document.getElementById('scale-use-origin');
const scaleCenterX = document.getElementById('scale-center-x');
const scaleCenterY = document.getElementById('scale-center-y');

const translateX = document.getElementById('translate-x');
const translateY = document.getElementById('translate-y');

const btnApply = document.getElementById('btn-apply');
const btnUndo = document.getElementById('btn-undo');
const btnOk = document.getElementById('btn-ok');
const btnCancel = document.getElementById('btn-cancel');

function showPanel(type) {
  transformType = type;
  rotatePanel.classList.toggle('hidden', type !== 'rotate');
  scalePanel.classList.toggle('hidden', type !== 'scale');
  translatePanel.classList.toggle('hidden', type !== 'translate');
}

function getTransformData() {
  if (transformType === 'rotate') {
    return {
      type: 'rotate',
      angle: parseFloat(rotateAngle.value) || 0,
      useOrigin: rotateUseOrigin.checked,
      centerX: parseFloat(rotateCenterX.value) || 0,
      centerY: parseFloat(rotateCenterY.value) || 0,
    };
  } else if (transformType === 'scale') {
    return {
      type: 'scale',
      scaleX: parseFloat(scaleX.value) || 1,
      scaleY: parseFloat(scaleY.value) || 1,
      useOrigin: scaleUseOrigin.checked,
      centerX: parseFloat(scaleCenterX.value) || 0,
      centerY: parseFloat(scaleCenterY.value) || 0,
    };
  } else if (transformType === 'translate') {
    return {
      type: 'translate',
      offsetX: parseFloat(translateX.value) || 0,
      offsetY: parseFloat(translateY.value) || 0,
    };
  }
  return null;
}

function resetValues() {
  if (transformType === 'rotate') {
    rotateAngle.value = '0.0';
  } else if (transformType === 'scale') {
    scaleX.value = '1.0';
    scaleY.value = '1.0';
  } else if (transformType === 'translate') {
    translateX.value = '0.0';
    translateY.value = '0.0';
  }
}

scaleSquare.addEventListener('change', () => {
  if (scaleSquare.checked) {
    scaleY.value = scaleX.value;
    scaleY.disabled = true;
  } else {
    scaleY.disabled = false;
  }
});

scaleX.addEventListener('input', () => {
  if (scaleSquare.checked) {
    scaleY.value = scaleX.value;
  }
});

rotateUseOrigin.addEventListener('change', () => {
  if (!storedData) return;
  if (rotateUseOrigin.checked) {
    rotateCenterX.value = storedData.centerX?.toFixed(2) || '0';
    rotateCenterY.value = storedData.centerY?.toFixed(2) || '0';
  } else {
    rotateCenterX.value = storedData.mouseX?.toFixed(2) || '0';
    rotateCenterY.value = storedData.mouseY?.toFixed(2) || '0';
  }
});

scaleUseOrigin.addEventListener('change', () => {
  if (!storedData) return;
  if (scaleUseOrigin.checked) {
    scaleCenterX.value = storedData.centerX?.toFixed(2) || '0';
    scaleCenterY.value = storedData.centerY?.toFixed(2) || '0';
  } else {
    scaleCenterX.value = storedData.mouseX?.toFixed(2) || '0';
    scaleCenterY.value = storedData.mouseY?.toFixed(2) || '0';
  }
});

btnApply.addEventListener('click', () => {
  window.vpxEditor.applyTransform(getTransformData());
});

btnUndo.addEventListener('click', () => {
  window.vpxEditor.undoTransform();
  resetValues();
});

btnOk.addEventListener('click', () => {
  window.vpxEditor.saveTransform(getTransformData());
  window.close();
});

btnCancel.addEventListener('click', () => {
  window.vpxEditor.cancelTransform();
  window.close();
});

setupKeyboardShortcuts({
  onEscape: () => {
    window.vpxEditor.cancelTransform();
    window.close();
  },
  onEnter: () => {
    window.vpxEditor.saveTransform(getTransformData());
    window.close();
  },
});

window.vpxEditor.onInitTransform?.(data => {
  storedData = data;
  showPanel(data.type);
  document.title = data.type.charAt(0).toUpperCase() + data.type.slice(1);

  if (data.type === 'rotate') {
    rotateAngle.value = '0.0';
    rotateUseOrigin.checked = true;
    rotateCenterX.value = data.centerX?.toFixed(2) || '0';
    rotateCenterY.value = data.centerY?.toFixed(2) || '0';
    rotateAngle.focus();
    rotateAngle.select();
  } else if (data.type === 'scale') {
    scaleX.value = '1.0';
    scaleY.value = '1.0';
    scaleSquare.checked = true;
    scaleY.disabled = true;
    scaleUseOrigin.checked = true;
    scaleCenterX.value = data.centerX?.toFixed(2) || '0';
    scaleCenterY.value = data.centerY?.toFixed(2) || '0';
    scaleX.focus();
    scaleX.select();
  } else if (data.type === 'translate') {
    translateX.value = '0.0';
    translateY.value = '0.0';
    translateX.focus();
    translateX.select();
  }
});
