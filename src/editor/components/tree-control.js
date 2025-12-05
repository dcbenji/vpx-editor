export class TreeControl {
  constructor(container, options = {}) {
    this.cellSize = 18;
    this.rowHeight = 18;
    this.toggleSize = 13;
    this.container = container;
    this.options = {
      onSelect: options.onSelect || (() => {}),
      onToggleExpand: options.onToggleExpand || (() => {}),
      onToggleCheck: options.onToggleCheck || (() => {}),
      onContextMenu: options.onContextMenu || (() => {}),
      onDragStart: options.onDragStart || null,
      onDrop: options.onDrop || null,
    };
    this.selectedId = null;
    this.expandedIds = new Set();
    this.nodes = [];
  }

  setData(nodes) {
    this.nodes = nodes;
    this.render();
  }

  setExpanded(id, expanded) {
    if (expanded) {
      this.expandedIds.add(id);
    } else {
      this.expandedIds.delete(id);
    }
    this.render();
  }

  setSelected(id) {
    this.selectedId = id;
    this.render();
  }

  expandAll() {
    const addAll = nodes => {
      for (const node of nodes) {
        if (node.children?.length > 0) {
          this.expandedIds.add(node.id);
          addAll(node.children);
        }
      }
    };
    addAll(this.nodes);
    this.render();
  }

  collapseAll() {
    this.expandedIds.clear();
    this.render();
  }

  render() {
    this.container.innerHTML = '';
    this.renderNodes(this.nodes, this.container, []);
  }

  renderNodes(nodes, parent, ancestorLast) {
    nodes.forEach((node, index) => {
      const isLast = index === nodes.length - 1;
      this.renderNode(node, parent, ancestorLast, isLast);
    });
  }

  renderNode(node, parent, ancestorLast, isLast) {
    const isExpanded = this.expandedIds.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = this.selectedId === node.id;
    const depth = ancestorLast.length;

    const row = document.createElement('div');
    row.className = `tree-row${isSelected ? ' selected' : ''}`;
    row.dataset.id = node.id;

    let html = '';

    for (let i = 0; i < depth; i++) {
      const isAncestorLast = ancestorLast[i];
      html += `<span class="tree-indent">${isAncestorLast ? '' : this.verticalLine()}</span>`;
    }

    const showConnector = depth > 0;
    html += `<span class="tree-branch">`;
    if (showConnector) {
      html += `<span class="tree-branch-lines">${this.branchConnector(isLast)}</span>`;
    }
    if (hasChildren) {
      html += `<span class="tree-toggle">${this.toggleIcon(isExpanded)}</span>`;
    } else {
      html += `<span class="tree-toggle-spacer"></span>`;
    }
    if (node.checkState !== undefined) {
      html += `<span class="tree-checkbox">${this.checkboxIcon(node.checkState)}</span>`;
    } else {
      html += `<span class="tree-checkbox-spacer"></span>`;
    }
    html += `</span>`;

    if (node.icon) {
      html += `<span class="tree-icon">${node.icon}</span>`;
    }

    html += `<span class="tree-label">${node.label}</span>`;

    if (node.suffix) {
      html += `<span class="tree-suffix">${node.suffix}</span>`;
    }

    row.innerHTML = html;

    if (hasChildren) {
      row.querySelector('.tree-toggle').addEventListener('click', e => {
        e.stopPropagation();
        this.setExpanded(node.id, !isExpanded);
        this.options.onToggleExpand(node.id, !isExpanded);
      });
    }

    if (node.checkState !== undefined) {
      row.querySelector('.tree-checkbox').addEventListener('click', e => {
        e.stopPropagation();
        this.options.onToggleCheck(node.id, node);
      });
    }

    row.addEventListener('click', () => {
      this.setSelected(node.id);
      this.options.onSelect(node.id, node);
    });

    row.addEventListener('dblclick', () => {
      if (hasChildren) {
        this.setExpanded(node.id, !isExpanded);
        this.options.onToggleExpand(node.id, !isExpanded);
      }
    });

    row.addEventListener('contextmenu', e => {
      e.preventDefault();
      this.setSelected(node.id);
      this.options.onContextMenu(e, node.id, node);
    });

    if (this.options.onDragStart) {
      row.draggable = true;
      row.addEventListener('dragstart', e => {
        this.options.onDragStart(e, node.id, node);
      });
    }

    if (this.options.onDrop) {
      row.addEventListener('dragover', e => {
        e.preventDefault();
        row.classList.add('drag-over');
      });
      row.addEventListener('dragleave', () => {
        row.classList.remove('drag-over');
      });
      row.addEventListener('drop', e => {
        e.preventDefault();
        row.classList.remove('drag-over');
        this.options.onDrop(e, node.id, node);
      });
    }

    parent.appendChild(row);

    if (hasChildren && isExpanded) {
      const childContainer = document.createElement('div');
      childContainer.className = 'tree-children';
      parent.appendChild(childContainer);

      this.renderNodes(node.children, childContainer, [...ancestorLast, isLast]);
    }
  }

  verticalLine() {
    const width = this.cellSize;
    const lineX = this.cellSize / 2;
    return `<svg width="${width}" height="${this.rowHeight}" viewBox="0 0 ${width} ${this.rowHeight}">
      <line x1="${lineX}" y1="0" x2="${lineX}" y2="${this.rowHeight}" stroke="var(--text-secondary)" stroke-width="1" stroke-dasharray="1,2"/>
    </svg>`;
  }

  connectorLine(isLast) {
    const midY = this.rowHeight / 2;
    const y2 = isLast ? midY : this.rowHeight;
    const lineX = this.cellSize / 2;
    return `<svg width="${this.cellSize}" height="${this.rowHeight}" viewBox="0 0 ${this.cellSize} ${this.rowHeight}">
      <line x1="${lineX}" y1="0" x2="${lineX}" y2="${y2}" stroke="var(--text-secondary)" stroke-width="1" stroke-dasharray="1,2"/>
      <line x1="${lineX}" y1="${midY}" x2="${this.cellSize}" y2="${midY}" stroke="var(--text-secondary)" stroke-width="1" stroke-dasharray="1,2"/>
    </svg>`;
  }

  branchConnector(isLast) {
    const midY = this.rowHeight / 2;
    const y2 = isLast ? midY : this.rowHeight;
    const width = this.cellSize * 2;
    const lineX = this.cellSize / 2;
    const lineEndX = this.cellSize + 3;
    return `<svg width="${width}" height="${this.rowHeight}" viewBox="0 0 ${width} ${this.rowHeight}">
      <line x1="${lineX}" y1="0" x2="${lineX}" y2="${y2}" stroke="var(--text-secondary)" stroke-width="1" stroke-dasharray="1,2"/>
      <line x1="${lineX}" y1="${midY}" x2="${lineEndX}" y2="${midY}" stroke="var(--text-secondary)" stroke-width="1" stroke-dasharray="1,2"/>
    </svg>`;
  }

  toggleIcon(expanded) {
    const container = this.toggleSize;
    const box = 9;
    const offset = (container - box) / 2;
    const mid = container / 2;
    return `<svg width="${container}" height="${container}" viewBox="0 0 ${container} ${container}">
      <rect x="${offset}" y="${offset}" width="${box}" height="${box}" fill="var(--bg-panel)" stroke="var(--text-secondary)" stroke-width="1"/>
      <line x1="${offset + 2}" y1="${mid}" x2="${offset + box - 2}" y2="${mid}" stroke="var(--text-primary)" stroke-width="1"/>
      ${expanded ? '' : `<line x1="${mid}" y1="${offset + 2}" x2="${mid}" y2="${offset + box - 2}" stroke="var(--text-primary)" stroke-width="1"/>`}
    </svg>`;
  }

  checkboxIcon(state) {
    if (state === 'checked') {
      return `<svg width="13" height="13" viewBox="0 0 13 13">
        <rect x="0.5" y="0.5" width="12" height="12" fill="var(--bg-panel)" stroke="var(--text-secondary)" stroke-width="1"/>
        <path d="M3 6.5l2 2 4-4" fill="none" stroke="var(--text-primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    } else if (state === 'mixed') {
      return `<svg width="13" height="13" viewBox="0 0 13 13">
        <rect x="0.5" y="0.5" width="12" height="12" fill="var(--bg-panel)" stroke="var(--text-secondary)" stroke-width="1"/>
        <rect x="3" y="3" width="7" height="7" fill="var(--text-primary)"/>
      </svg>`;
    }
    return `<svg width="13" height="13" viewBox="0 0 13 13">
      <rect x="0.5" y="0.5" width="12" height="12" fill="var(--bg-panel)" stroke="var(--text-secondary)" stroke-width="1"/>
    </svg>`;
  }
}
