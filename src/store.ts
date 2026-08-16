import { useSyncExternalStore } from 'react';
import type { DesignDocument, DesignElement, CanvasSize } from './types';
import { uid } from './types';

const STORAGE_KEY = 'luma:projects';
const CURRENT_KEY = 'luma:current';

export interface EditorState {
  document: DesignDocument;
  selectedIds: string[];
  history: DesignDocument[];
  future: DesignDocument[];
  zoom: number;
  panX: number;
  panY: number;
}

function createBlankDocument(): DesignDocument {
  return {
    id: uid(),
    name: 'Untitled Design',
    canvas: { width: 1080, height: 1080, name: 'Instagram Post' },
    elements: [],
    background: '#ffffff',
    backgroundGradient: null,
  };
}

function loadInitial(): EditorState {
  try {
    const currentId = localStorage.getItem(CURRENT_KEY);
    if (currentId) {
      const raw = localStorage.getItem(`${STORAGE_KEY}:${currentId}`);
      if (raw) {
        const doc = JSON.parse(raw) as DesignDocument;
        return {
          document: doc,
          selectedIds: [],
          history: [],
          future: [],
          zoom: 0.5,
          panX: 0,
          panY: 0,
        };
      }
    }
  } catch {
    // ignore
  }
  return {
    document: createBlankDocument(),
    selectedIds: [],
    history: [],
    future: [],
    zoom: 0.5,
    panX: 0,
    panY: 0,
  };
}

let state: EditorState = loadInitial();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): EditorState {
  return state;
}

function setState(updater: (s: EditorState) => EditorState) {
  state = updater(state);
  emit();
}

function clone<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc));
}

function pushHistory(doc: DesignDocument) {
  setState((s) => ({
    ...s,
    history: [...s.history.slice(-49), clone(s.document)],
    future: [],
    document: doc,
  }));
}

export const store = {
  getState: () => state,
  subscribe,
  setDocument(doc: DesignDocument, recordHistory = true) {
    if (recordHistory) {
      pushHistory(doc);
    } else {
      setState((s) => ({ ...s, document: doc }));
    }
    scheduleAutoSave();
  },
  updateDocument(updater: (doc: DesignDocument) => DesignDocument, recordHistory = true) {
    const newDoc = updater(clone(state.document));
    if (recordHistory) {
      pushHistory(newDoc);
    } else {
      setState((s) => ({ ...s, document: newDoc }));
    }
    scheduleAutoSave();
  },
  select(ids: string[]) {
    setState((s) => ({ ...s, selectedIds: ids }));
  },
  toggleSelect(id: string) {
    setState((s) => ({
      ...s,
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((i) => i !== id)
        : [...s.selectedIds, id],
    }));
  },
  setZoom(zoom: number) {
    setState((s) => ({ ...s, zoom: Math.max(0.05, Math.min(4, zoom)) }));
  },
  setPan(x: number, y: number) {
    setState((s) => ({ ...s, panX: x, panY: y }));
  },
  undo() {
    if (state.history.length === 0) return;
    const prev = state.history[state.history.length - 1];
    setState((s) => ({
      ...s,
      document: prev,
      history: s.history.slice(0, -1),
      future: [clone(s.document), ...s.future].slice(0, 50),
    }));
    scheduleAutoSave();
  },
  redo() {
    if (state.future.length === 0) return;
    const next = state.future[0];
    setState((s) => ({
      ...s,
      document: next,
      future: s.future.slice(1),
      history: [...s.history, clone(s.document)].slice(-50),
    }));
    scheduleAutoSave();
  },
  newDocument(size: CanvasSize, name?: string) {
    const doc: DesignDocument = {
      id: uid(),
      name: name || size.name,
      canvas: size,
      elements: [],
      background: '#ffffff',
      backgroundGradient: null,
    };
    setState((s) => ({
      ...s,
      document: doc,
      selectedIds: [],
      history: [],
      future: [],
      zoom: computeFitZoom(size, s),
      panX: 0,
      panY: 0,
    }));
    scheduleAutoSave();
  },
  loadDocument(doc: DesignDocument) {
    setState((s) => ({
      ...s,
      document: doc,
      selectedIds: [],
      history: [],
      future: [],
      zoom: computeFitZoom(doc.canvas, s),
      panX: 0,
      panY: 0,
    }));
    scheduleAutoSave();
  },
  addElement(el: DesignElement) {
    this.updateDocument((doc) => ({
      ...doc,
      elements: [...doc.elements, el],
    }));
    setState((s) => ({ ...s, selectedIds: [el.id] }));
  },
  updateElement(id: string, patch: Partial<DesignElement>, recordHistory = true) {
    this.updateDocument(
      (doc) => ({
        ...doc,
        elements: doc.elements.map((e) =>
          e.id === id ? ({ ...e, ...patch } as DesignElement) : e
        ),
      }),
      recordHistory
    );
  },
  updateElements(ids: string[], patchFn: (el: DesignElement) => Partial<DesignElement>, recordHistory = true) {
    this.updateDocument(
      (doc) => ({
        ...doc,
        elements: doc.elements.map((e) =>
          ids.includes(e.id) ? ({ ...e, ...patchFn(e) } as DesignElement) : e
        ),
      }),
      recordHistory
    );
  },
  deleteElements(ids: string[]) {
    this.updateDocument((doc) => ({
      ...doc,
      elements: doc.elements.filter((e) => !ids.includes(e.id)),
    }));
    setState((s) => ({
      ...s,
      selectedIds: s.selectedIds.filter((i) => !ids.includes(i)),
    }));
  },
  duplicateElement(id: string) {
    const el = state.document.elements.find((e) => e.id === id);
    if (!el) return;
    const copy: DesignElement = { ...clone(el), id: uid(), x: el.x + 30, y: el.y + 30, name: el.name + ' copy' };
    this.addElement(copy);
  },
  reorderElement(id: string, direction: 'front' | 'back' | 'forward' | 'backward') {
    this.updateDocument((doc) => {
      const idx = doc.elements.findIndex((e) => e.id === id);
      if (idx === -1) return doc;
      const els = [...doc.elements];
      const [el] = els.splice(idx, 1);
      if (direction === 'front') els.push(el);
      else if (direction === 'back') els.unshift(el);
      else if (direction === 'forward') els.splice(Math.min(idx + 1, els.length), 0, el);
      else els.splice(Math.max(idx - 1, 0), 0, el);
      return { ...doc, elements: els };
    });
  },
  groupElements(ids: string[]) {
    // simple grouping via a groupId property would go here; for now we just keep multi-select
    void ids;
  },
  saveProject() {
    saveNow();
  },
  getProjects() {
    return listProjects();
  },
  deleteProject(id: string) {
    deleteProject(id);
  },
};

function computeFitZoom(canvas: CanvasSize, s: EditorState): number {
  void s;
  const margin = 80;
  const availW = window.innerWidth - 560;
  const availH = window.innerHeight - 140;
  const z = Math.min(
    (availW - margin) / canvas.width,
    (availH - margin) / canvas.height,
    1
  );
  return Math.max(0.05, Math.min(z, 2));
}

let saveTimer: number | null = null;
function scheduleAutoSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => saveNow(), 800);
}

function saveNow() {
  try {
    const doc = state.document;
    localStorage.setItem(`${STORAGE_KEY}:${doc.id}`, JSON.stringify(doc));
    localStorage.setItem(CURRENT_KEY, doc.id);
    // update index
    const index = listProjects();
    const entry = index.find((p) => p.id === doc.id);
    if (entry) {
      entry.updatedAt = Date.now();
      entry.name = doc.name;
    } else {
      index.unshift({ id: doc.id, name: doc.name, updatedAt: Date.now(), thumbnail: '', document: doc });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(index.map((p) => ({ id: p.id, name: p.name, updatedAt: p.updatedAt }))));
  } catch {
    // storage might be full; ignore
  }
}

function listProjects(): { id: string; name: string; updatedAt: number; thumbnail: string; document: DesignDocument }[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw) as { id: string; name: string; updatedAt: number }[];
    return items.map((i) => {
      const docRaw = localStorage.getItem(`${STORAGE_KEY}:${i.id}`);
      const doc = docRaw ? (JSON.parse(docRaw) as DesignDocument) : null;
      return { ...i, thumbnail: '', document: doc as DesignDocument };
    }).filter((p) => p.document);
  } catch {
    return [];
  }
}

function deleteProject(id: string) {
  try {
    localStorage.removeItem(`${STORAGE_KEY}:${id}`);
    const index = listProjects().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(index.map((p) => ({ id: p.id, name: p.name, updatedAt: p.updatedAt }))));
  } catch {
    // ignore
  }
}

export function useEditor(): EditorState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
