import { state, elements } from './state.js';
import * as monaco from 'monaco-editor';

let editor = null;
let originalContent = '';

self.MonacoEnvironment = {
  getWorkerUrl: function (moduleId, label) {
    if (label === 'typescript' || label === 'javascript') {
      return './ts.worker.bundle.js';
    }
    return './editor.worker.bundle.js';
  },
};

export async function openScriptEditor() {
  const modal = document.getElementById('script-editor-modal');
  const container = document.getElementById('script-editor-container');

  if (!state.extractedDir) {
    elements.statusBar.textContent = 'No table loaded';
    return;
  }

  const scriptPath = `${state.extractedDir}/script.vbs`;
  const result = await window.vpxEditor.readFile(scriptPath);

  if (!result.success) {
    elements.statusBar.textContent = 'Failed to load script.vbs';
    return;
  }

  originalContent = result.content;
  state.scriptEditorOpen = true;
  state.scriptModified = false;
  modal.classList.remove('hidden');

  container.innerHTML = '';

  editor = monaco.editor.create(container, {
    value: originalContent,
    language: 'vb',
    theme: 'vs-dark',
    automaticLayout: true,
    fontSize: 14,
    fontFamily: "'Consolas', 'Monaco', 'Menlo', monospace",
    lineNumbers: 'on',
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    wordWrap: 'off',
    tabSize: 4,
    insertSpaces: false,
    renderWhitespace: 'selection',
    bracketPairColorization: { enabled: true },
  });

  editor.onDidChangeModelContent(() => {
    const modified = editor.getValue() !== originalContent;
    if (state.scriptModified !== modified) {
      state.scriptModified = modified;
      updateScriptTitle();
    }
  });

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    saveScript();
  });

  updateScriptTitle();
}

export async function saveScript() {
  if (!editor) return;

  const content = editor.getValue();
  const scriptPath = `${state.extractedDir}/script.vbs`;

  const result = await window.vpxEditor.writeFile(scriptPath, content);

  if (result.success) {
    originalContent = content;
    state.scriptModified = false;
    updateScriptTitle();
    elements.statusBar.textContent = 'Script saved';
  } else {
    elements.statusBar.textContent = 'Failed to save script';
  }
}

export async function closeScriptEditor() {
  if (state.scriptModified) {
    const discard = await window.scriptEditor.showUnsavedChangesDialog();
    if (!discard) {
      return;
    }
  }

  if (editor) {
    editor.dispose();
    editor = null;
  }

  state.scriptEditorOpen = false;
  state.scriptModified = false;
  document.getElementById('script-editor-modal').classList.add('hidden');
}

function updateScriptTitle() {
  const title = document.querySelector('#script-editor-modal .modal-title');
  if (title) {
    title.textContent = `Script Editor - script.vbs${state.scriptModified ? ' *' : ''}`;
  }
}

export function initScriptEditor() {
  const saveBtn = document.getElementById('script-save');
  const closeBtn = document.getElementById('script-close');

  if (saveBtn) {
    saveBtn.addEventListener('click', saveScript);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeScriptEditor);
  }

  document.addEventListener('keydown', e => {
    if (state.scriptEditorOpen && e.key === 'Escape') {
      closeScriptEditor();
    }
  });
}
