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
    const isFolder = hasChildren || (node.children !== undefined);

    const row = document.createElement('div');
    row.className = 'layer-row';
    if (isSelected) row.classList.add('selected');
    if (isFolder) row.classList.add('folder');
    row.dataset.id = node.id;
    row.style.paddingLeft = `${12 + depth * 20}px`;

    // Icon — folders get open/closed folder icon, items get their own icon
    if (isFolder) {
      const folderIcon = document.createElement('span');
      folderIcon.className = `layer-icon-wrap layer-folder-icon${isExpanded ? ' expanded' : ''}`;
      folderIcon.innerHTML = isExpanded ? this.folderOpenIcon() : this.folderClosedIcon();
      row.appendChild(folderIcon);
    } else if (node.icon) {
      const iconSpan = document.createElement('span');
      iconSpan.className = 'layer-icon-wrap';
      iconSpan.innerHTML = node.icon;
      row.appendChild(iconSpan);
    } else {
      // Spacer for items without icons to keep alignment
      const spacer = document.createElement('span');
      spacer.className = 'layer-icon-wrap';
      row.appendChild(spacer);
    }

    // Label
    const label = document.createElement('span');
    label.className = 'layer-label';
    label.textContent = node.label;
    row.appendChild(label);

    // Suffix (item count badge)
    if (node.suffix) {
      const suffix = document.createElement('span');
      suffix.className = 'layer-badge';
      suffix.textContent = node.suffix;
      row.appendChild(suffix);
    }

    // Visibility eye icon
    if (node.checkState !== undefined) {
      const eye = document.createElement('span');
      eye.className = 'layer-eye';
      if (node.checkState === 'unchecked') eye.classList.add('hidden-state');
      if (node.checkState === 'mixed') eye.classList.add('mixed-state');
      eye.innerHTML = this.eyeIcon(node.checkState);
      row.appendChild(eye);

      eye.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        this.options.onToggleCheck(node.id, node);
      });
    }

    // Toggle expand on folder icon click
    if (isFolder) {
      const folderIcon = row.querySelector('.layer-folder-icon');
      folderIcon?.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        this.setExpanded(node.id, !isExpanded);
        this.options.onToggleExpand(node.id, !isExpanded);
      });
    }

    // Select on row click
    row.addEventListener('click', () => {
      this.setSelected(node.id);
      this.options.onSelect(node.id, node);
    });

    // Double-click to expand/collapse folders
    row.addEventListener('dblclick', () => {
      if (isFolder) {
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

    // Render children inline (no wrapper div — flat list feel)
    if (isFolder && isExpanded && node.children) {
      this.renderNodes(node.children, parent, depth + 1);
    }
  }

  private folderClosedIcon(): string {
    return `<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 5C2 4.44772 2.44772 4 3 4H7L8.5 6H15C15.5523 6 16 6.44772 16 7V13C16 13.5523 15.5523 14 15 14H3C2.44772 14 2 13.5523 2 13V5Z" fill="var(--text-tertiary)" opacity="0.6"/>
    </svg>`;
  }

  private folderOpenIcon(): string {
    return `<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 5C2 4.44772 2.44772 4 3 4H7L8.5 6H15C15.5523 6 16 6.44772 16 7V8H4.5L2 13V5Z" fill="var(--accent)" opacity="0.7"/>
      <path d="M2.5 13L4.5 8H16L14 13H2.5Z" fill="var(--accent)" opacity="0.5"/>
    </svg>`;
  }

  private eyeIcon(state: CheckState): string {
    if (state === 'checked') {
      return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="var(--accent)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="8" cy="8" r="2" stroke="var(--accent)" stroke-width="1.2"/>
      </svg>`;
    } else if (state === 'mixed') {
      return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="var(--text-secondary)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="8" cy="8" r="2" stroke="var(--text-secondary)" stroke-width="1.2"/>
      </svg>`;
    }
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="var(--text-tertiary)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
      <line x1="3" y1="3" x2="13" y2="13" stroke="var(--text-tertiary)" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
    </svg>`;
  }
}
