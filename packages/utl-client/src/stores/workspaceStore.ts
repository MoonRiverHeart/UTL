import { create } from 'zustand';
import api from '../services/api';

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  role?: string;
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
  updateWorkspace: (id: string, name: string) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
  clearWorkspace: () => void;
  loadMindmaps: (workspaceId: string) => Promise<void>;
  selectMindmap: (id: string) => void;
  createMindmap: (workspaceId: string, name: string) => Promise<Mindmap>;
  updateMindmap: (id: string, name: string) => Promise<Mindmap>;
  deleteMindmap: (id: string) => Promise<void>;
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
    set({ currentWorkspace: workspace, currentMindmap: null, mindmaps: [] });
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

  updateWorkspace: async (id: string, name: string) => {
    const response = await api.put(`/workspaces/${id}`, { name });
    const workspace = response.data;
    set((state) => ({
      workspaces: state.workspaces.map((w) => (w.id === id ? workspace : w)),
      currentWorkspace: state.currentWorkspace?.id === id ? workspace : state.currentWorkspace,
    }));
    return workspace;
  },

  deleteWorkspace: async (id: string) => {
    await api.delete(`/workspaces/${id}`);
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== id),
      currentWorkspace: state.currentWorkspace?.id === id ? null : state.currentWorkspace,
      mindmaps: state.currentWorkspace?.id === id ? [] : state.mindmaps,
      currentMindmap: state.currentWorkspace?.id === id ? null : state.currentMindmap,
    }));
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

  updateMindmap: async (id: string, name: string) => {
    const response = await api.put(`/mindmaps/${id}`, { name });
    const mindmap = response.data;
    set((state) => ({
      mindmaps: state.mindmaps.map((m) => (m.id === id ? mindmap : m)),
      currentMindmap: state.currentMindmap?.id === id ? mindmap : state.currentMindmap,
    }));
    return mindmap;
  },

  deleteMindmap: async (id: string) => {
    await api.delete(`/mindmaps/${id}`);
    set((state) => ({
      mindmaps: state.mindmaps.filter((m) => m.id !== id),
      currentMindmap: state.currentMindmap?.id === id ? null : state.currentMindmap,
    }));
  },
}));