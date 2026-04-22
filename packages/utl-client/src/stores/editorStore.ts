import { create } from 'zustand';

interface Node {
  id: string;
  type: string;
  name: string;
  description?: string;
  x: number;
  y: number;
  metadata?: Record<string, unknown>;
}

interface Relation {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
}

interface EditorState {
  mode: 'mindmap' | 'script' | 'split';
  nodes: Node[];
  relations: Relation[];
  selectedNodes: string[];
  zoom: number;
  pan: { x: number; y: number };

  setMode: (mode: 'mindmap' | 'script' | 'split') => void;
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  setRelations: (relations: Relation[] | ((prev: Relation[]) => Relation[])) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, changes: Partial<Node>) => void;
  removeNode: (id: string) => void;
  selectNode: (id: string) => void;
  clearSelection: () => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  mode: 'mindmap',
  nodes: [],
  relations: [],
  selectedNodes: [],
  zoom: 1,
  pan: { x: 0, y: 0 },

  setMode: (mode) => set({ mode }),

  setNodes: (nodes) => set((state) => ({ nodes: typeof nodes === 'function' ? nodes(state.nodes) : nodes })),

  setRelations: (relations) => set((state) => ({ relations: typeof relations === 'function' ? relations(state.relations) : relations })),

  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),

  updateNode: (id, changes) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...changes } : n)),
    })),

  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      selectedNodes: state.selectedNodes.filter((s) => s !== id),
    })),

  selectNode: (id) =>
    set((state) => ({
      selectedNodes: state.selectedNodes.includes(id)
        ? state.selectedNodes.filter((s) => s !== id)
        : [...state.selectedNodes, id],
    })),

  clearSelection: () => set({ selectedNodes: [] }),

  setZoom: (zoom) => set({ zoom }),

  setPan: (pan) => set({ pan }),
}));