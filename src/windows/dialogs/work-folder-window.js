import { setupThemeListener, setupKeyboardShortcuts } from '../../shared/window-utils.js';

let config = {};

setupThemeListener();

window.vpxEditor.onInitWorkFolder?.(data => {
  config = data;

  const title = document.getElementById('wf-title');
  const message = document.getElementById('wf-message');
  const footer = document.getElementById('wf-footer');

  message.textContent = data.message || '';
  footer.innerHTML = '';

  if (data.type === 'resume') {
    title.textContent = 'Previous Session Found';

    const extractBtn = document.createElement('button');
    extractBtn.className = 'win-btn';
    extractBtn.textContent = 'Re-extract';
    extractBtn.addEventListener('click', () => {
      window.vpxEditor.workFolderResult('extract');
    });

    const resumeBtn = document.createElement('button');
    resumeBtn.className = 'win-btn primary';
    resumeBtn.textContent = 'Resume';
    resumeBtn.addEventListener('click', () => {
      window.vpxEditor.workFolderResult('resume');
    });

    footer.appendChild(extractBtn);
    footer.appendChild(resumeBtn);
  } else {
    title.textContent = 'Work Folder Exists';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'win-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
      window.vpxEditor.workFolderResult('cancel');
    });

    const extractBtn = document.createElement('button');
    extractBtn.className = 'win-btn';
    extractBtn.textContent = 'Re-extract';
    extractBtn.addEventListener('click', () => {
      window.vpxEditor.workFolderResult('extract');
    });

    const resumeBtn = document.createElement('button');
    resumeBtn.className = 'win-btn primary';
    resumeBtn.textContent = 'Use Work Folder';
    resumeBtn.addEventListener('click', () => {
      window.vpxEditor.workFolderResult('resume');
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(extractBtn);
    footer.appendChild(resumeBtn);
  }
});

setupKeyboardShortcuts({
  onEscape: () => {
    if (config.type === 'resume') {
      window.vpxEditor.workFolderResult('extract');
    } else {
      window.vpxEditor.workFolderResult('cancel');
    }
  },
});
