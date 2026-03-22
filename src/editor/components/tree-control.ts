import { addLongPressContextMenu } from '../../shared/long-press.js';

type CheckState = 'checked' | 'mixed' | 'unchecked' | undefined;

export interface TreeNode {
  id: string;
  label: string;
  icon?: string;
  suffix?: string;
  checkState?: CheckState;
  children?: TreeNode[];
}

export interface TreeControlOptions {
  onSelect?: (id: string, node: TreeNode) => void;
  onToggleExpand?: (id: string, expanded: boolean) => void;
  onToggleCheck?: (id: string, node: TreeNode) => void;
  onContextMenu?: (e: MouseEvent, id: string, node: TreeNode) => void;
  onDragStart?: ((e: DragEvent, id: string, node: TreeNode) => void) | null;
  onDrop?: ((e: DragEvent, id: string, node: TreeNode) => void) | null;
}

export class TreeControl {
  private container: HTMLElement;
  private options: Required<TreeControlOptions>;
  public selectedId: string | null = null;
  public expandedIds: Set<string> = new Set();
  public nodes: TreeNode[] = [];

  constructor(container: HTMLElement, options: TreeControlOptions = {}) {
    this.container = container;
    this.options = {
      onSelect: options.onSelect || (() => {}),
      onToggleExpand: options.onToggleExpand || (() => {}),
      onToggleCheck: options.onToggleCheck || (() => {}),
      onContextMenu: options.onContextMenu || (() => {}),
      onDragStart: options.onDragStart || null,
      onDrop: options.onDrop || null,
    };
  }

  setData(nodes: TreeNode[]): void {
    this.nodes = nodes;
    this.render();
  }

  setExpanded(id: string, expanded: boolean): void {
    if (expanded) {
      this.expandedIds.add(id);
    } else {
      this.expandedIds.delete(id);
    }
    this.render();
  }

  setSelected(id: string | null): void {
    this.selectedId = id;
    this.render();
  }

  expandAll(): void {
    const addAll = (nodes: TreeNode[]): void => {
      for (const node of nodes) {
        if (node.children?.length && node.children.length > 0) {
          this.expandedIds.add(node.id);
          addAll(node.children);
        }
      }
    };
    addAll(this.nodes);
    this.render();
  }

  collapseAll(): void {
    this.expandedIds.clear();
    this.render();
  }

  render(): void {
    this.container.innerHTML = '';
    this.renderNodes(this.nodes, this.container, 0);
  }

  private renderNodes(nodes: TreeNode[], parent: HTMLElement, depth: number): void {
    nodes.forEach((node) => {
      this.renderNode(node, parent, depth);
    });
  }

  private renderNode(node: TreeNode, parent: HTMLElement, depth: number): void {
    const isExpanded = this.expandedIds.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = this.selectedId === node.id;

    const row = document.createElement('div');
    row.className = `tree-row${isSelected ? ' selected' : ''}`;
    row.dataset.id = node.id;
    // Indentation via padding
    row.style.paddingLeft = `${12 + depth * 16}px`;

    let html = '';

    // Toggle chevron (for nodes with children)
    html += `<span class="tree-branch">`;
    if (hasChildren) {
      html += `<span class="tree-toggle">${this.chevronIcon(isExpanded)}</span>`;
    } else {
      html += `<span class="tree-toggle-spacer"></span>`;
    }
    html += `</span>`;

    // Icon
    if (node.icon) {
      html += `<span class="tree-icon">${node.icon}</span>`;
    }

    // Label
    html += `<span class="tree-label">${node.label}</span>`;

    // Suffix
    if (node.suffix) {
      html += `<span class="tree-suffix">${node.suffix}</span>`;
    }

    // Visibility eye icon (replaces checkbox)
    if (node.checkState !== undefined) {
      const visClass = node.checkState === 'unchecked' ? ' visibility-off' : node.checkState === 'mixed' ? ' visibility-mixed' : '';
      html += `<span class="tree-checkbox${visClass}">${this.eyeIcon(node.checkState)}</span>`;
    }

    row.innerHTML = html;

    // Toggle expand
    if (hasChildren) {
      row.querySelector('.tree-toggle')?.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        this.setExpanded(node.id, !isExpanded);
        this.options.onToggleExpand(node.id, !isExpanded);
      });
    }

    // Visibility toggle
    if (node.checkState !== undefined) {
      row.querySelector('.tree-checkbox')?.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        this.options.onToggleCheck(node.id, node);
      });
    }

    // Select
    row.addEventListener('click', () => {
      this.setSelected(node.id);
      this.options.onSelect(node.id, node);
    });

    // Double-click to expand/collapse
    row.addEventListener('dblclick', () => {
      if (hasChildren) {
        this.setExpanded(node.id, !isExpanded);
        this.options.onToggleExpand(node.id, !isExpanded);
      }
    });

    // Context menu
    addLongPressContextMenu(row);
    row.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      this.setSelected(node.id);
      this.options.onContextMenu(e, node.id, node);
    });

    // Drag & drop
    if (this.options.onDragStart) {
      row.draggable = true;
      row.addEventListener('dragstart', (e: DragEvent) => {
        this.options.onDragStart!(e, node.id, node);
      });
    }

    if (this.options.onDrop) {
      row.addEventListener('dragover', (e: DragEvent) => {
        e.preventDefault();
        row.classList.add('drag-over');
      });
      row.addEventListener('dragleave', () => {
        row.classList.remove('drag-over');
      });
      row.addEventListener('drop', (e: DragEvent) => {
        e.preventDefault();
        row.classList.remove('drag-over');
        this.options.onDrop!(e, node.id, node);
      });
    }

    parent.appendChild(row);

    // Render children
    if (hasChildren && isExpanded) {
      const childContainer = document.createElement('div');
      childContainer.className = 'tree-children';
      parent.appendChild(childContainer);

      this.renderNodes(node.children!, childContainer, depth + 1);
    }
  }

  private chevronIcon(expanded: boolean): string {
    const rotation = expanded ? 'rotate(90deg)' : 'rotate(0deg)';
    return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="transform: ${rotation}; transition: transform 150ms ease;">
      <path d="M5 3L9 7L5 11" stroke="var(--text-secondary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  private eyeIcon(state: CheckState): string {
    if (state === 'checked') {
      // Visible — solid eye
      return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="var(--accent)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="8" cy="8" r="2" stroke="var(--accent)" stroke-width="1.2"/>
      </svg>`;
    } else if (state === 'mixed') {
      // Mixed — half eye
      return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="var(--text-secondary)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="8" cy="8" r="2" stroke="var(--text-secondary)" stroke-width="1.2"/>
      </svg>`;
    }
    // Unchecked — eye with slash (hidden)
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="var(--text-secondary)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
      <line x1="3" y1="3" x2="13" y2="13" stroke="var(--text-secondary)" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
    </svg>`;
  }
}
