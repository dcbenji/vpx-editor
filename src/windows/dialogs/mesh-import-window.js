let selectedFile = null;

const pathInput = document.getElementById('mesh-import-path');
const browseBtn = document.getElementById('mesh-import-browse');
const okBtn = document.getElementById('mesh-import-ok');
const cancelBtn = document.getElementById('mesh-import-cancel');

browseBtn.addEventListener('click', async () => {
  const result = await window.vpxEditor.browseObjFile();
  if (result && result.filePath) {
    selectedFile = result.filePath;
    pathInput.value = result.filePath;
    okBtn.disabled = false;
  }
});

okBtn.addEventListener('click', () => {
  if (!selectedFile) return;

  const options = {
    filePath: selectedFile,
    convertCoords: document.getElementById('mesh-import-convert-coords').checked,
    centerMesh: document.getElementById('mesh-import-center-mesh').checked,
    importAnimation: document.getElementById('mesh-import-animation').checked,
    importMaterial: document.getElementById('mesh-import-material').checked,
    noOptimize: document.getElementById('mesh-import-no-optimize').checked,
    absolutePosition: document.getElementById('mesh-import-abs-position').checked,
  };

  window.vpxEditor.meshImportResult(options);
});

cancelBtn.addEventListener('click', () => {
  window.vpxEditor.meshImportResult(null);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    window.vpxEditor.meshImportResult(null);
  } else if (e.key === 'Enter' && !okBtn.disabled) {
    okBtn.click();
  }
});
