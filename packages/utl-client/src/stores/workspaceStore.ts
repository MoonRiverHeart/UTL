import { create } from 'zustand';
import api from '../services/api';

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface Mindmap {
  id: string;
  name: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  mindmaps: Mindmap[];
  currentMindmap: Mindmap | null;
  loading: boolean;

  loadWorkspaces: () => Promise<void>;
  selectWorkspace: (id: string) => void;
  createWorkspace: (name: string) => Promise<Workspace>;
  clearWorkspace: () => void;
  loadMindmaps: (workspaceId: string) => Promise<void>;
  selectMindmap: (id: string) => void;
  createMindmap: (workspaceId: string, name: string) => Promise<Mindmap>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  mindmaps: [],
  currentMindmap: null,
  loading: false,

  loadWorkspaces: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/workspaces');
      set({ workspaces: response.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  selectWorkspace: (id: string) => {
    const workspace = get().workspaces.find((w) => w.id === id);
    set({ currentWorkspace: workspace });
    if (workspace) {
      get().loadMindmaps(workspace.id);
    }
  },

  createWorkspace: async (name: string) => {
    const response = await api.post('/workspaces', { name });
    const workspace = response.data;
    set((state) => ({ workspaces: [...state.workspaces, workspace] }));
    return workspace;
  },

  clearWorkspace: () => {
    set({ workspaces: [], currentWorkspace: null, mindmaps: [], currentMindmap: null });
  },

  loadMindmaps: async (workspaceId: string) => {
    set({ loading: true });
    try {
      const response = await api.get(`/mindmaps/workspace/${workspaceId}`);
      set({ mindmaps: response.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  selectMindmap: (id: string) => {
    const mindmap = get().mindmaps.find((m) => m.id === id);
    set({ currentMindmap: mindmap });
  },

  createMindmap: async (workspaceId: string, name: string) => {
    const response = await api.post(`/mindmaps/workspace/${workspaceId}`, { name });
    const mindmap = response.data;
    set((state) => ({ mindmaps: [...state.mindmaps, mindmap] }));
    return mindmap;
  },
}));