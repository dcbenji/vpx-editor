import { showConsoleContextMenu } from './context-menu.js';
import { resizeCanvas } from './view-manager.js';

const consoleOutput = document.getElementById('console-output');
const consoleResizeHandle = document.getElementById('console-resize-handle');
const consolePanel = document.getElementById('console-panel');
let consolePinned = false;
let consoleResizing = false;
let consoleStartY = 0;
let consoleStartHeight = 0;

function formatTimestamp() {
  const now = new Date();
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;
}

function clearConsole() {
  consoleOutput.innerHTML = '';
}

function showConsole() {
  consolePanel.classList.remove('hidden');
  consoleResizeHandle.classList.remove('hidden');
  window.vpxEditor.saveConsoleSettings({ visible: true });
  setTimeout(resizeCanvas, 0);
}

function hideConsole() {
  consolePanel.classList.add('hidden');
  consoleResizeHandle.classList.add('hidden');
  window.vpxEditor.saveConsoleSettings({ visible: false });
  setTimeout(resizeCanvas, 0);
}

function appendConsoleLine(text, type = 'stdout') {
  if (!consoleOutput) return;
  const lines = text.split('\n');
  const addTimestamp = type === 'info' || type === 'command' || type === 'success' || type === 'error';
  const timestamp = addTimestamp ? formatTimestamp() : null;
  for (const lineText of lines) {
    if (lineText === '' && (type === 'stdout' || type === 'stderr')) continue;
    const line = document.createElement('div');
    line.className = `line ${type}`;
    line.textContent = timestamp ? `${timestamp}: ${lineText || ' '}` : lineText;
    consoleOutput.appendChild(line);
  }
  if (!consolePinned) {
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }
}

document.getElementById('console-pin')?.addEventListener('click', () => {
  consolePinned = !consolePinned;
  document.getElementById('console-pin')?.classList.toggle('active', consolePinned);
  if (!consolePinned) {
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }
});

document.getElementById('console-clear')?.addEventListener('click', () => {
  clearConsole();
});

document.getElementById('console-close')?.addEventListener('click', () => {
  hideConsole();
});

consoleOutput?.addEventListener('contextmenu', e => {
  e.preventDefault();
  showConsoleContextMenu(e.clientX, e.clientY, {
    onCopy: () => {
      const selectedText = window.getSelection().toString();
      if (selectedText) {
        navigator.clipboard.writeText(selectedText);
      }
    },
    onSelectAll: () => {
      const range = document.createRange();
      range.selectNodeContents(consoleOutput);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    },
    onClear: () => {
      clearConsole();
    },
  });
});

consoleResizeHandle?.addEventListener('mousedown', e => {
  consoleResizing = true;
  consoleStartY = e.clientY;
  consoleStartHeight = consolePanel.offsetHeight;
  document.body.style.cursor = 'ns-resize';
  e.preventDefault();
});

document.addEventListener('mousemove', e => {
  if (!consoleResizing) return;
  const delta = consoleStartY - e.clientY;
  const newHeight = Math.max(100, Math.min(window.innerHeight * 0.5, consoleStartHeight + delta));
  consolePanel.style.height = `${newHeight}px`;
  resizeCanvas();
});

document.addEventListener('mouseup', () => {
  if (consoleResizing) {
    consoleResizing = false;
    document.body.style.cursor = '';
    window.vpxEditor.saveConsoleSettings({ height: consolePanel.offsetHeight });
  }
});

window.vpxEditor.onConsoleOpen(() => {
  showConsole();
});

window.vpxEditor.onConsoleOutput(data => {
  appendConsoleLine(data.text, data.type);
});

window.vpxEditor.onToggleConsole(() => {
  if (consolePanel.classList.contains('hidden')) {
    showConsole();
  } else {
    hideConsole();
  }
});

async function initConsole() {
  const settings = await window.vpxEditor.getConsoleSettings();
  if (settings) {
    if (settings.height) {
      consolePanel.style.height = `${settings.height}px`;
    }
    if (settings.visible === false) {
      consolePanel.classList.add('hidden');
      consoleResizeHandle.classList.add('hidden');
    }
  }

  const version = await window.vpxEditor.getVersion();
  appendConsoleLine(`VPX Editor ${version}`, 'info');
}

export { clearConsole, showConsole, hideConsole, appendConsoleLine, initConsole, consoleOutput };
